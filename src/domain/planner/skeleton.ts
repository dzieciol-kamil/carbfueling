/**
 * L1 — stop skeleton search. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §3, the implementation contract
 * this file follows section for section: §3.2 graph, §3.3 cost, §3.4 needsStop constraint, §3.5
 * "nic nie dokładaj" mode.
 */
import {
  absCap,
  cph,
  dist,
  eff,
  HYDRATION_BUFFER_ML_PER_KG,
  sweat,
  timeAtDistance,
  totalHours,
} from '../fuel';
import { minStopX } from '../autoplan';
import type { MixSettings, PlanState, RouteInput, Vessel } from '../types';
import type { Leg, Shortfall, Skeleton, StopNode } from './types';

/** §3.2 hard bound on lattice size — also the runtime budget in §6 (|P| ≤ 120 ⇒ O(|P|²) ≈ 7200
 *  edge evaluations). */
const MAX_LATTICE_NODES = 120;

/**
 * F1's raw floor, restated as a capacity test (§3.2's derivation: `V ≥ 0.85 × need` is the same
 * statement as "the raw fluid line never drops below 85% of target"). Deliberately its own literal,
 * not `HYDRATION_TARGET_PCT` — §1.1 is explicit the two must never be unified even though they
 * currently share a value; one is the line's shape, the other is the badge.
 */
export const FLUID_FLOOR_FRACTION = 0.85;

/** §3.3 starting weight — discount applied to a rider-placed stop's `stopCost`. Calibrated in L3. */
const RIDER_DISCOUNT = 0.35;

export interface CostWeights {
  wStop: number;
  wLoad: number;
  wShort: number;
}

export interface SkeletonOpts {
  riderStops: number[];
  allowNewStops: boolean;
  weights: CostWeights;
  /**
   * S3/§3.4: how many `needsStop` items the food selection carries. Not a cost term — a floor on
   * how many stops the chosen path must include, enforced as a second (small) DP dimension. L1
   * doesn't see the food selection itself and doesn't decide which stop hosts which item (L2's
   * job) — it only has to guarantee enough of them exist. Defaults to 0 (no constraint).
   */
  minStopsForProducts?: number;
  /**
   * F2's "carried products" fluid — the sum of `ml` off every non-`needsStop` selection item L2's
   * `assignFood` will actually place (`assignFood.ts`'s `placedSelection`), e.g. a pocketed cola.
   * F2 is explicit this is not a bottle, so it doesn't belong in `carryableFluid`'s per-vessel sum —
   * but it still relieves what the bottles have to cover, the same way it does in `planSummary()`'s
   * own `fluidPlanned` (`fuel.ts`). Added flat to every edge's capacity rather than placed at a
   * specific km: L1 has no placement model (§3.1), and P1 already keeps carried products spread
   * close to evenly across the route, so a flat credit is the honest level of precision for a
   * capacity *estimate*, not a lie the way an authored volume/carbs field would be (§2.1). Defaults
   * to 0 (no selection, or nothing in it carries fluid).
   */
  carriedFluidMl?: number;
}

interface PosNode {
  km: number;
  rider: boolean;
}

/** `P = {0} ∪ riderStops ∪ lattice ∪ {D}` (§3.2), or `{0} ∪ riderStops ∪ {D}` when
 *  `allowNewStops` is false (§3.5 — "drop the lattice from the node set"). Exported only so the
 *  console trace (W16, 2026-08-29) can report the lattice size L1 searched over — `buildSkeleton`
 *  itself still calls it the same way it always has. */
export function buildNodes(D: number, riderStops: number[], allowNewStops: boolean): PosNode[] {
  const round = (x: number) => Math.round(x * 1e6) / 1e6;
  const byKm = new Map<number, boolean>();
  byKm.set(round(0), false);
  byKm.set(round(D), false);
  for (const x of riderStops) {
    if (x > 0 && x < D) byKm.set(round(x), true);
  }
  if (allowNewStops) {
    const latticeKm = Math.max(1, D / MAX_LATTICE_NODES);
    for (let k = 1, x = latticeKm; x < D; k++, x = k * latticeKm) {
      const key = round(x);
      if (!byKm.has(key)) byKm.set(key, false);
    }
  }
  return [...byKm.entries()].map(([km, rider]) => ({ km, rider })).sort((a, b) => a.km - b.km);
}

/**
 * Cumulative fluid/carb need at every candidate position, computed once (§6: "precompute per-
 * position cumulative need once, then every edge is O(1)"). Mirrors `samples()`'s `fluidNeed`/
 * `need` fields exactly — both are pure functions of `route` there too (no fills/gear involved) —
 * without paying for a 160-point resample, since `eff()` (which `samples()` itself calls) can be
 * evaluated directly at each candidate km.
 */
