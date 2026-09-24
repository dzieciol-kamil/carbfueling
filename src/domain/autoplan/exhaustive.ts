/**
 * The whole space, searched for plans strictly better than the climb's — for the thinking modal,
 * which shows each one as it arrives. Only cuts that cannot lose the best plan: see the design
 * doc, docs/superpowers/specs/2026-09-23-autoplan-thinking-modal-design.md.
 *
 * **Two cuts from that design doc are deliberately not here — ruling R3, 2026-09-24.** Their own
 * "bounds the cuts rely on" tests (`exhaustive.test.ts`) found real counterexamples on fixtures
 * inside the brief's own range, so neither assumption holds and neither cut is safe:
 *
 * - **Twin dedup** assumed swapping two identical vessels' assignments never changes the score.
 *   `layout.ts`'s relay is order-sensitive — vessel array order *is* the handover order — so
 *   swapping two same-`vol`/`gelParts`/`allowed` vessels with *different* load counts can widen or
 *   narrow a refill's mergeable "empty window" and change `stops` (twins kit: `g1×2, g2×1` scores
 *   1 stop; swapped to `g2×1, g1×2`, 2 stops, everything else equal).
 * - **Too-many-stops** assumed `score.stops ≥ maxLoads − 1` for a decision's busiest vessel, and
 *   used it to end the whole `M`-ascending search early. `space()`'s `loadCap` deliberately
 *   over-provisions ("+1" beyond what covers the ride), so a vessel's *top* assigned load can go
 *   unpoured before the route ends — `relay()` stops the instant `x >= D` — leaving real `stops`
 *   below `maxLoads − 1` (twins kit: `g1` assigned 4 water loads, only 3 ever poured, 2 stops).
 */
import {
  allowedDeficitPct,
  carbFloorGph,
  carbsFill,
  CARB_GRADING_MIN_HOURS,
  planSummary,
  preRideGut,
  totalHours,
  waterBalancePct,
} from '../fuel';
import type { PlanState } from '../types';
import type { VesselAssignment } from './layout';
import { compareScore, penalty, SHAPE_TOLERANCE } from './score';
import { evaluate, space, usableGear } from './search';
import type { Decision, Evaluated, Space } from './search';
import type { FoodSelectionEntry } from './types';

const EPS = 1e-9;

/** A plan past which only fewer stops, sachets, bottles or gut can still win. */
function settled(e: Evaluated): boolean {
  return e.score.toGreen <= EPS && e.score.shapeShort <= SHAPE_TOLERANCE;
}

/**
 * The most fluid and carbs `decision` could possibly deliver — `fluidCap`/`carbCap` — including
 * `layout.ts`'s "top up a vessel that has finished its carb duty with water, or failing that izo,
 * at a stop the plan already has" (`place()`, "Topping up vessels that are empty"), which this
 * decision's raw `loads` says nothing about on its own.
 *
 * **The top-up bound.** Every top-up lands at a *distinct* stop — `place()`'s top-up loop visits
 * `stops` once and pushes at most one fill per vessel per visit — and every stop in that list is
 * either a refill's `from` (a fill whose vessel already has an earlier one) or a `needsStop`
 * product's position; nothing else opens one before the top-up pass runs. So the number of stops
 * available for *any* vessel's top-ups is at most the number of refills the whole decision's own
 * assignment could produce, `Σ max(0, loads − 1)` over every vessel (a vessel's first load is its
 * home one, never a refill; real refills can only be fewer, per `relay()`'s own early exit — see
 * the note on the too-many-stops cut above), plus one per purchased `needsStop` unit. A vessel's
 * top-ups can never exceed that bound, however large its own `vol` or however long the route runs
 * — unlike a bound built from the vessel's *own* `loadCap`, which is capped at `MAX_LOADS` and so
 * can undercount when the rest of the plan buys more stops than one vessel alone would ever need
 * (measured: three 400 ml water bottles refilled ~10 times each plus a 150 ml water/gel flask on a
 * 250 km, 32 °C ride — the flask's own capped `loadCap` is 14, but the other bottles' refills buy
 * 16 stops, and the flask gets topped up at all but one of them: 15, not 14).
 */
