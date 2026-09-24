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

/**
 * What the plan may do about stops, set by the pre-flight modal's "Twoje postoje" switch.
 *
 * `riderStops` are the km of the stops the rider placed himself. They are free — he pulls over
 * there anyway — so a refill charged to one costs nothing and every one of them is a tap and a shop
 * (owner, 2026-09-24: *"tak"* to both). `newStops: false` is "Tylko moje" (R46): the plan refills
 * and buys only at his stops and hands back the best it can do there, never an extra one. `true`
 * with stops is "Dołóż" (R47): a new stop only where the score says it moves the plan toward green.
 */
export type StopRules = { riderStops: number[]; newStops: boolean };

/** "Od nowa", and every caller that says nothing: no stops of the rider's, new ones wherever. */
export const FREE_STOPS: StopRules = { riderStops: [], newStops: true };
