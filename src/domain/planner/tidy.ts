/**
 * L2 step 4 (final) — the tidy pass. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 4.
 *
 * Runs after `assignCarbs`/`assignWater`/`assignFood`, in order A→E:
 *   A. drop degenerate (near-zero-span) services — §2.1's over-credit trap in its purest form.
 *   B. S7 — a spent one-shot gel vessel takes water at the first *existing* stop at/after it ends.
 *   C. F6 — a free top-up at an existing stop when the leg after it dips under the F1 floor and an
 *      idle water-capable vessel is available.
 *   D. drop stops nothing uses (no service anchored, no food at their km), remapping every surviving
 *      `filledAtStop` and rebuilding `skeleton.legs` so `legs.length === stops.length + 1` still
 *      holds.
 *   E. assert S1 (stop spacing), V1 (combined vessel timeline), and the legs/stops invariant.
 *
 * Pure: never mutates `skeleton`, `services`, `foods`, or `state` — every step returns new arrays.
 */
import type { DraftFood } from '../autoplan';
import { minStopX } from '../autoplan';
import type { MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assertInvariantV1, computeCarbDoneAtKm, isEligible } from './assignWater';
import { deliveredShare } from './deliveredShare';
import { FLUID_FLOOR_FRACTION, legsForBoundaries } from './skeleton';
import type { Leg, Service, Skeleton, StopNode } from './types';

/**
 * A. Below this span, two km values are the same point by the skeleton's own precision:
 * `buildNodes` (skeleton.ts) rounds every candidate km to this granularity before deduping, and
 * `assignCarbs.ts`'s own degenerate-leg guard (`leg.toKm <= leg.fromKm + EPS`) uses the same figure.
 * A service whose span doesn't clear it isn't a short refill — it's zero distance that would still
 * credit its vessel's *full* capacity regardless (§2.1's over-credit trap), so it's dropped outright
 * rather than merely ignored.
 */
const DEGENERATE_SPAN_KM = 1e-6;

function dropDegenerateServices(services: Service[]): Service[] {
  return services.filter((s) => s.toKm - s.fromKm >= DEGENERATE_SPAN_KM);
}

/**
 * B. S7: for every one-shot gel service whose vessel also allows water, open a water service
 * starting at the first *existing* stop at or after the gel service ends, running to whatever
 * happens next on that vessel (another service, from either L2 or an earlier B iteration) or to `D`.
 * Never invents a stop — if none exists at or after the gel service's end, the vessel simply stays
 * empty for the rest of the ride, which is the correct answer, not a failure.
 */
function addSpentGelWater(
  skeleton: Skeleton,
  services: Service[],
  gear: Vessel[],
  D: number,
): Service[] {
  const added: Service[] = [];

  for (const gelService of services) {
    if (gelService.content !== 'gel') continue;
    const vessel = gear.find((v) => v.gid === gelService.vesselId);
    if (!vessel || !vessel.allowed.includes('water')) continue; // gel-only flask: never takes water

    const T = gelService.toKm;
    const stop = skeleton.stops.find((s) => s.km >= T - DEGENERATE_SPAN_KM);
    if (!stop) continue; // no stop at/after T — stays empty, per spec
    const stopIdx = skeleton.stops.indexOf(stop);
    const fromKm = stop.km;

    const nextEvent = [...services, ...added]
      .filter(
        (s) =>
          s.vesselId === vessel.gid && s !== gelService && s.fromKm >= fromKm - DEGENERATE_SPAN_KM,
      )
      .sort((a, b) => a.fromKm - b.fromKm)[0];
    const toKm = nextEvent ? nextEvent.fromKm : D;
    if (toKm <= fromKm + DEGENERATE_SPAN_KM) continue; // no room — already occupied there

    added.push({ vesselId: vessel.gid, fromKm, toKm, content: 'water', filledAtStop: stopIdx });
  }

  return added;
}

/** Total ml credited to `leg` across `services`, by vessel volume × `deliveredShare` — the same
 *  basis `assignWater` itself uses to credit carbs' fluid onto the floor. */
