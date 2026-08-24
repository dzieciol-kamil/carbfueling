/**
 * v2 planner pipeline. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4.1 for the settled stage order:
 * buildSkeleton → assignCarbs → assignWater → assignFood → tidy.
 *
 * W5a: builds this pipeline and measures it. Deliberately has **no verify/repair pass** — L3 is
 * W5b's job, dispatched only after the measurement in
 * `docs/superpowers/specs/2026-08-24-w5a-measurements.md` is read.
 */
import type { DraftStop } from '../autoplan';
import type { FoodSelectionEntry } from '../autoplan';
import type { FoodLibEntry, PlanState } from '../types';
import { assignCarbs } from './assignCarbs';
import { assignFood } from './assignFood';
import { assignWater } from './assignWater';
import { buildSkeleton } from './skeleton';
import type { CostWeights } from './skeleton';
import { tidy } from './tidy';
import type { DraftPlan } from './types';

/**
 * §3.3's "Zrównoważony (default)" starting weights, calibrated in W5b-1 (2026-08-24) after changes 1
 * and 2 landed: swept `wStop` × `wLoad` over the whole fixture set (34 scenarios, not one route —
 * see `docs/superpowers/specs/2026-08-24-w5b1-measurements.md` §4). `wLoad` stays at the spec's
 * starting value; `wStop` moves from 1.0 to 1.3, the smallest value at which the WHOLE suite settles
 * onto its physics-driven minimum stop count (a stable plateau shared by every `wStop ≥ 1.3`, not a
 * knife's-edge fit) — total stops across all 34 fixtures drops from 91 to 84, aggregate hydration
 * deviation from 100% barely moves (15.6 → 16.8), and the F3 reference scenario (200km/1000ml
 * bottle) lands on the rider's actual real-world stop count (4) instead of the prior near-tied 5.
 * Matches the spec's own directional rule: if the default errs, it must err toward fewer stops.
 * `wShort` stays the spec's fixed 1000 in every position (a shortfall must always lose to any legal
 * plan).
 */
export const DEFAULT_WEIGHTS: CostWeights = { wStop: 1.3, wLoad: 1.0, wShort: 1000 };

/**
 * S3/§3.4: how many `needsStop` units the selection carries, expanded by `count` — the floor L1's
 * DP dimension enforces. Raw count, not a discounted one: the rider's own ruling on mix-7 is "4
 * colas → 4 stops", i.e. one stop per unit, not per product type.
 */
function countNeedsStop(selection: FoodSelectionEntry[], foodLib: FoodLibEntry[]): number {
  let n = 0;
  for (const entry of selection) {
    const lib = foodLib.find((f) => f.key === entry.key);
    if (lib?.needsStop) n += entry.count;
  }
  return n;
}

/**
 * Runs the deterministic v2 pipeline end to end. `state.stops` that the rider placed by hand
 * (`!autoCreated`) are offered to L1 as cheap nodes (S6); a previous run's own auto-generated stops
 * are not — they get no discount over any other lattice point.
 *
 * The short-ride gates (§3, F4/C5) need no extra handling here: `assignWater` and `assignCarbs` each
 * own their gate already, and `buildSkeleton` independently zeroes the fluid need under the same F4
 * buffer (`HYDRATION_BUFFER_ML_PER_KG`), so it never forces a capacity-driven stop on a short ride
 * either — see the report for the trace.
 */
export function plan(state: PlanState, selection: FoodSelectionEntry[]): DraftPlan {
  const riderStops = state.stops.filter((s) => !s.autoCreated).map((s) => s.at);

  const skeleton = buildSkeleton(state, {
    riderStops,
    allowNewStops: true,
    weights: DEFAULT_WEIGHTS,
    minStopsForProducts: countNeedsStop(selection, state.foodLib),
  });

  const carbs = assignCarbs(skeleton, state, selection);
  const water = assignWater(skeleton, state, carbs);
  const services = [...carbs, ...water];
  const foods = assignFood(skeleton, services, state, selection);

  const tidied = tidy(skeleton, services, foods, state);

  const stops: DraftStop[] = tidied.skeleton.stops.map((s) => ({
    at: s.km,
    autoCreated: s.origin === 'planned',
  }));

  return { services: tidied.services, foods: tidied.foods, stops };
}