export function packedCaps(
  state: PlanState,
  s: Space,
  decision: Decision,
): { fluidCap: number; carbCap: number } {
  const gear = usableGear(state.gear);
  const volOf = (gid: string) => gear.find((v) => v.gid === gid)!.vol;
  const perLoad = (content: 'water' | 'izo' | 'gel', gid: string) =>
    content === 'water'
      ? 0
      : carbsFill({ fid: 0, gid, content, from: 0, to: 1 }, state.gear, state.mix);

  const stopBound =
    decision.assignment.reduce((n, a) => n + Math.max(0, a.loads - 1), 0) +
    s.offers.reduce((n, o, i) => n + (o.needsStop ? decision.counts[i] : 0), 0);

  let fluidCap = 0;
  let carbCap = preRideGut(state.route);
  decision.assignment.forEach((a) => {
    if (a.content !== 'gel') fluidCap += volOf(a.gid) * a.loads;
    carbCap += perLoad(a.content, a.gid) * a.loads;
    // Water first, izo "at a pinch" — the same preference `place()`'s top-up uses, off the same
    // `allowed` list. A vessel already assigned water is never topped up (`place()` skips it).
    if (a.loads > 0 && a.content !== 'water') {
      const vessel = gear.find((v) => v.gid === a.gid)!;
      if (vessel.allowed.includes('water')) {
        fluidCap += vessel.vol * stopBound;
      } else if (vessel.allowed.includes('izo')) {
        fluidCap += vessel.vol * stopBound;
        carbCap += perLoad('izo', a.gid) * stopBound;
      }
    }
  });
  s.offers.forEach((o, i) => {
    fluidCap += (o.ml ?? 0) * decision.counts[i];
    carbCap += o.carbs * decision.counts[i];
  });
  return { fluidCap, carbCap };
}

export function* improve(
  state: PlanState,
  selection: FoodSelectionEntry[],
  start: Evaluated,
  seen: { n: number } = { n: 0 },
): Generator<Evaluated, void, void> {
  const s = space(state, selection);
  const hrs = totalHours(state.route);
  const empty = planSummary({ ...state, fills: [], foods: [] });
  const sweatLoss = empty.sweatLoss;
  const allowed = allowedDeficitPct(state.route.temp);
  // The dryness term's own denominator (score.ts): the deficit of a rider who drank nothing —
  // the far end of the scale, so a fraction of it is comparable to the carb term's fraction of
  // `floor`. Depends only on the state, not the decision, so it is computed once.
  const worstDeficit = -waterBalancePct({
    sweatLoss,
    fluidPlanned: 0,
    weight: state.route.weight,
  });
  const floor =
    hrs >= CARB_GRADING_MIN_HOURS ? carbFloorGph(empty.carbTargetGph, state.route.intensity) : 0;

  let best = start;
  const maxM = Math.max(1, ...s.vessels.map((opts) => Math.max(...opts.map((a) => a.loads))));
  const chosen: number[] = [];

  /**
   * "Certainly cannot win" on `score()`'s own scale, not on the raw g/h and % `packedCaps` is
   * expressed in. `fluidCap`/`carbCap` are the most this Decision could possibly deliver, so
   * `dryLB`/`carbLB` are lower bounds on the two shortfall terms `score()` would compute (never an
   * overestimate — the real plan can only do worse, not better) — via the exact same `penalty()`
   * those terms are built from. A Decision is unreachable only when even that best case cannot come
   * within `compareScore`'s own tie tolerance of the current best's `toGreen`; comparing the raw
   * caps against a raw `EPS` instead (as this used to) mixes units with `compareScore`'s normalised
   * one and can cut a Decision that would in fact have tied on `toGreen` and won on `stops`.
   */
  function unreachable(assignment: VesselAssignment[], counts: number[]): boolean {
    const { fluidCap: fluid, carbCap: carbs } = packedCaps(state, s, { assignment, counts });
    const deficitAtCap = Math.max(
      0,
      -waterBalancePct({ sweatLoss, fluidPlanned: fluid, weight: state.route.weight }),
    );
    const dryLB = penalty(deficitAtCap - allowed, worstDeficit - allowed);
    const carbLB = hrs > 0 ? penalty(floor - carbs / hrs, floor) : 0;
    return dryLB + carbLB > best.score.toGreen + EPS;
  }

  function* counts(
    assignment: VesselAssignment[],
    i: number,
    acc: number[],
  ): Generator<Evaluated, void, void> {
    if (i === s.offers.length) {
      if (settled(best) && unreachable(assignment, acc)) return;
      seen.n += 1;
      const e = evaluate(state, s.offers, { assignment, counts: acc.slice() } as Decision);
      if (compareScore(e.score, best.score) < 0) {
        best = e;
        yield e;
      }
      return;
    }
    for (let c = 0; c <= s.offers[i].max; c++) {
      acc.push(c);
      yield* counts(assignment, i + 1, acc);
      acc.pop();
    }
  }

  function* vessels(M: number, i: number, hitM: boolean): Generator<Evaluated, void, void> {
    if (i === s.vessels.length) {
      if (!hitM) return;
      yield* counts(
        chosen.map((k, j) => s.vessels[j][k]),
        0,
        [],
      );
      return;
    }
    for (let k = 0; k < s.vessels[i].length; k++) {
      const a = s.vessels[i][k];
      if (a.loads > M) continue;
      chosen.push(k);
      yield* vessels(M, i + 1, hitM || a.loads === M);
      chosen.pop();
    }
  }

  // M = 0 is "every vessel left home" (or, with no usable gear, the products alone). Ascending M
  // means the fewest-refill plans come first, which is what a thinking-modal viewer wants to see
  // even though (per R3) M no longer bounds when the search can stop.
  for (let M = 0; M <= maxM; M++) {
    yield* vessels(M, 0, s.vessels.length === 0);
    if (s.vessels.length === 0) return;
  }
}
