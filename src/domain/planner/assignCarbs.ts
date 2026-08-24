/**
 * L2 step 1 — carb service assignment (izo/gel vessels). See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, §2.1 (why volume is
 * never authored, and the over-credit trap), and §4.1 (why carbs go first, before water — this
 * function claims vessels without negotiating with anyone, and never reserves capacity for water).
 */
import { bucketVessels } from '../autoplan';
import type { FoodSelectionEntry } from '../autoplan';
import { carbsFill, cph, dist, distanceAtTime, timeAtDistance, totalHours } from '../fuel';
import type { MixSettings, PlanState, Vessel } from '../types';
import { assertInvariantV1 } from './assignWater';
import { deliveredShare } from './deliveredShare';
import type { Service, Skeleton } from './types';

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

/**
 * Assigns carb `Service`s for izo- and gel-capable vessels. Runs before `assignWater` (§4.1):
 * content never changes what a vessel delivers in volume, so carbs cannot starve water, and this
 * function is free to claim vessels/legs without checking what water will need.
 *
 * **Gel** — one continuous, one-shot service per gel-capable vessel (never relayed: nobody can buy
 * more of a home-mixed concentrate at a stop). Vessels are laid back-to-back from km 0 so two
 * flasks never stack, each drunk at exactly the rate the ride asks for (`cph`).
 *
 * **Izo** — relayed across legs (C4), sized by duration, not clipped to one leg (W5c-1,
 * 2026-08-24): a service spans as long as its fill lasts at the ride's rate (`fillG / cph`),
 * crossing whatever leg boundaries it crosses — exactly like the gel branch above. A vessel's own
 * first service (S4) is unanchored, laid back-to-back with the other vessels' own first services
 * from km 0; every later reuse must be anchored to a stop (V1), so once every vessel has had its
 * first turn the cursor snaps forward to the next stop before relaying again. Every leg's combined
 * izo+gel load is still hard-capped at that leg's share of `Leg.absorbCapG` (C1).
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
    if (!lib) return a;
    // (b): when no stop exists anywhere on the route, assignFood has nowhere legal to pin a
    // needsStop unit (S3) and drops it outright — don't also net its carbs out of the vessel
    // target, or the rider silently loses them twice. Only fires in the "route too short for any
    // legal stop" edge case; with minStopsForProducts set from this same selection, a skeleton
    // normally has exactly enough stops to host every needsStop unit.
    if (lib.needsStop && skeleton.stops.length === 0) return a;
    return a + lib.carbs * entry.count;
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

    // Candidate built up front so its delivered share (C1's basis, not elapsed time — see
    // deliveredShare.ts) can be asked of both the fit check and the contribution update below.
    const candidate: Service = {
      vesselId: vessel.gid,
      fromKm,
      toKm,
      content: 'gel',
      filledAtStop: null,
    }; // S4

    const fits = skeleton.legs.every((leg, i) => {
      const share = fillG * deliveredShare(candidate, leg, gear, route);
      if (share <= 0) return true;
      return legContribution[i] + share <= leg.absorbCapG + EPS; // C1
    });
    if (!fits) continue;

    skeleton.legs.forEach((leg, i) => {
      const share = fillG * deliveredShare(candidate, leg, gear, route);
      if (share > 0) legContribution[i] += share;
    });
    services.push(candidate);
    runningTotal += fillG;
    cursor = toKm;
  }

  // --- izo: relay across legs (C4), spans sized by duration (W5c-1) ------------------------------
  // §2.1: a service is one full vessel-load drunk at the ride's rate — "sized to the leg" means
  // span, not millilitres. Mirrors the gel branch's `fits` check exactly; the only new part is the
  // cursor/anchoring rule below (S4's unanchored first turn per vessel, V1's stop-anchored reuse).
  const izoRate = cph(route);

  /** Builds, C1-fit-checks and — on success — commits one izo service starting at `fromKm`. Returns
   *  the service's `toKm`, or `null` if nothing was placed (fill non-positive, doesn't fit, or the
   *  vessel target is already met) — mirrors the gel loop's `fits` block above verbatim. */
  function tryIzoService(
    vessel: Vessel,
    fromKm: number,
    filledAtStop: number | null,
  ): number | null {
    const fillG = carbsFillOf(vessel, 'izo', gear, mix);
    if (fillG <= 0 || izoRate <= 0 || runningTotal >= vesselTargetG) return null;

    const hours = fillG / izoRate;
    const toKm = Math.min(carbEndKm, distanceAtTime(route, timeAtDistance(route, fromKm) + hours));
    if (toKm <= fromKm + EPS) return null;

    const candidate: Service = { vesselId: vessel.gid, fromKm, toKm, content: 'izo', filledAtStop };
    const fits = skeleton.legs.every((leg, i) => {
      const share = fillG * deliveredShare(candidate, leg, gear, route);
      if (share <= 0) return true;
      return legContribution[i] + share <= leg.absorbCapG + EPS; // C1
    });
    if (!fits) return null;

    skeleton.legs.forEach((leg, i) => {
      const share = fillG * deliveredShare(candidate, leg, gear, route);
      if (share > 0) legContribution[i] += share;
    });
    services.push(candidate);
    runningTotal += fillG;
    return toKm;
  }

  let izoCursor = 0;

  // Phase 1 (S4): each vessel's own first fill, laid back-to-back from km 0, unanchored — "N
  // bottles pre-filled at home cover the first N stretches, no stop needed between them." One
  // attempt per vessel, in order, same as the gel loop — a vessel that doesn't fit here simply
  // forfeits its turn (cursor doesn't move) rather than being retried later.
  for (const vessel of izoVessels) {
    if (izoCursor >= carbEndKm - EPS) break;
    const toKm = tryIzoService(vessel, izoCursor, null);
    if (toKm !== null) izoCursor = toKm;
  }

  // Phase 2: relay reuse. Every later service must be anchored to a stop (V1), so the cursor snaps
  // forward to the first stop at or after it. If no vessel fits there, that stop is skipped (try the
  // next one) rather than giving up outright; placement only stops once no legal stop remains before
  // the gut-drain buffer — a gap left there is a real dry stretch, not stretched over. `stopPtr`
  // (not a km comparison) drives the "try the next stop" fallback so a rejected stop is skipped for
  // good rather than being re-selected forever.
  let izoIdx = 0;
  let stopPtr = 0;
  while (runningTotal < vesselTargetG) {
    while (stopPtr < skeleton.stops.length && skeleton.stops[stopPtr].km < izoCursor - EPS) {
      stopPtr++;
    }
    if (stopPtr >= skeleton.stops.length) break;
    const stopKm = skeleton.stops[stopPtr].km;
    if (stopKm >= carbEndKm - EPS) break;

    let placed = false;
    for (let attempt = 0; attempt < izoVessels.length; attempt++) {
      const vessel = izoVessels[(izoIdx + attempt) % izoVessels.length];
      const toKm = tryIzoService(vessel, stopKm, stopPtr);
      if (toKm !== null) {
        izoIdx = (izoIdx + attempt + 1) % izoVessels.length;
        izoCursor = toKm;
        placed = true;
        break;
      }
    }
    if (!placed) stopPtr++; // nothing fits at this stop — try the next one
  }

  assertInvariantV1(services, skeleton);
  return services;
}