function precomputeCum(
  route: RouteInput,
  D: number,
  nodeKms: number[],
): { fluidNeed: number[]; carbNeed: number[] } {
  const totalEff = eff(route, D) || 1;
  const hrs = totalHours(route);
  const sweatLoss = sweat(route) * hrs;
  const hydrationBuffer = route.weight * HYDRATION_BUFFER_ML_PER_KG;
  const totalFluidNeed = sweatLoss < hydrationBuffer ? 0 : sweatLoss;
  const totalCarbNeed = hrs * cph(route);
  const fluidNeed = nodeKms.map((x) => totalFluidNeed * (eff(route, x) / totalEff));
  const carbNeed = nodeKms.map((x) => totalCarbNeed * (eff(route, x) / totalEff));
  return { fluidNeed, carbNeed };
}

/**
 * C5's carb time gate, mirrored from `assignCarbs.ts`'s own (unexported) `CARB_MIN_HOURS`, itself
 * mirroring `autoplan.ts`'s. Below it, `assignCarbs` plans no carbs at all (returns `[]`), so no
 * vessel is ever committed to gel — every vessel is a fully refillable water/izo bottle as far as
 * `carryableFluid` is concerned.
 */
const CARB_MIN_HOURS = 1;

/**
 * Sum of the vessels' capacities L1 can actually count on being refilled leg after leg (§2.1: no
 * per-service millilitres, but the skeleton's legality test is still a sum of capacities).
 * Deliberately not filtered by `allowed.includes('water')`: `volOf()` (`fuel.ts`) is completely
 * content-blind — a bidon of izo delivers exactly as much fluid as the same bidon of water (§4.1
 * point 1, "content does not change delivered volume"). An izo-only or gel-only kit is still
 * carrying and delivering fluid the entire time; filtering it out here made L1 see `carryable ≈ 0`
 * for such kits, which blew up the squared `wLoad` term and packed in the maximum number of
 * minimum-spaced stops (W5a §6).
 *
 * Task C, 2026-08-25: a gel-allowed vessel is not like the others, though. `bucketVessels`
 * (`autoplan.ts`) always pulls it out of the izo/water pool the moment there is any carb planning
 * to do (`assignCarbs.ts`), and its one-shot gel dose is never refilled (S2/S4) — it only becomes
 * water-eligible again after that dose is spent, and only at a stop the plan happens to already
 * make there (S7, never guaranteed). Counting its full volume as available on EVERY leg, as if it
 * refilled like the izo bottle does, let L1 under-count how many stops a real ride needs (measured:
 * golden path, 100km/default gear, landed on 2 stops / 70% hydration where the physics wants 3 /
 * ~91%, see `docs/superpowers/specs/2026-08-25-w11-measurements.md`). So a gel-allowed vessel's
 * volume is left out of the leg-by-leg budget — unless it is the only vessel gear has at all, in
 * which case there is nothing else to carry the ride's fluid and it must still count (the W5a
 * regression above), or the ride is short enough that C5 means no vessel is ever gel-committed.
 */
function carryableFluid(gear: Vessel[], route: RouteInput): number {
  const nonGel = gear.filter((v) => !v.allowed.includes('gel'));
  if (nonGel.length === 0 || totalHours(route) < CARB_MIN_HOURS) {
    return gear.reduce((sum, v) => sum + v.vol, 0);
  }
  return nonGel.reduce((sum, v) => sum + v.vol, 0);
}

interface DPCell {
  cost: number;
  from: number;
  prevK: number;
}

/**
 * DAG shortest path over `nodes`, with a second dimension counting stops made so far (saturating
 * at `K`) so the `needsStop` floor (§3.4) can be enforced without re-running the search. When
 * `relaxCapacity` is false, an edge whose leg the bottles can't cover (F1's floor, §3.2) simply
 * doesn't exist. When true (the §3.5 fallback), every spacing-legal edge exists and the `wShort`
 * term prices the gap instead.
 */
function shortestPath(
  nodes: PosNode[],
  cumFluid: number[],
  weights: CostWeights,
  carryable: number,
  K: number,
  relaxCapacity: boolean,
): { path: number[] } | null {
  const n = nodes.length;
  const D = nodes[n - 1].km;
  const minSpacing = minStopX(D);
  const cap = Math.max(carryable, 1e-6); // guards the (rare) all-non-water gear case from ÷0/NaN

  const dp: (DPCell | null)[][] = Array.from({ length: n }, () =>
    new Array<DPCell | null>(K + 1).fill(null),
  );
  dp[0][0] = { cost: 0, from: -1, prevK: -1 };

  for (let j = 1; j < n; j++) {
    const isFinish = j === n - 1; // "the edge into D carries no stop cost — arriving isn't stopping"
    for (let i = 0; i < j; i++) {
      if (nodes[j].km - nodes[i].km < minSpacing) continue; // spacing (S5) — also covers "not right
      // after the start", since every edge out of node 0 is subject to the same test

      const need = cumFluid[j] - cumFluid[i];
      const shortfallMl = Math.max(0, FLUID_FLOOR_FRACTION * need - carryable);
      if (!relaxCapacity && shortfallMl > 0) continue; // F1 floor as edge legality (§3.2)

      const stopCost = isFinish
        ? 0
        : nodes[j].rider
          ? weights.wStop * RIDER_DISCOUNT
          : weights.wStop;
      const edgeCost =
        stopCost + weights.wLoad * (need / cap) ** 2 + weights.wShort * (shortfallMl / cap);

      for (let prevK = 0; prevK <= K; prevK++) {
        const from = dp[i][prevK];
        if (!from) continue;
        const newK = isFinish ? prevK : Math.min(prevK + 1, K);
        const cost = from.cost + edgeCost;
        const cur = dp[j][newK];
        if (!cur || cost < cur.cost) dp[j][newK] = { cost, from: i, prevK };
      }
    }
  }

  if (!dp[n - 1][K]) return null;

  const path: number[] = [];
  let node = n - 1;
  let k = K;
  for (;;) {
    path.push(node);
    if (node === 0) break;
    const cell = dp[node][k];
    if (!cell) break;
    k = cell.prevK;
    node = cell.from;
  }
  path.reverse();
  return { path };
}

