/**
 * From a decision to a plan.
 *
 * The search decides *what each vessel carries and how many times it is filled*. This module turns
 * that one sentence into an actual plan: where each fill starts and ends, and where the rider has
 * to pull over. It contains no search of its own — every position below is either computed from
 * `spans.ts` (which inverts the app's own need curve) or forced by one of the owner's rules. Two
 * calls with the same arguments give the same draft.
 *
 * The rules it implements, in the owner's terms:
 *
 * **Handover is free; only a refill costs a stop.** Bottles hand over to each other. Vessel A runs
 * dry and vessel B takes over on the load it left home with — that costs nothing, wherever on the
 * route it happens, because B's izo was mixed in the kitchen. A *refill* — a vessel that has already
 * been used being filled again — needs a tap, so it needs a stop. A fill is a refill exactly when
 * its vessel has an earlier fill, in ride order. Same predicate as `score.ts`'s `powderCarried`,
 * and as the two scenario suites', on purpose: there is one definition of a refill on this branch.
 *
 * **One stop tops up every bottle at once**, so stops are counted per round, not per bottle. For a
 * stream needing `L` loads across `V` vessels that is `stops ≈ max(0, L − V)` — the home load is
 * the `− V`. The owner's worked example: 2 izo bottles + a gel flask + a bladder cover 100 km with
 * **zero** stops, because `L ≤ V` in either stream.
 *
 * **Vessels within one stream run in round-robin relay.** The owner's own 194 km plan reads
 * `izo g1 0→48, g3 48→101, g1 101→150, g3 150→194`: the first pass over the vessels is the home
 * loads (free handovers) and the wrap back onto `g1` at 101 is the first refill, hence the first
 * stop.
 *
 * **Nothing is poured in while the stomach is still full.** A span computed off the need line says
 * when the rider *wants* the next load; it says nothing about whether he can take it. The owner's
 * rule closes that gap — *"nie patrzeć tylko na linię zapotrzebowania, ale też czy jest wypełniony
 * żołądek i nie dokładać następnego jak krzywa cukru w żołądku nie spadnie do 0"* — so a carb load
 * starts at the later of where the previous one ended and where the gut has drained empty. See
 * `gutClearKm`. Water is exempt: it carries no carbs, and *"jak cukru jest dużo to można sięgnąć po
 * samą wodę w tym czasie"* is exactly the gap this opens being drinkable.
 *
 * **Each need is covered once, by the sum of its sources.** There are two needs — carbs and fluid —
 * not three contents' worth of them. Carbs come from izo *and* gel, so every carb-carrying vessel
 * joins **one** relay and their spans tile the carb requirement once between them; that is what
 * makes the owner's plan alternate izo, gel, izo, gel rather than run two full-route streams on top
 * of each other. Fluid comes from izo *and* water, and the izo is already on board, so the water
 * stream is laid out against what the izo does not supply. Rate-matching a fill against a whole
 * need line is right only where that fill is the only thing feeding it.
 *
 * **`allowed` binds** — *"allowed wiąże, bo tylko to można wybrać na wykresie co jest w allowed"*.
 * A vessel holds exactly what its own list says it may, and nothing here ever pours outside it. A
 * gel flask is therefore refilled with gel like any other vessel is refilled with what it carries:
 * the alternative was a flask that sits empty for the rest of the ride, and the owner's ruling is
 * that refills win — *"albo dobra niech będą też dolewki do żelu, fuck it, jak ktoś nie chce to
 * sobie przerobi"*. A second load of gel is a refill and buys a stop exactly as izo's does.
 *
 * **A spent vessel may take water — or, at a pinch, izo — at a stop that already exists, never at a
 * new one.** Once a bottle has finished its carb duty it can be topped up, but it must not buy a
 * stop to do it: a bottle earning its keep this way is not worth pulling over for. Water is the
 * default, because it is free and needs no sachet carried from home; izo is the escalation — *"od
 * biedy izo"* — for a vessel that may not hold water at all *and* only while the relay leaves the
 * finish uncovered, since water cannot close a carb shortfall and a load past the last one the ride
 * needs would be exactly the double-counting this module exists to avoid. `allowed` is the
 * authority on both, so a flask declared `['gel']` alone takes neither, which is no loss now that
 * it can be refilled with gel.
 *
 * Deliberately *not* here:
 *
 * - **Gel dose placement (`Fill.pos`).** A gel flask is `x movable doses`, not a stream, and where
 *   those doses land is a separate, known piece of work. Until it exists a gel vessel is laid out
 *   as an ordinary stream — one continuous span per load — which is the same shape the chart
 *   already draws for a gel fill with no `pos`.
 * - **Choosing the assignment.** That is the search's job. `layout` is the function the search
 *   calls; it never second-guesses what it was handed. The one thing it adds on its own is the
 *   top-up above, and only into a vessel the assignment already spent, only at a stop the plan
 *   already has.
 * - **Placing food.** `foods` is an input and comes back out untouched. All this module does with it
 *   is read which of its entries are `needsStop` products, because buying one is a stop.
 */
