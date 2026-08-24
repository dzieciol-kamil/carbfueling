/**
 * L2 step 1 — carb service assignment (izo/gel vessels). See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, §2.1 (why volume is
 * never authored, and the over-credit trap), and §4.1 (why carbs go first, before water — this
 * function claims vessels without negotiating with anyone, and never reserves capacity for water).
 */
import { bucketVessels } from '../autoplan';
import type { FoodSelectionEntry } from '../autoplan';
import { carbsFill, cph, dist, distanceAtTime, timeAtDistance, totalHours } from '../fuel';
import type { MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assertInvariantV1 } from './assignWater';
import type { Leg, Service, Skeleton } from './types';

/**
 * C5's time-based short-ride skip — a separate gate from F4's sweat-vs-body-mass water gate
 * ("rozdzielamy": two gates, not one). Mirrors autoplan.ts's own (unexported) `CARB_MIN_HOURS`.
 */
const CARB_MIN_HOURS = 1;

/**
 * C6's gut-drain buffer, as a share of `D`. Spec §1.2/§8 leaves the exact size open ("presumably
 * remaining gut ÷ absCap"); this mirrors autoplan.ts's own (unexported) `CARB_STREAM_FINISH_GAP` —
 * the same 2% the rider's real builds already support — so a carb service is never authored to
 * stretch all the way to the line, where it would never finish absorbing.
 */
const CARB_STREAM_FINISH_GAP = 0.02;

const EPS = 1e-6;

/** A vessel's fixed per-fill carbs for `content` — independent of span (§2.1: `carbsFill` only
 *  reads `content`/`gid` off the `Fill` shape it's handed). */
function carbsFillOf(
  vessel: Vessel,
  content: 'izo' | 'gel',
  gear: Vessel[],
  mix: MixSettings,
): number {
  return carbsFill({ fid: 0, gid: vessel.gid, content, from: 0, to: 0 }, gear, mix);
}

/** Hours of `[fromKm, toKm)` that fall inside `leg` — used to prorate a span crossing leg
 *  boundaries (gel's one-shot service) onto the skeleton's per-leg absorption ceiling (C1). */
function legOverlapHours(route: RouteInput, leg: Leg, fromKm: number, toKm: number): number {
  const a = Math.max(leg.fromKm, fromKm);
  const b = Math.min(leg.toKm, toKm);
  if (b <= a) return 0;
  return timeAtDistance(route, b) - timeAtDistance(route, a);
}

/**
 * Assigns carb `Service`s for izo- and gel-capable vessels. Runs before `assignWater` (§4.1):
 * content never changes what a vessel delivers in volume, so carbs cannot starve water, and this
 * function is free to claim vessels/legs without checking what water will need.
 *
 * **Gel** — one continuous, one-shot service per gel-capable vessel (never relayed: nobody can buy
 * more of a home-mixed concentrate at a stop). Vessels are laid back-to-back from km 0 so two
 * flasks never stack, each drunk at exactly the rate the ride asks for (`cph`).
 *
 * **Izo** — relayed across legs (C4): izo-capable vessels alternate leg by leg so a vessel that
 * empties is refilled at the next stop and used again, instead of drained once and carried empty.
 * Every leg's combined izo+gel load is hard-capped at that leg's share of `Leg.absorbCapG` (C1).
 *
 * **The ceiling.** C2 rules out a coverage *threshold*, but not the ride's actual total: pouring in
 * more than `hrs * cph(route)` buys nothing (`coverage()`'s own integral caps benefit at the need
 * rate) and wastes stops. That real total, less what `selection`'s own food items already carry, is
 * the only cap this function honours — never a discounted percentage of it.
 */
