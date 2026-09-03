/**
 * The loop that picks a plan.
 *
 * Everything underneath this file is arithmetic: `layout()` turns a decision into a plan, `score()`
 * says how far that plan is from the app's own two green badges. Neither of them chooses anything.
 * This is where the choosing happens, and it is deliberately the dumbest search that can express the
 * owner's rules: hill-climbing over a small decision — what each vessel carries, how many times it
 * is filled, and how much of the rider's product selection the plan actually takes.
 *
 * A move is accepted only when it **strictly improves** the lexicographic score, so every step goes
 * downhill and a cycle is impossible by construction. `MAX_STEPS` is a safety net, not the mechanism.
 *
 * **The four tiers are an escalation, not a weighting.** In the owner's words: *"bierzemy najpierw to
 * co mamy z domu, staramy się dokładać izo, żel, produkty; jeżeli postój to zakładamy że dolewamy
 * wodę, żeby nie wozić proszku ze sobą. Jeżeli sama woda nie wystarczy to wtedy dopiero dodatkowe
 * porcje proszku do rozrobienia."*
 *
 * | tier | move                                     | what it means for the rider          |
 * |------|------------------------------------------|--------------------------------------|
 * | 0    | change a vessel's content                | what he leaves home with             |
 * | 1    | take one more / one fewer product        | what is in his pockets               |
 * | 2    | one more load into a **water** vessel    | a stop that pours water — free       |
 * | 3    | one more load into an **izo/gel** vessel | a sachet hauled from home            |
 *
 * A tier is only reached when the one above it has nothing left to offer, and the loop restarts from
 * tier 0 after every accepted move. That ordering cannot be expressed as a penalty inside `score()`:
 * carrying sachets costs weight and faff that `planSummary()` cannot see, so on the score alone the
 * loop would happily haul powder to buy a single g/h. `score()`'s `powderCarried` tie-break only
 * separates plans that are already equal on the objective and on stops; the escalation is what keeps
 * powder from being bought with green in the first place.
 *
 * **The selection is an offer, and its order is a priority.** *"To nie reguła, po prostu jak wrzucam
 * coś na koniec listy to zakładam że to mogę zużyć ale nie muszę; pierwszeństwo ma góra listy, czyli
 * priorytetem jest kolejność."* So tier 1 walks the list **top-down** and takes the **first** entry
 * that improves the plan, rather than the best-scoring one — otherwise the loop reaches past a gel
 * the rider ranked first for a cola that happens to score a fraction better.
 *
 * That is the whole of it: what sits at the bottom of the list is carried in case, and needs no
 * mechanism of its own to stay unopened. Once the plan is green `toGreen` is 0, and one more product
 * moves neither `stops` nor `powderCarried`, so the add ties instead of improving and the "strictly
 * better or it is not a move" rule refuses it already.
 *
 * Tier 1 still goes both ways — a product that stopped earning its place is dropped again — so
 * nothing here needs a separate pruning pass.
 */
import { CARB_GRADING_MIN_HOURS, dist, totalHours } from '../fuel';
import type { Content, PlanState, Vessel } from '../types';
import { layout } from './layout';
import type { VesselAssignment } from './layout';
import { compareScore, score } from './score';
import type { Draft, Score } from './score';
import type { DraftFood, FoodSelectionEntry } from './types';

/**
 * Nothing is eaten in the last slice of the route: carbs arriving at the line never finish
 * absorbing, so a product placed there is a product wasted. The same fraction both scenario suites
 * measure the planner against.
 */
const FINISH_GAP_FRACTION = 0.02;

/**
 * Two products are never open at once and no two ever start at the same kilometre. A millimetre is
 * enough to say so and moves nothing a rider could notice.
 */
const MIN_STEP_KM = 1e-6;

/**
 * Safety net, not the mechanism. Every accepted move strictly improves a score that is bounded
 * below, so the loop stops on its own; this only bounds the damage if that ever stops being true.
 */
export const MAX_STEPS = 200;

/** The one tier whose candidates come in an order that means something — the rider's own priority
 *  list — so it takes the first that improves rather than weighing them all. See `movesInTier`. */
const FIRST_IMPROVING_TIER = 1;

/** One line of the rider's selection, resolved against his food library. */
type Offer = {
  key: string;
  carbs: number;
  ml?: number;
  cont: boolean;
  span: number;
  /** A product bought en route rather than carried — so eating it *is* a stop. */
  needsStop: boolean;
  /** How many of these the rider offered. The plan may take fewer, never more. */
  max: number;
};