import { carbsFill, dist, samples, sweat, totalHours } from '../fuel';
import type { Sample } from '../fuel';
import type { Content, Fill, PlanState, Vessel } from '../types';
import { carbSpanEndKm, waterSpanEndKm } from './spans';
import type { Draft } from './score';
import type { DraftFill, DraftFood, DraftStop } from './types';

/** What one vessel does for the whole ride. */
export type VesselAssignment = {
  gid: string;
  /** What this vessel carries. Must be in the vessel's own `allowed` list — see `layout`. */
  content: Content;
  /** 1 = the home load only; 2 = home load + one refill; ... 0 = the vessel is not used. */
  loads: number;
};

/**
 * Two stops closer than this are the same stop: nobody pulls over twice inside 10 km. The same
 * window both scenario suites measure the planner against (`mergeWindow` there), stated once here
 * so the engine and the suites cannot drift apart on it.
 */
export function mergeWindowKm(D: number): number {
  return Math.min(10, D * 0.2);
}

/**
 * The last slice of the route, which a gel dose may not land in.
 *
 * The owner's rule, once pared back to what it actually needs to be: the fills tile from the start
 * line onward and the end of the route mostly takes care of itself, *"może trochę przy dawce żelu,
 * żeby gdzieś nie wpadł na samym końcu"*. A gel has to absorb and then have some effect, and neither
 * happens in the last few hundred metres — so the one guard is that the gel stream's last delivery
 * does not run onto the line. It is a fraction rather than a distance so that it scales with the
 * route, and it is the same 2% `search.ts` already leaves clear for products and both scenario
 * suites already measure the planner against, because it is the same statement about the same gut.
 *
 * Deliberately not a general finish-gap rule: izo is left exactly where the tiling puts it.
 */
const GEL_FINISH_GAP_FRACTION = 0.02;

/** A load, before merging has had its say. `refill` is the reason a stop exists. */
type Load = DraftFill & { refill: boolean };

/** A count of loads is a count: negative, fractional and non-finite all mean "no loads". */
function loadCount(loads: number): number {
  return Number.isFinite(loads) ? Math.max(0, Math.floor(loads)) : 0;
}

/**
 * Where a full load of `content` in `vessel`, started at `from`, runs out.
 *
 * Carbs go through `fuel.ts`'s own `carbsFill` rather than re-deriving `vol × conc / 100` here —
 * izo and gel read different concentrations off the mix and there must not be a second model of
 * what a bottle holds. Water is simply its volume.
 */
function loadSpanEnd(state: PlanState, vessel: Vessel, content: Content, from: number): number {
  if (content === 'water') return waterSpanEndKm(state.route, from, vessel.vol);
  const probe: Fill = { fid: 0, gid: vessel.gid, content, from, to: from };
  return carbSpanEndKm(state.route, from, carbsFill(probe, state.gear, state.mix));
}

/** A position that wants a stop, and whether it is free to move to get one. */
type Candidate = { at: number; movable: boolean };

