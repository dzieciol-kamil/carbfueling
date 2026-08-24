/**
 * L2 step 1 — water service assignment. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, and §2.1 for why volume
 * is never an authored field.
 */
import { HYDRATION_BUFFER_ML_PER_KG, sweat, totalHours } from '../fuel';
import type { PlanState } from '../types';
import { deliveredShare } from './deliveredShare';
import { FLUID_FLOOR_FRACTION } from './skeleton';
import type { Service, Skeleton } from './types';

/**
 * Assigns one water `Service` per leg per vessel opened for that leg — **fills what `carbs` left
 * over** (§4.1: `assignCarbs` runs first and claims vessels without negotiating; this function never
 * displaces a carb claim, it only tops up the remainder).
 *
 * **Why one fresh service per leg, not one long service spanning several legs.** §2.1's over-credit
 * trap: every service credits its vessel's *full* capacity regardless of span, so a vessel reused
 * leg after leg must be re-anchored to the stop between them (invariant V1) — otherwise a single
 * bottle drunk continuously across N legs would silently look like N full bottles. Conversely,
 * skeleton legs are exactly the spans L1 already proved a vessel can cover at the F1 floor (§3.2's
 * `carryableMl ≥ 0.85 × fluidNeed(i,j)` derivation), so sizing each service to exactly one leg is
 * "sized to the leg's need" in the only sense §2.1 allows: span, not millilitres.
 *
 * **Credit for what carbs already deliver (§4 step 2, P3).** A vessel carrying izo or gel occupies
 * that vessel but delivers its vessel's *full* capacity as fluid all the same — content never changes
 * `volOf()`. So each leg starts from the fluid already provided by `carbs` services overlapping it,
 * prorated by `deliveredShare` — the same basis `samples()` itself uses to spread a fill across its
 * span, not elapsed time (a gel service is laid out independently of leg boundaries and can span
 * several legs; crediting it whole to each would triple-count it — the same over-credit trap of
 * §2.1, from the other direction). Only once that credit is short of the F1 floor does this function
 * open further vessels.
 *
 * **A claimed vessel is not touched (§4 step 2).** Any vessel with a `carbs` service overlapping a
 * leg — even partially — cannot also carry water over that leg: a `Service` is one vessel, one
 * content, one span, and mid-leg refills without a stop aren't representable. Such vessels are simply
 * excluded from that leg's candidate list; they may still be opened for water on a *different* leg
 * where they carry nothing.
 *
 * **Vessel selection (S4).** Per leg, water-capable vessels not already claimed by `carbs` are opened
 * largest-first until the carried-plus-credited total clears the leg's F1 floor
 * (`0.85 × fluidNeedMl`); vessels beyond that stay unopened. This is also what keeps F7 honest without
 * a separate check: stopping at the floor instead of opening every vessel every leg avoids stacking
 * capacity that can only pour above `FLUID_ABSORPTION_CAP_ML_H` and be wasted, not counted as
 * coverage.
 *
 * **`filledAtStop` (V1).** A leg's `fromKm` is either `0` (the ride start, no stop exists there —
 * S4's "left home with it") or exactly the km of the stop L1 placed before it (skeleton legs and
 * stops are built from the same path in `buildSkeleton`, so this correspondence is exact). So every
 * service opened for leg `i > 0` is anchored to `skeleton.stops[i - 1]`, which is always a stop the
 * plan already makes — F6's "top-up at an existing stop is free and always taken" is therefore not a
 * separate case to implement, it falls out of assigning per-leg. V1 itself is asserted over the
 * vessel's **combined** `carbs` + water timeline, not over the water services alone — a vessel that
 * carried gel or izo earlier and takes water later is one vessel with a two-part history.
 *
 * **F4 gate.** Independent of the carb short-ride gate (C5) — this checks only sweat loss against
 * body mass, never `totalHours`.
 */
export function assignWater(skeleton: Skeleton, state: PlanState, carbs: Service[]): Service[] {
  const { route, gear } = state;

  const sweatLoss = sweat(route) * totalHours(route);
  if (sweatLoss < route.weight * HYDRATION_BUFFER_ML_PER_KG) return []; // F4

  const waterVessels = [...gear]
    .filter((v) => v.allowed.includes('water'))
    .sort((a, b) => b.vol - a.vol); // largest first — fewest vessels opened to clear the floor
  const volByGid = new Map(gear.map((v) => [v.gid, v.vol]));

  const services: Service[] = [];

  skeleton.legs.forEach((leg, i) => {
    const floorMl = FLUID_FLOOR_FRACTION * leg.fluidNeedMl; // F1
    const filledAtStop = i === 0 ? null : i - 1; // S4 (leg 0) vs V1 (every later leg)

    // What carbs already deliver on this leg, prorated by deliveredShare (§4 step 2) — plus which
    // vessels that claims, those stay untouched this leg. Claiming is decided by km overlap alone
    // (a vessel is physically one content over its whole span, regardless of how much of its load
    // a sparse-dose gel happens to place inside this particular leg), so it's kept separate from the
    // delivered-share amount, which can legitimately be 0 for a leg between two gel doses.
    const claimedVesselIds = new Set<string>();
    let carried = 0;
    for (const c of carbs) {
      const overlaps = Math.min(leg.toKm, c.toKm) > Math.max(leg.fromKm, c.fromKm);
      if (!overlaps) continue;
      claimedVesselIds.add(c.vesselId);
      carried += (volByGid.get(c.vesselId) ?? 0) * deliveredShare(c, leg, gear, route);
    }

    for (const v of waterVessels) {
      if (carried >= floorMl) break; // S4: the rest stay unopened for this leg
      if (claimedVesselIds.has(v.gid)) continue; // already carrying izo/gel over this span
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

  assertInvariantV1([...carbs, ...services], skeleton); // V1 over the combined timeline
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