export function assignCarbs(
  skeleton: Skeleton,
  state: PlanState,
  selection: FoodSelectionEntry[],
): Service[] {
  const { route, mix, gear, foodLib } = state;

  if (totalHours(route) < CARB_MIN_HOURS) return []; // C5

  const { izoVessels, gelVessels } = bucketVessels(gear, mix);
  if (izoVessels.length === 0 && gelVessels.length === 0) return [];

  const D = dist(route);
  const carbEndKm = D * (1 - CARB_STREAM_FINISH_GAP); // C6

  // The ride's real total (skeleton.legs already carries this, built by L1 off the same
  // eff()-weighted integral as cph()×hours — summing it back out is cheaper than recomputing it).
  const totalNeedG = skeleton.legs.reduce((a, l) => a + l.carbNeedG, 0);
  const selectionCarbsG = selection.reduce((a, entry) => {
    const lib = foodLib.find((f) => f.key === entry.key);
    return a + (lib ? lib.carbs * entry.count : 0);
  }, 0);
  // No threshold (C2): this is the ride's honest total, not a discounted badge target. It is still
  // the physical ceiling past which more vessel-carbs buy nothing — and `selection`'s own carbs
  // already claim part of it.
  const vesselTargetG = Math.max(0, totalNeedG - selectionCarbsG);

  const services: Service[] = [];
  const legContribution = new Array<number>(skeleton.legs.length).fill(0);
  let runningTotal = 0;

  // --- gel: one continuous, one-shot service per vessel, staggered back-to-back -----------------
  let cursor = 0;
  for (const vessel of gelVessels) {
    const fillG = carbsFillOf(vessel, 'gel', gear, mix);
    const rate = cph(route);
    if (fillG <= 0 || rate <= 0 || cursor >= carbEndKm - EPS) continue;

    const hours = fillG / rate;
    const fromKm = cursor;
    const toKm = Math.min(carbEndKm, distanceAtTime(route, timeAtDistance(route, fromKm) + hours));
    if (toKm <= fromKm + EPS) continue;

    const fits = skeleton.legs.every((leg, i) => {
      const overlapH = legOverlapHours(route, leg, fromKm, toKm);
      if (overlapH <= 0) return true;
      const share = fillG * (overlapH / hours);
      return legContribution[i] + share <= leg.absorbCapG + EPS; // C1
    });
    if (!fits) continue;

    skeleton.legs.forEach((leg, i) => {
      const overlapH = legOverlapHours(route, leg, fromKm, toKm);
      if (overlapH > 0) legContribution[i] += fillG * (overlapH / hours);
    });
    services.push({ vesselId: vessel.gid, fromKm, toKm, content: 'gel', filledAtStop: null }); // S4
    runningTotal += fillG;
    cursor = toKm;
  }

  // --- izo: relay across legs (C4) ----------------------------------------------------------------
  const usedBefore = new Set<string>();
  let izoIdx = 0;
  for (let i = 0; i < skeleton.legs.length && izoVessels.length > 0; i++) {
    const leg = skeleton.legs[i];
    if (leg.toKm <= leg.fromKm + EPS) continue; // degenerate, shouldn't happen but guard anyway
    if (leg.fromKm >= carbEndKm - EPS) continue; // C6: past the gut-drain buffer

    const toKm = Math.min(leg.toKm, carbEndKm);
    if (toKm <= leg.fromKm + EPS) continue;
    const trim = (toKm - leg.fromKm) / (leg.toKm - leg.fromKm);
    const effectiveCapG = leg.absorbCapG * trim;

    if (runningTotal >= vesselTargetG) break; // the ride's real total is already met

    for (let attempt = 0; attempt < izoVessels.length; attempt++) {
      const vessel = izoVessels[(izoIdx + attempt) % izoVessels.length];
      const fillG = carbsFillOf(vessel, 'izo', gear, mix);
      if (fillG <= 0) continue;
      if (legContribution[i] + fillG > effectiveCapG + EPS) continue; // C1's hard ceiling

      const filledAtStop = usedBefore.has(vessel.gid) ? i - 1 : null; // S4 (first use) / V1 (reuse)
      services.push({
        vesselId: vessel.gid,
        fromKm: leg.fromKm,
        toKm,
        content: 'izo',
        filledAtStop,
      });
      legContribution[i] += fillG;
      runningTotal += fillG;
      usedBefore.add(vessel.gid);
      izoIdx = (izoIdx + attempt + 1) % izoVessels.length;
      break;
    }
  }

  assertInvariantV1(services, skeleton);
  return services;
}