/** Everything the search gets to decide. */
type Decision = {
  assignment: VesselAssignment[];
  /** One entry per offer, in the selection's own priority order: how many units the plan takes. */
  counts: number[];
};

type Evaluated = { decision: Decision; draft: Draft; score: Score };

/** A copy of `xs` with index `i` replaced — the whole of how a move is made. */
function withAt<T>(xs: T[], i: number, x: T): T[] {
  const out = xs.slice();
  out[i] = x;
  return out;
}

/**
 * The vessels the search may assign.
 *
 * `layout()` throws on a vessel it cannot place — an unknown `gid`, a duplicate, a content outside
 * `allowed` — and it is right to: a planner that quietly dropped one would score a plan it was not
 * handed. So the two cases a persisted kit can actually be in are filtered out here instead, at the
 * point where they are still a question about the *gear* rather than about the plan.
 */
function usableGear(gear: Vessel[]): Vessel[] {
  return gear.filter(
    (v, i) => v.allowed.length > 0 && gear.findIndex((o) => o.gid === v.gid) === i,
  );
}

/** The rider's selection, resolved against his food library. Unknown keys and empty lines drop
 *  out here rather than being carried through the loop as offers of nothing. */
function offersOf(state: PlanState, selection: FoodSelectionEntry[]): Offer[] {
  const out: Offer[] = [];
  for (const s of selection) {
    const e = state.foodLib.find((x) => x.key === s.key);
    const max = Number.isFinite(s.count) ? Math.floor(s.count) : 0;
    if (!e || max <= 0) continue;
    out.push({
      key: e.key,
      carbs: e.carbs,
      ml: e.ml,
      cont: e.cont === true,
      span: e.span ?? 0,
      needsStop: e.needsStop === true,
      max,
    });
  }
  return out;
}

/** The chosen units, flattened into the order they will be eaten: the selection's own priority
 *  order, which is the rider's ranking and not a carb-density one. */
function chosenOf(offers: Offer[], counts: number[]): Offer[] {
  const out: Offer[] = [];
  offers.forEach((o, i) => {
    for (let j = 0; j < counts[i]; j++) out.push(o);
  });
  return out;
}

/**
 * Hand out `m` items across gaps of the given widths, in proportion to width, largest remainder
 * first. A degenerate route with no width at all puts everything in the first gap.
 */
function allocate(m: number, widths: number[]): number[] {
  const base = widths.map(() => 0);
  const total = widths.reduce((a, w) => a + w, 0);
  if (!(total > 0)) {
    base[0] = m;
    return base;
  }
  const exact = widths.map((w) => (m * w) / total);
  exact.forEach((x, i) => {
    base[i] = Math.floor(x);
  });
  let left = m - base.reduce((a, b) => a + b, 0);
  const byFraction = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (const o of byFraction) {
    if (left <= 0) break;
    base[o.i] += 1;
    left -= 1;
  }
  return base;
}

/**
 * Where the chosen products get eaten.
 *
 * Deliberately not searched over. Three rules decide it outright, so the loop has one fewer
 * dimension to climb and the answer is the same every time:
 *
 * - **A `needsStop` product may create the stop it is bought at.** The flag is the rider's own
 *   "this one I buy on the way" toggle, and buying is a stop — *"na ekranie wyboru kolejności
 *   produktu był toggle do oznaczania czy to jest do kupienia w sklepie czy nie"*. So the bought
 *   products are dealt out evenly across the route, each one becomes a stop in `layout()`, and a
 *   refill that lands near one is pulled onto it by the merge window rather than costing a second
 *   pull-over. (This reverses the rule the search was first built with, which restricted a bought
 *   product to stops the fills had already paid for and left the surplus in the rider's pocket.)
 *   They sit strictly inside the route and never on the start line, which is what the `k + 1` even
 *   split below buys: nobody buys a cola before they have set off.
 * - **Everything else is spread evenly across what is left**, in the rider's own priority order:
 *   the pinned products cut the route into gaps, and the loose ones are shared out between those
 *   gaps in proportion to width. That is the dumbest defensible spread, and the one thing the
 *   combined scenarios ask for is that products cover the ride rather than bunching.
 *
 *   Each product is eaten at the **start** of the stretch it has to feed, not in the middle of it.
 *   That is not cosmetic: `rateStats` credits a gram against the need that comes *after* it and
 *   carries a surplus forward only `COVERAGE_CARRY_MINUTES`, so a product eaten halfway through its
 *   own slot leaves the first half of that slot fed by nothing and then has to be squeezed against
 *   the finish gap at the far end. Measured on the two-pack-of-chews scenario, moving from slot
 *   centres to slot starts is the difference between 76% and full coverage of the same 60 g.
 * - **Nothing is open twice and nothing lands on the line.** A continuous product ends where the
 *   next one starts at the latest, and the last `FINISH_GAP_FRACTION` of the route is left clear.
 */