function deliveredMl(leg: Leg, services: Service[], gear: Vessel[], route: RouteInput): number {
  let total = 0;
  for (const s of services) {
    const share = deliveredShare(s, leg, gear, route);
    if (share <= 0) continue;
    const vessel = gear.find((v) => v.gid === s.vesselId);
    if (vessel) total += vessel.vol * share;
  }
  return total;
}

/**
 * C. F6: at each stop the plan already makes, if the leg that follows it is under the F1 floor and
 * some water-capable vessel is idle (no service overlapping that leg at all, and no carb duty still
 * pending on it) across it, open that vessel for the leg — free, since the stop is already being
 * made. Narrow by construction: a leg where every water-capable vessel is already busy is a genuine
 * shortfall, left for W5's repair pass.
 */
function freeTopUps(
  skeleton: Skeleton,
  services: Service[],
  gear: Vessel[],
  route: RouteInput,
): Service[] {
  const added: Service[] = [];
  const combined = [...services];
  const waterVessels = [...gear]
    .filter((v) => v.allowed.includes('water'))
    .sort((a, b) => b.vol - a.vol);
  // Carbs (izo/gel) don't change across A/B/C, so this is computed once from the input, not per
  // leg — mirrors `assignWater.ts`'s own `computeCarbDoneAtKm`/`isEligible` (the mid-flight
  // ruling, generalizing S7 to izo/gel): a vessel with a carb turn still ahead of it — even one
  // currently sitting in the gap *before* that turn starts — is reserved from km 0 and must not
  // take water first.
  const carbDoneAtKm = computeCarbDoneAtKm(services.filter((s) => s.content !== 'water'));

  for (let j = 1; j < skeleton.legs.length; j++) {
    const leg = skeleton.legs[j];
    const floorMl = FLUID_FLOOR_FRACTION * leg.fluidNeedMl;
    let delivered = deliveredMl(leg, combined, gear, route);
    if (delivered >= floorMl) continue; // already flat — nothing to do

    const stopIdx = j - 1; // the stop this leg follows
    // "Idle" means no km-range overlap at all, not "delivers zero share here": a gel service
    // doses at discrete points (deliveredShare can be 0 on a leg it merely passes through) but
    // still occupies its vessel continuously across its whole fromKm–toKm span — that vessel
    // cannot also take water in the gap. Using deliveredShare>0 here previously let a "gap" leg
    // inside a live gel span get a fabricated water service, double-booking the vessel and
    // producing a service that starts before the gel service's own km, which broke V1 by
    // demoting the gel service out of first-by-fromKm position.
    const busyVesselIds = new Set(
      combined
        .filter((s) => Math.min(leg.toKm, s.toKm) > Math.max(leg.fromKm, s.fromKm))
        .map((s) => s.vesselId),
    );

    for (const v of waterVessels) {
      if (delivered >= floorMl) break;
      if (busyVesselIds.has(v.gid)) continue; // not idle across this leg
      if (!isEligible(v.gid, leg, carbDoneAtKm)) continue; // carb duty still pending ahead

      const service: Service = {
        vesselId: v.gid,
        fromKm: leg.fromKm,
        toKm: leg.toKm,
        content: 'water',
        filledAtStop: stopIdx,
      };
      combined.push(service);
      added.push(service);
      busyVesselIds.add(v.gid);
      delivered += v.vol;
    }
  }

  return added;
}

/**
 * D. Drops every stop with no service anchored to it (`filledAtStop === i`) and no food at its km,
 * remaps the surviving services' `filledAtStop` indices onto the new stop list, and rebuilds
 * `skeleton.legs` over the surviving boundaries via `legsForBoundaries` (skeleton.ts) — the same
 * function `buildSkeleton` itself uses, so there is one implementation of "legs from boundaries".
 * A no-op (nothing dropped) returns the same `skeleton`/`services` untouched — required, not just an
 * optimization, since a hand-built skeleton's `Leg` fields need not match what the physics formulas
 * would recompute from `route`/`mix`, and an untouched plan must come back structurally identical.
 */
