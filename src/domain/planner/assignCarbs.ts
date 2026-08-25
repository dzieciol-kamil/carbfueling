/**
 * L2 step 1 — carb service assignment (izo/gel vessels). See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, §2.1 (why volume is
 * never authored, and the over-credit trap), and §4.1 (why carbs go first, before water — this
 * function claims vessels without negotiating with anyone, and never reserves capacity for water).
 */
import { bucketVessels } from '../autoplan';
import type { FoodSelectionEntry } from '../autoplan';
import { carbsFill, cph, dist, distanceAtTime, partsOf, timeAtDistance, totalHours } from '../fuel';
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

/** A vessel's fixed physical dose count for gel content. Single source of truth is fuel.ts's
 *  `partsOf` — also what `fracFill`/`partPos` read downstream — so this never risks drifting from
 *  what actually gets delivered by re-deriving the rounding rule itself. */
function dosesOf(vessel: Vessel, gear: Vessel[]): number {
  return partsOf({ fid: 0, gid: vessel.gid, content: 'gel', from: 0, to: 0 }, gear);
}

/**
 * Assigns carb `Service`s for izo- and gel-capable vessels. Runs before `assignWater` (§4.1):
 * content never changes what a vessel delivers in volume, so carbs cannot starve water, and this
 * function is free to claim vessels/legs without checking what water will need.
 *
 * **Izo runs first** (W5c-2, 2026-08-24) — relayed across legs (C4), draining the heaviest bottle
 * first (Ruling A: "kolejność opróżniania od największego po prostu" — matches `assignWater`'s own
 * vessel-set ordering). W5c-1b (2026-08-24): the span is topological, not a formula over `cph` or
 * sweat rate — "a rider makes a bottle last until he can next refill it." A service runs for exactly
 * one leg: from where it starts to the next stop (or `carbEndKm`/`D` on the last leg it can reach).
 * Alternation is round-robin over legs: a vessel's OWN first appearance (wherever it lands) is
 * unanchored (S4 — left home with it); every later appearance of that same vessel is a genuine
 * refill, anchored to the stop at its leg's start (V1). **C1 is no longer a placement veto**: a fill
 * bigger than a leg's `absorbCapG` is still placed, and the excess is wasted rather than the service
 * being dropped — `coverage()`'s own integral already caps benefit at the need rate.
 *
 * **Gel runs second** (Ruling B, W5c-2) — inverted from the pre-W5c-2 order, which ran gel first
 * from a `cursor` at km 0 and let izo defer to it. A flask is not a stream to drain in turn: nobody
 * re-buys a home-mixed concentrate at a stop, so its fixed, unreplenishable budget of doses is worth
 * most wherever izo's relay did NOT reach. `legContribution` (populated by izo above) is what gel's
 * placement reads. A flask with more than one part (Ruling C) is placed as `n` discrete point doses,
 * each dropped into whichever leg (before `carbEndKm`) has the largest remaining deficit at the time
 * — see `pickWorstLeg` below. A single-part flask (`gelParts` rounds to 1) keeps the old continuous
 * model instead (see the trap noted at its call site).
 *
 * **The ceiling.** C2 rules out a coverage *threshold*, but not the ride's actual total: pouring in
 * more than `hrs * cph(route)` buys nothing (`coverage()`'s own integral caps benefit at the need
 * rate) and wastes stops. That real total, less what `selection`'s own food items already carry and
 * less gel's own reserved dose budget (Task F, W12 — gel runs second but its budget is known up
 * front, so izo can reserve room for it instead of spending it), is the cap `vesselTargetG` enforces
 * — and only izo's loop checks it (gel's loop never has, before or after this task, a carried-forward
 * still-open finding from the W4b review). That cap is itself only honoured when something else can
 * still reach the legs it leaves behind (Task G, W12 — see `hasWaterVessel` at the loop below): an
 * izo-only kit with no water-capable vessel has no fallback, so it keeps relaying past the cap rather
 * than stranding the tail of the route with neither carbs nor fluid.
 */
