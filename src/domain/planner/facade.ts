import type { PlanState } from '../types';
import { plan } from './index';
import { servicesToFills } from './services';
import type { AutoplanResult, FoodSelectionEntry } from './types';

/** How far an existing `Stop` may sit from a planned stop and still be treated as the same one in
 *  assertions — a test tolerance, not anything the engine itself enforces: L1's lattice matches
 *  rider stops exactly (`buildNodes`), so a `Skeleton` never needs to snap one position onto
 *  another. */
export const STOP_SNAP_KM = 3;

/**
 * The app's public entry point: runs the v2 pipeline (`plan()`) and adapts its `Service[]` output
 * into the legacy `Fill[]` shape the rest of the app (chart, panels, store) still consumes.
 */
export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const draft = plan(state, selection);

  const fills = servicesToFills(draft.services, state.gear);

  // Only genuinely new stops go in `newStops` — a stop the skeleton reused (rider-placed or a
  // surviving auto stop) is already in `state.stops`, and `applyAutoplan` appends `newStops` to
  // that list rather than replacing it.
  const newStops = draft.stops.filter(
    (s) => !state.stops.some((existing) => Math.abs(existing.at - s.at) < 1e-9),
  );

  return { fills, foods: draft.foods, newStops };
}
