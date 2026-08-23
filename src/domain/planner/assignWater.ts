/**
 * L2 step 1 — water service assignment. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, and §2.1 for why volume
 * is never an authored field.
 */
import { HYDRATION_BUFFER_ML_PER_KG, sweat, totalHours } from '../fuel';
import type { PlanState } from '../types';
import { FLUID_FLOOR_FRACTION } from './skeleton';
import type { Service, Skeleton } from './types';

/**
 * Assigns one water `Service` per leg per vessel opened for that leg.
 *
 * **Why one fresh service per leg, not one long service spanning several legs.** §2.1's over-credit
 * trap: every service credits its vessel's *full* capacity regardless of span, so a vessel reused
 * leg after leg must be re-anchored to the stop between them (invariant V1) — otherwise a single
 * bottle drunk continuously across N legs would silently look like N full bottles. Conversely,
 * skeleton legs are exactly the spans L1 already proved a vessel can cover at the F1 floor (§3.2's
 * `carryableMl ≥ 0.85 × fluidNeed(i,j)` derivation), so sizing each service to exactly one leg is
 * "sized to the leg's need" in the only sense §2.1 allows: span, not millilitres.
 *
 * **Vessel selection (S4).** Per leg, water-capable vessels are opened largest-first until their
 * summed capacity clears the leg's F1 floor (`0.85 × fluidNeedMl`); vessels beyond that stay
 * unopened. This is also what keeps F7 honest without a separate check: stopping at the floor
 * instead of opening every vessel every leg avoids stacking capacity that can only pour above
 * `FLUID_ABSORPTION_CAP_ML_H` and be wasted, not counted as coverage.
 *
 * **`filledAtStop` (V1).** A leg's `fromKm` is either `0` (the ride start, no stop exists there —
 * S4's "left home with it") or exactly the km of the stop L1 placed before it (skeleton legs and
 * stops are built from the same path in `buildSkeleton`, so this correspondence is exact). So every
 * service opened for leg `i > 0` is anchored to `skeleton.stops[i - 1]`, which is always a stop the
 * plan already makes — F6's "top-up at an existing stop is free and always taken" is therefore not a
 * separate case to implement, it falls out of assigning per-leg.
 *
 * **F4 gate.** Independent of the carb short-ride gate (C5) — this checks only sweat loss against
 * body mass, never `totalHours`.
 */
export function assignWater(skeleton: Skeleton, state: PlanState): Service[] {
  const { route, gear } = state;

  const sweatLoss = sweat(route) * totalHours(route);
  if (sweatLoss < route.weight * HYDRATION_BUFFER_ML_PER_KG) return []; // F4

  const waterVessels = [...gear]
    .filter((v) => v.allowed.includes('water'))
    .sort((a, b) => b.vol - a.vol); // largest first — fewest vessels opened to clear the floor

  const services: Service[] = [];

  skeleton.legs.forEach((leg, i) => {
    const floorMl = FLUID_FLOOR_FRACTION * leg.fluidNeedMl; // F1
    const filledAtStop = i === 0 ? null : i - 1; // S4 (leg 0) vs V1 (every later leg)

    let carried = 0;
    for (const v of waterVessels) {
      if (carried >= floorMl) break; // S4: the rest stay unopened for this leg
      services.push({
        vesselId: v.gid,
        fromKm: leg.fromKm,
        toKm: leg.toKm,
        content: 'water',
        filledAtStop,
      });
      carried += v.vol;
    }
  });

  assertInvariantV1(services, skeleton);
  return services;
}

/**
 * V1: for each vessel, ordered by `fromKm`, the first service may be unanchored (S4) but every
 * later one must be anchored to a stop sitting exactly at its `fromKm`. Thrown, not merely logged,
 * because a silent violation is exactly the over-credit bug §2.1 exists to prevent.
 */
function assertInvariantV1(services: Service[], skeleton: Skeleton): void {
  const byVessel = new Map<string, Service[]>();
  for (const s of services) {
    const list = byVessel.get(s.vesselId);
    if (list) list.push(s);
    else byVessel.set(s.vesselId, [s]);
  }

  for (const [vesselId, list] of byVessel) {
    const ordered = [...list].sort((a, b) => a.fromKm - b.fromKm);
    ordered.forEach((s, idx) => {
      if (idx === 0) return; // first service: null is allowed (S4)
      if (s.filledAtStop === null) {
        throw new Error(
          `V1 violated: vessel ${vesselId} service #${idx} at km ${s.fromKm} has no filledAtStop`,
        );
      }
      const stop = skeleton.stops[s.filledAtStop];
      if (!stop || stop.km !== s.fromKm) {
        throw new Error(
          `V1 violated: vessel ${vesselId} service #${idx} at km ${s.fromKm} is anchored to stop ` +
            `${s.filledAtStop} (km ${stop?.km ?? 'missing'})`,
        );
      }
    });
  }
}

// Exported for direct assertion in tests without duplicating the traversal logic — see spec: "Assert
// V1 in code and test it directly with a dedicated test."
export { assertInvariantV1 };