function placeFoods(state: PlanState, chosen: Offer[]): DraftFood[] {
  const D = dist(state.route);
  const end = D * (1 - FINISH_GAP_FRACTION);
  if (!(end > 0) || chosen.length === 0) return [];

  const pinned = chosen.filter((c) => c.needsStop);
  const loose = chosen.filter((c) => !c.needsStop);

  // The bought products, evenly spaced strictly inside `(0, end)`: `k` purchases cut the ride into
  // `k + 1` equal stretches, which is both the widest they can be spread and the one arrangement
  // that puts none of them on the start line.
  const k = pinned.length;
  const at: number[] = [];
  for (let j = 0; j < k; j++) at.push(((j + 1) * end) / (k + 1));

  const bounds = [0, ...at, end];
  const widths = bounds.slice(1).map((b, i) => b - bounds[i]);
  const share = allocate(loose.length, widths);

  // Ride order: the loose products of each gap, then the bought product that closes it.
  const seq: { c: Offer; pos: number }[] = [];
  let next = 0;
  for (let i = 0; i < widths.length; i++) {
    const c = share[i];
    for (let j = 0; j < c; j++) {
      seq.push({ c: loose[next++], pos: bounds[i] + (j * widths[i]) / c });
    }
    if (i < at.length) seq.push({ c: pinned[i], pos: at[i] });
  }

  const out: DraftFood[] = [];
  let cursor = 0;
  for (let i = 0; i < seq.length; i++) {
    const { c, pos } = seq[i];
    const from = Math.max(pos, cursor);
    if (from > end) break;
    // A continuous product runs its own span, but never into the next product or past the line.
    const ceiling = Math.max(from, Math.min(end, i + 1 < seq.length ? seq[i + 1].pos : end));
    const to = c.cont ? Math.min(from + c.span, ceiling) : from;
    if (c.cont && !(to > from)) continue;
    out.push({
      key: c.key,
      carbs: c.carbs,
      ...(c.ml === undefined ? {} : { ml: c.ml }),
      ...(c.cont ? { cont: true } : {}),
      from,
      to,
    });
    cursor = to + MIN_STEP_KM;
  }
  return out;
}

/** One decision, laid out and scored. Food placement is a pure function of the decision, so a
 *  decision determines its draft exactly and the memo below is sound. */
function evaluate(state: PlanState, offers: Offer[], decision: Decision): Evaluated {
  const chosen = chosenOf(offers, decision.counts);
  const draft = layout(state, decision.assignment, placeFoods(state, chosen));
  return { decision, draft, score: score(state, draft) };
}

/**
 * The candidate decisions one tier away from `d`. See the table at the top of the file.
 *
 * Tier 1's order is load-bearing, because that tier takes the *first* improving candidate rather
 * than the best one: it is the rider's own priority order, walked from the top.
 */
function movesInTier(tier: number, d: Decision, gear: Vessel[], offers: Offer[]): Decision[] {
  const out: Decision[] = [];
  if (tier === 0) {
    d.assignment.forEach((a, i) => {
      for (const c of gear[i].allowed) {
        if (c !== a.content)
          out.push({ ...d, assignment: withAt(d.assignment, i, { ...a, content: c }) });
      }
    });
    return out;
  }
  if (tier === 1) {
    offers.forEach((o, i) => {
      if (d.counts[i] < o.max) out.push({ ...d, counts: withAt(d.counts, i, d.counts[i] + 1) });
      if (d.counts[i] > 0) out.push({ ...d, counts: withAt(d.counts, i, d.counts[i] - 1) });
    });
    return out;
  }
  // Tiers 2 and 3 are the same move — one load's difference — split by what the vessel holds, which
  // is the whole of the owner's "water first, powder only if water cannot do it".
  //
  //
  // One direction only — a load is added, never taken back. Unlike tier 1's products, a load is
  // never a mistake the climb has to undo: it is only ever accepted because it strictly improved the
  // score, and dropping it would restore exactly the plan it beat. (A symmetric "one fewer load"
  // move was tried and changed nothing on any of the thirty-four scenarios, because the ridges this
  // search does get stuck on need *two* vessels changed at once, which no single-vessel move set can
  // express. See the note above `search`.)
  const wanted = (c: Content) => (tier === 2 ? c === 'water' : c !== 'water');
  d.assignment.forEach((a, i) => {
    if (wanted(a.content)) {
      out.push({ ...d, assignment: withAt(d.assignment, i, { ...a, loads: a.loads + 1 }) });
    }
  });
  return out;
}