/**
 * The km at or after `from` at which the gut has emptied, read off `fuel.ts`'s own gut curve.
 *
 * `curve` is what `samples()` answered for the plan as it stands, so this is the top chart's `gut`
 * lane and nothing else: no drain rate is restated here, no `absCap` is recomputed, no second
 * stomach model exists to disagree with the one the app draws. All this function does is find where
 * that lane touches zero.
 *
 * **Zero is exact, and the curve touches it rather than crossing it — so there is neither an
 * epsilon nor an interpolation to choose.** `stepStomachBuffer` clears `min(buf, capPerStep)` of the
 * backlog, so the step that finishes the backlog computes `buf - buf` and the sample reads exactly
 * `0`; the step after it takes `min(0, cap)` and reads `0` again. The buffer is never negative, so
 * the zero always lands *on* a sample and `gut > 0` is a real predicate about the model rather than
 * a tolerance anyone picked. Interpolating between the last positive sample and the first zero was
 * the alternative considered, and it is arithmetically the same point: with the far end at exactly
 * zero the interpolation parameter is always 1. What the grid does cost is resolution — the answer
 * is quantised to the 161-point profile, 1.2 km on a 194 km route — and that is the price of reading
 * the app's own curve instead of building a continuous copy of it here, which is the one thing this
 * engine must not do.
 *
 * The gut being empty *before* the load came due is not a deferral at all, hence the two early
 * returns: a load waits only for a backlog that is still there when its turn arrives.
 *
 * A gut that never empties again answers with the finish line, which is the honest reading — there
 * is nowhere left on this route to start another load — and `relay`'s own `x >= D` guard then drops
 * it rather than planning a fill of no length.
 */
function gutClearKm(curve: Sample[], from: number): number {
  let i = 0;
  while (i < curve.length && (curve[i].x < from || curve[i].gut > 0)) i++;
  if (i >= curve.length) return curve[curve.length - 1].x;
  if (i === 0) return from;
  if (!(curve[i - 1].gut > 0)) return from;
  return curve[i].x;
}

/** One vessel's part in a relay: how many turns it takes, and how far each turn reaches. */
type Leg = { a: VesselAssignment; turns: number; spanEnd: (from: number) => number };

/**
 * Where the next load may start, given the ones already placed. See `carbGate` in `layout`.
 */
type Gate = (from: number, placed: Load[]) => number;

/** No gate at all: the load starts the moment the one before it ended. */
const NO_GATE: Gate = (from) => from;

/**
 * Run `legs` as a round-robin relay from km 0, each load starting where the last one ended — or
 * where `gate` lets it, if that is later.
 *
 * A vessel takes its turn in pass `r` only if it was given more than `r` turns, so the first pass
 * is the home loads — free handovers — and every later turn is a refill. A load that reaches
 * nowhere (an empty vessel, or a stream with nothing left to cover) is not a fill and must not
 * stall the relay: it is skipped without consuming the vessel's turn as "used".
 *
 * The gate moves `x` rather than only the load about to be placed, so a deferral is permanent: the
 * relay never walks back to fill in a gap it was told the rider could not absorb.
 */
function relay(legs: Leg[], D: number, gate: Gate = NO_GATE): Load[] {
  const rounds = Math.max(0, ...legs.map((l) => l.turns));
  const used = new Set<string>();
  const stream: Load[] = [];
  let x = 0;
  for (let r = 0; r < rounds && x < D; r++) {
    for (const leg of legs) {
      if (x >= D) break;
      if (leg.turns <= r) continue;
      x = Math.max(x, gate(x, stream));
      if (x >= D) break;
      const to = Math.min(D, leg.spanEnd(x));
      if (!(to > x)) continue;
      const { gid, content } = leg.a;
      stream.push({ gid, content, from: x, to, refill: used.has(gid) });
      used.add(gid);
      x = to;
    }
  }
  return stream;
}

/**
 * Lay `assignment` out into a draft plan.
 *
 * **Illegal assignments throw.** A vessel asked to carry a content its `allowed` list does not
 * permit, an unknown `gid`, or the same `gid` assigned twice are all rejected with an error rather
 * than skipped. Legality is knowable by the caller from `state.gear` alone, and cheaply; silently
 * dropping a vessel would hand back a plan that is not the one the caller asked for, and the search
 * would then score *that* plan while believing it had measured the other. Every hard bug in the
 * previous engine was some version of "the planner thinks X, the app says Y", so this fails loudly
 * at the point the mistake was made instead of quietly two layers later. `loads: 0` is not an
 * error — that is a legal way to say a vessel is left at home, and neither is `loads: 2` on a gel
 * vessel: gel is refilled like anything else.
 */
