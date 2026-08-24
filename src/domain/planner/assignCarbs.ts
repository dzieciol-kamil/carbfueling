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
 * **Izo** — relayed across legs (C4). W5c-1b (2026-08-24): the span is topological, not a formula
 * over `cph` or sweat rate — "a rider makes a bottle last until he can next refill it." A service
 * runs for exactly one leg: from where it starts to the next stop (or `carbEndKm`/`D` on the last
 * leg it can reach). W5c-1's `fillG / cph` duration formula is withdrawn — it fixed izo-4 but broke
 * rides where one bottle has to cover a whole leg (mix-2, izo-5, mix-3), because it under-sized the
 * span relative to what the leg actually needs. Alternation is round-robin over legs: a vessel's
 * OWN first appearance (wherever it lands) is unanchored (S4 — left home with it); every later
 * appearance of that same vessel is a genuine refill, anchored to the stop at its leg's start (V1).
 * **C1 is no longer a placement veto** (that was the real bug in the pre-W5c-1 model, not the
 * per-leg span): a fill bigger than a leg's `absorbCapG` is still placed, and the excess is wasted
 * rather than the service being dropped — `coverage()`'s own integral already caps benefit at the
 * need rate, so the metric absorbs the waste without any help from this function.
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

  // --- izo: relay across legs (C4), one active vessel per leg (W5c-1b) ----------------------------
  // Round-robin over `skeleton.legs`: since a vessel's own first appearance is unanchored regardless
  // of which leg it lands on (S4), the first `izoVessels.length` legs naturally give every vessel its
  // own first turn before any of them is reused — no separate "phase 1 cursor" is needed to produce
  // that shape. `usedVessels` is what distinguishes a genuine first use (S4) from a refill (V1).
  const usedVessels = new Set<string>();
  let izoIdx = 0;
  for (let i = 0; i < skeleton.legs.length && izoVessels.length > 0; i++) {
    const leg = skeleton.legs[i];
    if (leg.fromKm >= carbEndKm - EPS) break; // C6: past the gut-drain buffer
    if (runningTotal >= vesselTargetG) break; // the ride's real total is already met

    const toKm = Math.min(leg.toKm, carbEndKm);
    if (toKm <= leg.fromKm + EPS) break;

    for (let attempt = 0; attempt < izoVessels.length; attempt++) {
      const vessel = izoVessels[(izoIdx + attempt) % izoVessels.length];
      const fillG = carbsFillOf(vessel, 'izo', gear, mix);
      if (fillG <= 0) continue;

      const firstUse = !usedVessels.has(vessel.gid);
      const filledAtStop = firstUse ? null : i - 1; // S4 vs V1

      const candidate: Service = {
        vesselId: vessel.gid,
        fromKm: leg.fromKm,
        toKm,
        content: 'izo',
        filledAtStop,
      };

      // No C1 veto here (W5c-1b): the service is always placed. `legContribution` is still tracked
      // (prorated via `deliveredShare`, same basis the gel branch and C1 itself use) so an overloaded
      // leg is visible as wasted carbs rather than as a missing service.
      skeleton.legs.forEach((l, j) => {
        const share = fillG * deliveredShare(candidate, l, gear, route);
        if (share > 0) legContribution[j] += share;
      });
      services.push(candidate);
      runningTotal += fillG;
      usedVessels.add(vessel.gid);
      izoIdx = (izoIdx + attempt + 1) % izoVessels.length;
      break;
    }
  }

  assertInvariantV1(services, skeleton);
  return services;
}
