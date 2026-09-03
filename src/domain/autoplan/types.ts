/**
 * The shapes `autoplan()` hands back: a plan's fills, foods and stops before the store gives them
 * ids and names. Ported from `feat/autoplan:src/domain/planner/types.ts`, minus everything that
 * described the retired v2 architecture (Service/Skeleton/StopNode/Leg/Shortfall/DraftPlan) — the
 * greedy repair loop that replaces it does not have those parts.
 */
import type { Fill, FoodItem, ShopStop } from '../types';

export type DraftFill = Omit<Fill, 'fid'>;
export type DraftFood = Omit<FoodItem, 'id' | 'name'>;
/** `ShopStop` is what this branch calls the type `feat/autoplan` had renamed to `Stop`. */
export type DraftStop = Omit<ShopStop, 'id' | 'name'>;

export interface FoodSelectionEntry {
  key: string;
  count: number;
}

export interface AutoplanResult {
  fills: DraftFill[];
  foods: DraftFood[];
  newStops: DraftStop[];
}