export function assignCarbs(
  skeleton: Skeleton,
  state: PlanState,
  selection: FoodSelectionEntry[],
): Service[] {
  const { route, mix, gear, foodLib } = state;

  if (totalHours(route) < CARB_MIN_HOURS) return []; // C5

  const { izoVessels: izoVesselsUnsorted, gelVessels } = bucketVessels(gear, mix);
  // Ruling A (W5c-2, 2026-08-24): drain the heaviest bottle first — matches `assignWater`'s own
  // vessel-set ordering, so the engine is consistent about which bottle goes first.
  const izoVessels = [...izoVesselsUnsorted].sort((a, b) => b.vol - a.vol);
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
  // Task F (W12, 2026-08-25): reserve gel's own fixed dose budget before izo ever gets a target to
  // race against. Without this, izo (which runs first, Ruling B) has no idea gel is coming and
  // spends the WHOLE ride total on itself — gel then adds its full budget on top, and the ride is
  // over-poured by roughly gel's own share while every leg gel could have owned gets double-filled
  // instead of a leg izo never reached getting freed for water (§4.1 point 4: the tail carbs don't
  // claim becomes water's territory for free — that only works if izo actually stops claiming).
  const gelBudgetG = gelVessels.reduce(
    (a, v) => a + Math.max(0, carbsFillOf(v, 'gel', gear, mix)),
    0,
  );
  // No threshold (C2): this is the ride's honest total, not a discounted badge target. It is still
  // the physical ceiling past which more vessel-carbs buy nothing — and `selection`'s own carbs and
  // gel's own reserved budget already claim part of it.
  const afterSelectionG = Math.max(0, totalNeedG - selectionCarbsG);
  const afterGelReservationG = Math.max(0, afterSelectionG - gelBudgetG);
  // The reservation is optimistic (spec's own caveat): a flask's raw dose budget can outweigh the
  // WHOLE remaining need on its own (assignCarbs.test.ts's "gel fills the leg izo left thin" — a
  // 180g flask against an 80g remaining need), and subtracting it whole would zero izo out even
  // though izo would still be the better home for its own first, natural load — gel's placement
  // reads `legContribution` precisely so it can spread into whatever izo genuinely doesn't reach,
  // not so izo pre-emptively hands over legs it was never going to need to. So the reservation never
  // takes izo below one load of its own heaviest vessel (capped at what was left after selection, so
  // it still yields to a selection that already covers the ride outright).
  const izoOneLoadG =
    izoVessels.length > 0
      ? Math.min(carbsFillOf(izoVessels[0], 'izo', gear, mix), afterSelectionG)
      : 0;
  const vesselTargetG = Math.max(afterGelReservationG, izoOneLoadG);

  // Task G (W12, 2026-08-25): the target above is a *rationing* device — it only makes sense to stop
  // early when something else (gel, or the leg's own water fallback) can pick up the legs izo leaves
  // behind. An izo-only kit with no water-capable vessel anywhere has no fallback at all: breaking on
  // `vesselTargetG` there doesn't free a leg for water, it stops the ONLY thing that can ever deliver
  // fluid to that leg from delivering anything (measured: izo-1, a lone izo-only 650ml bidon on
  // 60km/8.4% scored 77% coverage because the third leg got zero carbs AND zero water — the vessel
  // was the sole possible source of both and the target-break silenced it). Over-pouring izo when
  // there is no fallback is still bounded by C1's own coverage()-caps-benefit rule (waste, not harm),
  // so it is strictly better than leaving a leg untouched.
  const hasWaterVessel = gear.some((v) => v.allowed.includes('water'));

  const services: Service[] = [];
  const legContribution = new Array<number>(skeleton.legs.length).fill(0);
  let runningTotal = 0;

  // --- izo: relay across legs (C4), one active vessel per leg (W5c-1b), heaviest bottle first
  // (Ruling A) — runs BEFORE gel (Ruling B) so gel's placement below can read where izo already
  // reached. Round-robin over `skeleton.legs`: since a vessel's own first appearance is unanchored
  // regardless of which leg it lands on (S4), the first `izoVessels.length` legs naturally give every
  // vessel its own first turn before any of them is reused — no separate "phase 1 cursor" is needed
  // to produce that shape. `usedVessels` is what distinguishes a genuine first use (S4) from a
  // refill (V1).
  const usedVessels = new Set<string>();
  let izoIdx = 0;
  for (let i = 0; i < skeleton.legs.length && izoVessels.length > 0; i++) {
    const leg = skeleton.legs[i];
    if (leg.fromKm >= carbEndKm - EPS) break; // C6: past the gut-drain buffer
    // the ride's real total is already met — but only a reason to stop if something else can still
    // reach this leg (Task G above); an izo-only kit keeps relaying past the target instead of
    // stranding the tail of the route.
    if (hasWaterVessel && runningTotal >= vesselTargetG) break;

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

  // The leg (strictly before `carbEndKm`) with the largest remaining deficit against
  // `legContribution` — -1 when no leg qualifies at all (route entirely inside C6's gut-drain
  // buffer). Ties favour the earlier leg, matching the round-robin's own left-to-right bias.
  function pickWorstLeg(): number {
    let bestIdx = -1;
    let bestDeficit = -Infinity;
    skeleton.legs.forEach((leg, i) => {
      if (leg.fromKm >= carbEndKm - EPS) return;
      const deficit = leg.carbNeedG - legContribution[i];
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  // --- gel: fixed dose budgets that fill whatever izo left uncovered (Ruling B/C, W5c-2) -----------
  for (const vessel of gelVessels) {
    const fillG = carbsFillOf(vessel, 'gel', gear, mix);
    if (fillG <= 0) continue;

    const n = dosesOf(vessel, gear);

    if (n <= 1) {
      // Trap (spec): with a single dose, `fracFill`'s n<=1 branch ignores `pos` entirely and
      // delivers continuously over [from, to] — an envelope here would be a zero-width span that
      // `tidy`'s degenerate-span guard deletes outright. Keeps the pre-W5c-2 continuous model, just
      // starts wherever izo left the largest deficit instead of always at km 0.
      const rate = cph(route);
      const startIdx = pickWorstLeg();
      if (rate <= 0 || startIdx === -1) continue;

      const fromKm = skeleton.legs[startIdx].fromKm;
      const hours = fillG / rate;
      const toKm = Math.min(
        carbEndKm,
        distanceAtTime(route, timeAtDistance(route, fromKm) + hours),
      );
      if (toKm <= fromKm + EPS) continue;

      const candidate: Service = {
        vesselId: vessel.gid,
        fromKm,
        toKm,
        content: 'gel',
        filledAtStop: null, // S2/S4: filled at home, never refilled
      };
      skeleton.legs.forEach((leg, i) => {
        const share = fillG * deliveredShare(candidate, leg, gear, route);
        if (share > 0) legContribution[i] += share;
      });
      services.push(candidate);
      runningTotal += fillG;
      continue;
    }

    // n > 1: one dose at a time, each dropped into whichever leg has the largest remaining deficit
    // right now. `legContribution` is shared with izo above and with earlier gel vessels in this
    // same loop, so a later flask's own picks already account for everything placed before it.
    const legIdx: number[] = [];
    for (let k = 0; k < n; k++) {
      const idx = pickWorstLeg();
      if (idx === -1) break; // no leg exists before carbEndKm at all — nothing to place
      legIdx.push(idx);
      // Each dose contributes exactly fillG/n to whichever leg its position falls in — `fracFill`'s
      // n>1 branch is a pure step function of dose count, so this is exact, not an approximation.
      // Applied directly here (not via `deliveredShare`, which builds its own `Fill` and does not
      // carry `service.pos` through — verified, not fixed here, see the report) so the placement
      // just chosen isn't silently undone by a fallback to even spacing across the envelope.
      legContribution[idx] += fillG / n;
    }
    if (legIdx.length === 0) continue;

    // Position within a leg: doses sharing one leg spread evenly across its interior (never at the
    // exact same km) instead of mechanically always at the midpoint, which would stack every repeat
    // pick on the same point; a leg picked only once still lands at its natural midpoint.
    const perLegCount = new Map<number, number>();
    for (const idx of legIdx) perLegCount.set(idx, (perLegCount.get(idx) ?? 0) + 1);
    const perLegSeen = new Map<number, number>();
    const positions = legIdx
      .map((idx) => {
        const leg = skeleton.legs[idx];
        const legTo = Math.min(leg.toKm, carbEndKm);
        const seen = perLegSeen.get(idx) ?? 0;
        perLegSeen.set(idx, seen + 1);
        const total = perLegCount.get(idx)!;
        return leg.fromKm + (legTo - leg.fromKm) * ((seen + 1) / (total + 1));
      })
      .sort((a, b) => a - b);

    services.push({
      vesselId: vessel.gid,
      fromKm: positions[0],
      toKm: positions[positions.length - 1],
      content: 'gel',
      filledAtStop: null, // S2: filled at home, never refilled
      pos: positions,
    });
    runningTotal += fillG;
  }

  assertInvariantV1(services, skeleton);
  return services;
}