function keyOf(d: Decision): string {
  return `${d.assignment.map((a) => `${a.gid}:${a.content}:${a.loads}`).join('|')}#${d.counts.join(',')}`;
}

/**
 * Climb from the plan the rider would have without thinking — every vessel filled once with what it
 * naturally holds, nothing in the pockets — to the best one the tiers can reach.
 *
 * **Where this stops short, and why it is a ridge rather than a bug.** Every move changes one
 * vessel, and there are kits whose best plan needs two changed together. Measured by enumerating the
 * whole decision space of the 120 km izo-650-plus-water-750 scenario: the best assignment on the
 * board is four izo loads and a single water one — both badges green, three stops — and the climb
 * lands instead on one izo load and three water ones, 0.15 from green. It cannot get there, because
 * water fixes the larger penalty first and every later izo load then pours the plan past
 * `SURPLUS_WARN_PCT`; the only way across is to add izo *and* drop water in the same step. The same
 * shape stops the 130 km concentrated-mix scenario, where the crossing is a content change and a
 * load count on the same bottle. Widening the move set to pairs is a real answer to this, and a much
 * bigger search than the owner asked for; it is deliberately not attempted here.
 */
export function search(state: PlanState, selection: FoodSelectionEntry[] = []): Draft {
  const gear = usableGear(state.gear);
  // Under `CARB_GRADING_MIN_HOURS` the app greys the carb chart out and `coverageStatus` answers
  // 'unneeded', so the owner's ruling is that the planner hands back an empty product list there:
  // *"tak dla poniżej 1h wykres jest szary, więc autoplan powinien zwrócić pustą listę."* There is
  // nothing for food to buy on such a ride, and `score()` says the same thing from the other side by
  // switching its carb shortfall term off. The bottles are still planned — water is graded on sweat
  // loss against body mass and does not know about the hour rule (see `hydrationStatus`, which never
  // answers 'unneeded'), and a 24 km ride at 35 C still costs the rider a litre.
  const offers =
    totalHours(state.route) >= CARB_GRADING_MIN_HOURS ? offersOf(state, selection) : [];
  const start: Decision = {
    assignment: gear.map((v) => ({ gid: v.gid, content: v.allowed[0], loads: 1 })),
    counts: offers.map(() => 0),
  };

  // The same candidate comes up again after every accepted move, because the loop restarts at tier
  // 0 each time. Scoring one means a `planSummary()` over the whole route, so it is worth
  // remembering; the key is the decision itself, and a decision determines its draft exactly.
  const seen = new Map<string, Evaluated>();
  const look = (d: Decision): Evaluated => {
    const k = keyOf(d);
    const hit = seen.get(k);
    if (hit) return hit;
    const e = evaluate(state, offers, d);
    seen.set(k, e);
    return e;
  };

  let current = look(start);
  for (let step = 0; step < MAX_STEPS; step++) {
    let accepted = false;
    for (let tier = 0; tier <= 3 && !accepted; tier++) {
      let best: Evaluated | null = null;
      for (const m of movesInTier(tier, current.decision, gear, offers)) {
        const e = look(m);
        // The rider's selection is a priority list, so tier 1 takes the first candidate that helps
        // and stops looking. Every other tier is a set of interchangeable moves with no order of
        // its own, so it takes the best one.
        if (tier === FIRST_IMPROVING_TIER) {
          if (compareScore(e.score, current.score) < 0) {
            best = e;
            break;
          }
          continue;
        }
        if (best === null || compareScore(e.score, best.score) < 0) best = e;
      }
      // Strictly better, or it is not a move: this is what makes the climb finite.
      if (best !== null && compareScore(best.score, current.score) < 0) {
        current = best;
        accepted = true;
      }
    }
    if (!accepted) break;
  }
  return current.draft;
}
