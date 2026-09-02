/**
 * Placeholder. There is no planner here yet.
 *
 * The scenario suite (`autoplanScenarios`, `autoplanMixScenarios`, `autoplanPacing`) landed before
 * the engine on purpose: it is the target the rewrite has to turn green, so it has to be runnable
 * first. This function exists only so those files resolve their imports and fail on their own
 * assertions rather than on a module that isn't there. An empty plan is the honest answer for a
 * planner that hasn't been written — every scenario then reads as "nothing was planned", which
 * nobody can mistake for partial progress.
 *
 * The greedy repair loop replaces this wholesale.
 */
import type { PlanState } from '../types';
import type { AutoplanResult, FoodSelectionEntry } from './types';

export function autoplan(_state: PlanState, _selection: FoodSelectionEntry[] = []): AutoplanResult {
  return { fills: [], foods: [], newStops: [] };
}
