/**
 * Shared by `assignCarbs.ts` and `assignWater.ts` — both need to prorate a service spanning several
 * legs (gel's one-shot span in particular is laid out independently of leg boundaries, so a single
 * flask can overlap three legs) onto a single leg's share, by the fraction of the *service's own
 * duration* that falls inside that leg. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1 (C1's absorption ceiling)
 * and step 2 (crediting carbs' fluid volume onto water's floor).
 */
import { timeAtDistance } from '../fuel';
import type { RouteInput } from '../types';
import type { Leg } from './types';

/** Hours of `[fromKm, toKm)` that fall inside `leg`. */
export function legOverlapHours(route: RouteInput, leg: Leg, fromKm: number, toKm: number): number {
  const a = Math.max(leg.fromKm, fromKm);
  const b = Math.min(leg.toKm, toKm);
  if (b <= a) return 0;
  return timeAtDistance(route, b) - timeAtDistance(route, a);
}