export function layout(
  state: PlanState,
  assignment: VesselAssignment[],
  foods: DraftFood[],
): Draft {
  const { route, gear, foodLib } = state;
  const D = dist(route);

  const vesselOf = new Map<string, Vessel>();
  for (const a of assignment) {
    const v = gear.find((g) => g.gid === a.gid);
    if (!v) throw new Error(`layout: assignment names vessel "${a.gid}", which is not in the gear`);
    if (!v.allowed.includes(a.content)) {
      throw new Error(`layout: vessel "${a.gid}" may not carry ${a.content}`);
    }
    if (vesselOf.has(a.gid)) throw new Error(`layout: vessel "${a.gid}" is assigned twice`);
    vesselOf.set(a.gid, v);
  }

  // --- The gut gate ---------------------------------------------------------------------------
  //
  // The owner's rule: the next carb load waits for the stomach to clear. `Sample.gut` is a property
  // of the *whole* plan, so the curve this reads is rebuilt from the loads placed so far — plus
  // `foods`, which are fixed before `layout` is called and load the gut exactly as a bottle does.
  // That is sound because the gut at km `x` depends only on what arrived before `x`, and everything
  // before the load being placed is already final.
  //
  // With one bias worth naming: `absCap()` blends izo's and gel's malto:fructose ratios by how many
  // grams of each the *plan* carries, and a partial plan carries fewer. On the owner's 194 km kit
  // (izo `ratio` 1.2, gel 2) the partial curve reads 70 g/h where the finished plan reads 85, so the
  // gut appears to drain slower and each load is deferred a little further than the finished plan
  // would justify — conservative, in the direction the ruling is pushing. Laying the whole stream
  // out first and iterating the deferrals to a fixed point is the other shape, and it would read the
  // finished plan's cap; it was rejected on structure rather than on a measurement, because it gates
  // every load against a curve built from load positions the same pass is about to move, so only the
  // last iteration means anything and nothing guarantees it arrives inside the iteration cap. The
  // pass below has no convergence to fail and gates every load on intake that is already settled,
  // paying for that with a cap that is one plan behind. Nobody has measured the two against each
  // other on the scenario suites.
  //
  // The curve is a function of the loads placed, so it is rebuilt when that list grows and not once
  // per attempted load: `samples()` is the expensive call in this file.
  const gutFoods = foods.map((f, i) => ({ ...f, id: i + 1, name: f.key }));
  let curve: Sample[] | null = null;
  let curveFor = -1;
  const carbGate: Gate = (from, placed) => {
    if (curve === null || curveFor !== placed.length) {
      curve = samples({
        ...state,
        fills: placed.map((f, i) => ({
          fid: i + 1,
          gid: f.gid,
          content: f.content,
          from: f.from,
          to: f.to,
        })),
        foods: gutFoods,
      });
      curveFor = placed.length;
    }
    return gutClearKm(curve, from);
  };

  // --- Tile the carb stream ------------------------------------------------------------------
  //
  // izo and gel are two sources of one need, so they share one relay and tile the carb requirement
  // once between them. The vessels keep the order the assignment gave them, because that order *is*
  // the handover order and it is one of the search's decisions; interleaving izo and gel in the
  // rotation is the point, not an accident of it. A gel vessel is an ordinary member of the
  // rotation — a second turn is a refill and buys a stop, exactly as a bottle's does.
  const carbStream = relay(
    assignment
      .filter((a) => a.content !== 'water')
      .map((a) => {
        const vessel = vesselOf.get(a.gid) as Vessel;
        return {
          a,
          turns: loadCount(a.loads),
          spanEnd: (from: number) => loadSpanEnd(state, vessel, a.content, from),
        };
      }),
    D,
    carbGate,
  );

  // --- Tile the water stream, against what the izo leaves unmet -------------------------------
  //
  // izo pours fluid as well as carbs. Matching a water vessel against the whole sweat loss would
  // pour it on top of a requirement the bottles on board already meet part of, so what is left for
  // water to cover is
  //
  //     residual = sweat × totalHours − (millilitres of izo the plan actually carries)
  //
  // counted off the carb stream above — which is why that had to be laid out first: a load that
  // fell past the finish line was never planned and pours nothing. A residual of zero or less means
  // the izo alone covers the ride's fluid, and the honest answer there is that the water vessels get
  // no fills.
  const fluidNeed = sweat(route) * totalHours(route);
  const izoMl = carbStream
    .filter((f) => f.content === 'izo')
    .reduce((ml, f) => ml + (vesselOf.get(f.gid) as Vessel).vol, 0);
  const residualFluid = fluidNeed - izoMl;

  // `spans.ts` inverts the fluid need line from its whole-ride total, and that total enters the
  // inversion only through the ratio `delivered / rideTotal`. Asking it about `ml × need / residual`
  // against the full line is therefore exactly asking about `ml` against the residual one — which
  // keeps `spans.ts` the single model of the curve rather than adding a second entry point for a
  // rescaled copy of it. A ride with no fluid requirement at all (a zero-distance route) has no
  // residual to speak of and keeps `waterSpanEndKm`'s own answer: a fill against a line that demands
  // nothing reaches the finish.
  const waterSpanEnd = (from: number, ml: number): number => {
    if (!(fluidNeed > 0)) return waterSpanEndKm(route, from, ml);
    if (!(residualFluid > 0)) return from;
    return waterSpanEndKm(route, from, (ml * fluidNeed) / residualFluid);
  };

  // No gate here, and that is the other half of the owner's rule rather than an omission: water
  // carries no carbs, so it neither fills the stomach's sugar backlog nor has to wait for it to
  // clear — *"jak cukru jest dużo to można sięgnąć po samą wodę w tym czasie, jeżeli mamy za mało w
  // ogólnym rachunku"*. The water stream keeps starting at km 0 and running seam to seam, `woda do
  // końca` and all.
  const waterStream = relay(
    assignment
      .filter((a) => a.content === 'water')
      .map((a) => {
        const vessel = vesselOf.get(a.gid) as Vessel;
        return {
          a,
          turns: loadCount(a.loads),
          spanEnd: (from: number) => waterSpanEnd(from, vessel.vol),
        };
      }),
    D,
  );

  // **Water is rationed to the finish.** Rate-matching is the right span for a load that hands over
  // to another one; it is the wrong span for the *last* water load, because there is nothing after
  // it. The owner's rule is *"woda do końca"*: a bottle holding less than the ride demands gets
  // spread over the whole route rather than drunk out early. Without this, a 350 ml bottle on a
  // 15 km ride is laid out 0→5.9 and the rider spends nine kilometres with an empty bidon.
  //
  // Only the last load moves, so every handover before it stays exactly where the need line put it.
  const lastWater = waterStream[waterStream.length - 1];
  if (lastWater) lastWater.to = D;

  // The two needs are drunk at the same time, so the water stream starts again at km 0 rather than
  // queueing behind the carb one.
  const streams = [carbStream, waterStream].filter((s) => s.length > 0);

  // --- Collect what wants a stop ------------------------------------------------------------
  //
  // Refills, plus one for each `needsStop` product: you don't carry a cola for 40 km, you buy it,
  // and buying it is a stop. `needsStop` lives on the food library, not on the draft entry, so it
  // is read back through `state.foodLib` by key.
  const stopFoods = foods.filter((f) => foodLib.find((e) => e.key === f.key)?.needsStop);

  const candidates: Candidate[] = [];
  for (const stream of streams) {
    for (const f of stream) if (f.refill) candidates.push({ at: f.from, movable: true });
  }
  // A product's position was chosen by the caller and comes back out unchanged, so it cannot move;
  // a fill boundary can. That asymmetry decides which one a merge pulls the other onto.
  for (const f of stopFoods) candidates.push({ at: f.from, movable: false });
  candidates.sort((a, b) => a.at - b.at);

  // --- Merge nearby stops -------------------------------------------------------------------
  //
  // A cluster is closed as soon as a candidate sits `mergeWindowKm` or more past the one that
  // opened it — so every cluster is narrower than the window and no boundary is ever dragged
  // further than that, which is what makes the move affordable. (Chaining on the *previous*
  // member instead would let a run of near-misses walk a boundary arbitrarily far.)
  //
  // The representative is the earliest immovable candidate in the cluster if it has one, and
  // otherwise its earliest candidate. Immovable first because a product must be bought where it
  // is; earliest because a boundary that moves earlier means topping up slightly before the bottle
  // ran dry, while one that moves later means riding on an empty bottle — and `fuel.ts` carries
  // unspent credit forward but cannot invent delivery that never happened.
  const w = mergeWindowKm(D);
  const clusters: Candidate[][] = [];
  for (const c of candidates) {
    const open = clusters[clusters.length - 1];
    if (open && c.at - open[0].at < w) open.push(c);
    else clusters.push([c]);
  }
  const reps = clusters.map((cl) => (cl.find((c) => !c.movable) ?? cl[0]).at);
  const repOf = (at: number): number => {
    const i = clusters.findIndex((cl) => cl.some((c) => c.at === at));
    return i < 0 ? at : reps[i];
  };

  // --- Rewrite the boundaries the merge moved -----------------------------------------------
  //
  // A water stream is still a chain — each load begins where the last ended — and moving a refill's
  // start there shortens or lengthens its neighbour instead of tearing a hole. The carb stream is
  // no longer a chain: the gut gate leaves deliberate holes in it, so a load carries its own `to`
  // and a move is absorbed only where the two loads were actually glued together. Across a gate's
  // gap there is nothing to absorb it — stretching a load over a stretch the gut ruled out would
  // pour exactly the delivery the gate exists to refuse — so the hole simply changes width.
  //
  // The rest of the stream is deliberately **not** re-tiled from the new boundary: the move is
  // absorbed by the two loads either side of it, because re-tiling would shift every later boundary
  // and could undo merges already made further down the route.
  const fills: DraftFill[] = [];
  for (const stream of streams) {
    const n = stream.length;
    const from = stream.map((f) => f.from);
    const to = stream.map((f) => f.to);
    // `from[0]` is 0 and is never a refill — the first load of a stream is some vessel's first.
    for (let i = 1; i < n; i++) if (stream[i].refill) from[i] = repOf(from[i]);
    for (let i = 1; i < n; i++) {
      // A merge onto a *later* product can push a boundary past the one after it, and one onto an
      // earlier product can pull it back before its predecessor. Clamping keeps the stream ordered;
      // the load it collapses is one whose whole span was swallowed by the merge, which delivers
      // nothing over no distance and so is not planned.
      from[i] = Math.min(D, Math.max(from[i], from[i - 1]));
      to[i - 1] = stream[i].from === stream[i - 1].to ? from[i] : Math.min(to[i - 1], from[i]);
    }
    for (let i = 0; i < n; i++) {
      to[i] = Math.min(D, Math.max(to[i], from[i]));
      if (to[i] <= from[i]) continue;
      fills.push({ gid: stream[i].gid, content: stream[i].content, from: from[i], to: to[i] });
    }
  }

  // --- The stops the plan actually has ------------------------------------------------------
  //
  // Read back off the surviving fills rather than off the candidate list, so that the two
  // directions the suites check — every refill has a stop, every stop serves something — hold even
  // when a collapse above removed a load.
  const seen = new Set<string>();
  const at = new Set<number>();
  for (const f of [...fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) at.add(f.from);
    else seen.add(f.gid);
  }
  for (const f of stopFoods) at.add(repOf(f.from));
  const stops: DraftStop[] = [...at].sort((a, b) => a - b).map((x) => ({ at: x }));

  // --- Topping up vessels that are empty -----------------------------------------------------
  //
  // Only at a stop the plan already has. The fill starts at the stop, not where the bottle ran dry,
  // so a gap between the two is real: the rider carried an empty bottle for that stretch. Repeats at
  // each later stop the bottle is empty at, since one stop tops up every bottle at once.
  //
  // **A relay vessel is empty between its turns, not busy until the last of them.** This used to ask
  // whether the stop came after `max(to)` over the vessel's fills, which is a different question on
  // any vessel that hands over and comes back: a bidon running `0→14` and again `52→53` was read as
  // occupied for the whole 38 km in between and lost every top-up in that gap. That made the layout
  // *non-monotone in loads* — adding a load to a vessel could push its last `to` past stops it had
  // been drinking water at and hand back a plan carrying strictly less fluid than the one before it
  // (measured: `izo:1`+gel → 2610 ml, `izo:2`+gel → 2210 ml on the same 53 km route). A search that
  // only accepts a strictly better plan cannot climb through that, so it stalled one load short.
  // The vessel's own fills are the authority on when it is occupied, and it is occupied only over
  // the stretches they actually cover — with the home load an exception that is not one, since the
  // first load is mixed in the kitchen and rides along from km 0 whether or not it is being drunk.
  //
  // Water first — it is free, available everywhere, and costs no sachet carried from home. izo is
  // the escalation, and only under both of its conditions: the vessel's `allowed` list must rule
  // water out, and the carb relay must still leave the finish uncovered. The second condition is
  // what keeps this from undoing the rest of the module — water cannot close a shortfall in carbs,
  // which is the "od biedy" the owner's rule is about, but a load poured after the relay already
  // reaches the line is carbs the ride never asked for, and carrying those twice is the thing this
  // whole file was rewritten to stop. `allowed` is the authority throughout: a flask declared
  // `['gel']` alone takes neither, which costs it nothing now that it can be refilled with gel.
  //
  // Note the water is measured against the *whole* fluid need, not the residual the stream above
  // used: a top-up is not part of that stream and has no rate to match, it simply says how far this
  // bottle of water goes.
  let carbReach = fills.reduce((x, f) => (f.content === 'water' ? x : Math.max(x, f.to)), 0);
  for (const a of assignment) {
    if (a.content === 'water') continue;
    const vessel = vesselOf.get(a.gid) as Vessel;
    const topUp: Content | null = vessel.allowed.includes('water')
      ? 'water'
      : vessel.allowed.includes('izo')
        ? 'izo'
        : null;
    if (topUp === null) continue;
    const own = fills.filter((f) => f.gid === a.gid).sort((x, y) => x.from - y.from);
    if (own.length === 0) continue;
    // `due` is the vessel's next scheduled load and `empty` the km from which it holds nothing —
    // advanced by each load the stops walk past, and by each top-up poured. Both lists are in ride
    // order, so one pass over the stops settles every gap.
    let due = 1;
    let empty = own[0].to;
    for (const s of stops) {
      if (s.at >= D) continue;
      while (due < own.length && own[due].from <= s.at) {
        empty = Math.max(empty, own[due].to);
        due += 1;
      }
      if (s.at < empty) continue;
      if (topUp === 'izo' && carbReach >= D) break;
      const reach =
        topUp === 'water'
          ? waterSpanEndKm(route, s.at, vessel.vol)
          : loadSpanEnd(state, vessel, 'izo', s.at);
      // A top-up fills a gap; it never runs into the load the vessel is next due to take, which
      // would draw one bottle holding two things at once.
      const to = Math.min(due < own.length ? own[due].from : D, reach);
      if (!(to > s.at)) continue;
      fills.push({ gid: a.gid, content: topUp, from: s.at, to });
      empty = to;
      if (topUp === 'izo') carbReach = Math.max(carbReach, to);
    }
  }

  // **No gel dose on the line.** The one end-of-route guard the owner asked for: the last gel
  // delivery is pulled back out of the final `GEL_FINISH_GAP_FRACTION` of the route, so a dose never
  // lands somewhere it can neither absorb nor do anything. Applied last, on the finished fill list,
  // so that nothing upstream — the relay's handovers, the merge, the stop list, the top-ups — is
  // reasoning about a span that this then changes underneath it. A gel fill that starts inside the
  // gap already is left alone: trimming it would leave a fill of no length, which is not a plan.
  const gelCap = D * (1 - GEL_FINISH_GAP_FRACTION);
  const lastGel = fills
    .filter((f) => f.content === 'gel')
    .sort((a, b) => a.from - b.from)
    .at(-1);
  if (lastGel && lastGel.to > gelCap && gelCap > lastGel.from) lastGel.to = gelCap;

  // Ride order, stable — so fills that start together stay in stream order, and the top-ups above
  // land next to the fills they follow rather than in a block at the end.
  fills.sort((a, b) => a.from - b.from);

  return { fills, foods, stops };
}