function dropUnusedStops(
  skeleton: Skeleton,
  services: Service[],
  foods: DraftFood[],
  route: RouteInput,
  mix: MixSettings,
): { skeleton: Skeleton; services: Service[] } {
  const usedStopIdx = new Set<number>();
  for (const s of services) if (s.filledAtStop !== null) usedStopIdx.add(s.filledAtStop);

  const keepIdx: number[] = [];
  skeleton.stops.forEach((stop, i) => {
    const hasService = usedStopIdx.has(i);
    const hasFood = foods.some((f) => f.from === stop.km);
    if (hasService || hasFood) keepIdx.push(i);
  });

  if (keepIdx.length === skeleton.stops.length) {
    return { skeleton, services }; // nothing to drop
  }

  const remap = new Map<number, number>();
  keepIdx.forEach((oldIdx, newIdx) => remap.set(oldIdx, newIdx));

  const newStops: StopNode[] = keepIdx.map((i) => skeleton.stops[i]);
  const newServices = services.map((s) =>
    s.filledAtStop === null ? s : { ...s, filledAtStop: remap.get(s.filledAtStop)! },
  );

  const start = skeleton.legs[0].fromKm;
  const end = skeleton.legs[skeleton.legs.length - 1].toKm;
  const boundaryKms = [start, ...newStops.map((s) => s.km), end];
  const newLegs = legsForBoundaries(route, mix, boundaryKms);

  return {
    skeleton: { stops: newStops, legs: newLegs, shortfall: skeleton.shortfall },
    services: newServices,
  };
}

/**
 * E: S1 — no two surviving stops closer than `minStopX(D)`. Thrown, not merged: L1's DP only ever
 * connects nodes at least `minStopX(D)` apart (`skeleton.ts`'s edge-legality test), and every path
 * km is strictly increasing, so any two stops L1 produces are already at least that far apart —
 * verified, not assumed. Tidy neither creates nor moves stops, so the property can only be broken by
 * a bug, which this is here to catch loudly rather than silently "fix" by merging.
 */
function assertS1(stops: StopNode[], D: number): void {
  const floor = minStopX(D);
  for (let i = 1; i < stops.length; i++) {
    const gap = stops[i].km - stops[i - 1].km;
    if (gap < floor - 1e-6) {
      throw new Error(
        `S1 violated: stops at km ${stops[i - 1].km} and ${stops[i].km} are ${gap}km apart, ` +
          `under minStopX(${D}) = ${floor}`,
      );
    }
  }
}

function assertLegsCoverStops(skeleton: Skeleton): void {
  if (skeleton.legs.length !== skeleton.stops.length + 1) {
    throw new Error(
      `tidy invariant violated: ${skeleton.legs.length} legs for ${skeleton.stops.length} stops ` +
        `(expected ${skeleton.stops.length + 1})`,
    );
  }
}

export function tidy(
  skeleton: Skeleton,
  services: Service[],
  foods: DraftFood[],
  state: PlanState,
): { skeleton: Skeleton; services: Service[]; foods: DraftFood[] } {
  const { route, mix, gear } = state;
  const D = skeleton.legs[skeleton.legs.length - 1].toKm;

  let curServices = dropDegenerateServices(services); // A
  curServices = [...curServices, ...addSpentGelWater(skeleton, curServices, gear, D)]; // B
  curServices = [...curServices, ...freeTopUps(skeleton, curServices, gear, route)]; // C

  const { skeleton: newSkeleton, services: finalServices } = dropUnusedStops(
    skeleton,
    curServices,
    foods,
    route,
    mix,
  ); // D

  assertS1(newSkeleton.stops, D); // E
  assertInvariantV1(finalServices, newSkeleton);
  assertLegsCoverStops(newSkeleton);

  return { skeleton: newSkeleton, services: finalServices, foods };
}
