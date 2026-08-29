/**
 * v2 planner data model — replaces the Timeline/Block/Candidate triple. Pure data, no methods.
 * See `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §2, the implementation
 * contract this file follows field-for-field.
 */

import type { Content, Fill, FoodItem, Stop } from '../types';

export type DraftFill = Omit<Fill, 'fid'>;
export type DraftFood = Omit<FoodItem, 'id' | 'name'>;
export type DraftStop = Omit<Stop, 'id' | 'name'>;

export interface FoodSelectionEntry {
  key: string;
  count: number;
}

/** One continuous use of one vessel. A vessel has many, with gaps. This is what makes relay
 *  expressible — the single thing the old model could not do (C4). */
export interface Service {
  vesselId: string;
  fromKm: number;
  toKm: number;
  content: Content;
  filledAtStop: number | null; // index into Skeleton.stops; null = left home with it (S4)
  /** Explicit per-dose km positions for a multi-part gel service (W5c-2). When present, `fromKm`/
   *  `toKm` are the envelope `pos[0]`/`pos[n-1]`, not "where I drink" — an izo stretch may sit inside
   *  it, since nothing is delivered between doses. Mirrors `Fill.pos` (`src/domain/types.ts`), which
   *  is where this ultimately lands via `servicesToFills`. */
  pos?: number[];
}

/** L1 output: where we stop and what each leg demands. */
export interface Skeleton {
  stops: StopNode[]; // ascending km, excludes start and finish
  legs: Leg[]; // stops.length + 1 entries, covering 0..D
  shortfall: Shortfall | null; // non-null when the gear cannot carry the ride (§3.5)
}

export interface StopNode {
  km: number;
  origin: 'rider' | 'planned'; // rider stops were nodes we chose to use, not stops we invented
}

export interface Leg {
  fromKm: number;
  toKm: number;
  hours: number;
  fluidNeedMl: number; // integral of fluidNeedRate over the leg, from fuel.ts
  carbNeedG: number; // integral of the effort-shaped carb requirement
  absorbCapG: number; // what the gut can actually take over this leg (C1's ceiling)
}

export interface Shortfall {
  fluidMl: number; // how much the bottles cannot carry
  worstLegPct: number; // lowest leg's fluid % of the F1 floor
  carbsG: number;
}

export interface DraftPlan {
  services: Service[];
  foods: DraftFood[];
  stops: DraftStop[];
}

export interface AutoplanResult {
  fills: DraftFill[];
  foods: DraftFood[];
  newStops: DraftStop[];
}
