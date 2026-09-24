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
import type { Content, PlanState } from '../types';
import type { VesselAssignment } from './layout';
import { compareScore, penalty, SHAPE_TOLERANCE } from './score';
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

  /** The most loads `s.vessels[i]` (vessel index `i`'s own options) offers for `content` — 0 when
   *  the vessel's `allowed` list rules it out entirely. */
  const capFor = (i: number, content: Content) =>
    Math.max(0, ...s.vessels[i].filter((o) => o.content === content).map((o) => o.loads));

  /**
   * "Certainly cannot win" on `score()`'s own scale, not on the raw g/h and % the caps are
   * expressed in. `fluid`/`carbs` are the most this Decision's vessels and offers could possibly
   * deliver (`fluidCap`/`carbCap` — including the water-or-izo top-up `layout.ts` gives a spent
   * carb vessel at a stop the plan already has, bounded generously by `capFor` rather than
   * re-simulated), so `dryLB`/`carbLB` are lower bounds on the two shortfall terms `score()` would
   * compute (never an overestimate — the real plan can only do worse, not better) — via the exact
   * same `penalty()` those terms are built from. A Decision is unreachable only when even that best
   * case cannot come within `compareScore`'s own tie tolerance of the current best's `toGreen`;
   * comparing the raw caps against a raw `EPS` instead (as this used to) mixes units with
   * `compareScore`'s normalised one and can cut a Decision that would in fact have tied on
   * `toGreen` and won on `stops`.
   */
  function unreachable(assignment: VesselAssignment[], counts: number[]): boolean {
    let fluid = 0;
    let carbs = preRideGut(state.route);
    assignment.forEach((a, i) => {
      if (a.content !== 'gel') fluid += volOf(a.gid) * a.loads;
      carbs += perLoad(a) * a.loads;
      // `layout.ts` tops up a vessel that has finished its carb duty with water — or, failing
      // that, izo — at a stop the plan already has (never a new one), which this decision's raw
      // `loads` says nothing about. Bounded here generously but safely: as much again as the
      // vessel's *own* full-route loadCap for that alternate content would ever allow, which can
      // only overstate the real top-up (covering a shorter, already-partly-fed remainder never
      // needs more loads than covering the whole route solo would).
      if (a.content !== 'water') {
        // Whichever of water/izo the vessel's own `allowed` list offers as the top-up content —
        // both, generously, since either one delivers fluid and only izo also delivers carbs.
        fluid += volOf(a.gid) * (capFor(i, 'water') + capFor(i, 'izo'));
        carbs += perLoad({ gid: a.gid, content: 'izo', loads: 0 }) * capFor(i, 'izo');
      }
    });
    s.offers.forEach((o, i) => {
      fluid += (o.ml ?? 0) * counts[i];
      carbs += o.carbs * counts[i];
    });
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
