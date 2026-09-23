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
import { compareScore, SHAPE_TOLERANCE } from './score';
import { evaluate, space, usableGear } from './search';
import type { Decision, Evaluated } from './search';
import type { FoodSelectionEntry } from './types';

const EPS = 1e-9;

/** A plan past which only fewer stops, sachets, bottles or gut can still win. */
function settled(e: Evaluated): boolean {
  return e.score.toGreen <= EPS && e.score.shapeShort <= SHAPE_TOLERANCE;
}

export function* improve(
  state: PlanState,
  selection: FoodSelectionEntry[],
  start: Evaluated,
  seen: { n: number } = { n: 0 },
): Generator<Evaluated, void, void> {
  const s = space(state, selection);
  const gear = usableGear(state.gear);
  const hrs = totalHours(state.route);
  const empty = planSummary({ ...state, fills: [], foods: [] });
  const sweatLoss = empty.sweatLoss;
  const allowed = allowedDeficitPct(state.route.temp);
  const floor =
    hrs >= CARB_GRADING_MIN_HOURS ? carbFloorGph(empty.carbTargetGph, state.route.intensity) : 0;
  const perLoad = (a: VesselAssignment) =>
    a.content === 'water'
      ? 0
      : carbsFill(
          { fid: 0, gid: a.gid, content: a.content, from: 0, to: 1 },
          state.gear,
          state.mix,
        );
  const volOf = (gid: string) => gear.find((v) => v.gid === gid)!.vol;

  let best = start;
  const maxM = Math.max(1, ...s.vessels.map((opts) => Math.max(...opts.map((a) => a.loads))));
  const chosen: number[] = [];

  function unreachable(assignment: VesselAssignment[], counts: number[]): boolean {
    let fluid = 0;
    let carbs = preRideGut(state.route);
    for (const a of assignment) {
      if (a.content !== 'gel') fluid += volOf(a.gid) * a.loads;
      carbs += perLoad(a) * a.loads;
    }
    s.offers.forEach((o, i) => {
      fluid += (o.ml ?? 0) * counts[i];
      carbs += o.carbs * counts[i];
    });
    const dry =
      waterBalancePct({ sweatLoss, fluidPlanned: fluid, weight: state.route.weight }) <
      -allowed - EPS;
    const hungry = floor > 0 && hrs > 0 && carbs / hrs < floor - EPS;
    return dry || hungry;
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
