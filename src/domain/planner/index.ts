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
 * §3.3's "Zrównoważony (default)" starting weights. Not calibrated — §5/W5b's job. `wShort` is the
 * spec's fixed 1000 in every position (a shortfall must always lose to any legal plan).
 */
export const DEFAULT_WEIGHTS: CostWeights = { wStop: 1.0, wLoad: 1.0, wShort: 1000 };

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