/** Builds the `Shortfall` the caller sees when no legal path exists (§3.5) — measured on the best
 *  path the relaxed (capacity-dropped) search found. */
function summarizeShortfall(path: number[], cumFluid: number[], carryable: number): Shortfall {
  let totalShortfallMl = 0;
  let worstPct = 100;
  for (let i = 0; i < path.length - 1; i++) {
    const need = cumFluid[path[i + 1]] - cumFluid[path[i]];
    const floor = FLUID_FLOOR_FRACTION * need;
    totalShortfallMl += Math.max(0, floor - carryable);
    const pct = floor > 0 ? Math.min(100, (carryable / floor) * 100) : 100;
    if (pct < worstPct) worstPct = pct;
  }
  return {
    fluidMl: Math.round(totalShortfallMl),
    worstLegPct: Math.round(worstPct * 10) / 10,
    // §3.1: carbs enter L1 only as a stop-count constraint (needsStop), never a quantity — the
    // skeleton has no carb figure to size this from. Left at 0; L2/L3 own any future carb-shortfall
    // concept.
    carbsG: 0,
  };
}

/**
 * Builds `Leg`s for an arbitrary ascending list of km boundaries — decoupled from `buildSkeleton`'s
 * own node lattice/path indices, since `precomputeCum`'s fluid/carb formulas are pure per-km
 * functions with no dependency on what else is in the array. `buildSkeleton` uses this directly
 * (below); `tidy.ts` calls it again after dropping stops, so there is exactly one implementation of
 * "how legs are built from boundaries" (spec §4 step 4).
 */
export function legsForBoundaries(
  route: RouteInput,
  mix: MixSettings,
  boundaryKms: number[],
): Leg[] {
  const D = dist(route);
  const { fluidNeed: cumFluid, carbNeed: cumCarb } = precomputeCum(route, D, boundaryKms);
  // No plan/fills exist yet at L1, so izoCarbs/gelCarbs default to 0 — the same "no split known"
  // call site absCap()'s own doc comment describes. Route intensity is real (C1's ceiling).
  const capPerHour = absCap(mix, 0, 0, route.intensity);
  const legs: Leg[] = [];
  for (let i = 0; i < boundaryKms.length - 1; i++) {
    const fromKm = boundaryKms[i];
    const toKm = boundaryKms[i + 1];
    const hours = timeAtDistance(route, toKm) - timeAtDistance(route, fromKm);
    legs.push({
      fromKm,
      toKm,
      hours,
      fluidNeedMl: cumFluid[i + 1] - cumFluid[i],
      carbNeedG: cumCarb[i + 1] - cumCarb[i],
      absorbCapG: capPerHour * hours,
    });
  }
  return legs;
}

export function buildSkeleton(state: PlanState, opts: SkeletonOpts): Skeleton {
  const { route, mix, gear } = state;
  const D = dist(route);
  const K = Math.max(0, Math.floor(opts.minStopsForProducts ?? 0));
  const carryable = carryableFluid(gear, route) + (opts.carriedFluidMl ?? 0);

  const nodes = buildNodes(D, opts.riderStops, opts.allowNewStops);
  const nodeKms = nodes.map((node) => node.km);
  const { fluidNeed: cumFluid } = precomputeCum(route, D, nodeKms);

  let found = shortestPath(nodes, cumFluid, opts.weights, carryable, K, false);
  let shortfall: Shortfall | null = null;

  if (!found) {
    found = shortestPath(nodes, cumFluid, opts.weights, carryable, K, true);
    shortfall = found
      ? summarizeShortfall(found.path, cumFluid, carryable)
      : summarizeShortfall([0, nodes.length - 1], cumFluid, carryable);
  }

  const path = found ? found.path : [0, nodes.length - 1];
  const stops: StopNode[] = path.slice(1, -1).map((idx): StopNode => ({
    km: nodes[idx].km,
    origin: nodes[idx].rider ? 'rider' : 'planned',
  }));
  const legs = legsForBoundaries(
    route,
    mix,
    path.map((idx) => nodes[idx].km),
  );

  return { stops, legs, shortfall };
}
