/**
 * The planner's front door.
 *
 * All it does is run the search and rename the one field the app calls something else: a draft's
 * `stops` are the stops the plan just invented, which the store applies as `newStops`. Everything
 * that decides anything lives in `search.ts`, with `layout.ts` turning a decision into a plan and
 * `score.ts` grading it against the app's own two badges.
 */
import type { PlanState } from '../types';
import { search } from './search';
import type { AutoplanResult, FoodSelectionEntry } from './types';

export function autoplan(state: PlanState, selection: FoodSelectionEntry[] = []): AutoplanResult {
  const { fills, foods, stops } = search(state, selection);
  return { fills, foods, newStops: stops };
}
