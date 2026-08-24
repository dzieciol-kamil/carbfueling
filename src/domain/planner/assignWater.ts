/**
 * L2 step 1 — water service assignment. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1, and §2.1 for why volume
 * is never an authored field.
 *
 * **W5b-1, 2026-08-24: one vessel set for the whole ride, not a per-leg greedy.** The original
 * per-leg greedy (walk the water-capable vessels largest-first, every leg, independently) let a
 * high-demand leg open a third or fourth bottle that no later leg ever needed again — carried empty
 * for the rest of the ride (`autoplanPacing.test.ts`'s "no vessel is drained early and then carried
 * empty", measured dying at km 44/194 in W5a). The owner's ruling: L1 already fixed the stop count;
 * L2 must carry the FEWEST vessels that still clear the F1 floor on EVERY leg, sized by the worst
 * leg, and top them up at every stop — declared gear is a ceiling, not a target.
 *
 * **Mid-flight ruling, same day: a vessel with carb duty ahead of it gets no water before that
 * duty.** Owner's words: "jak mamy bidon i on ma izo i idzie na początek, a potem mamy drugi bidon
 * też z izo, to ten drugi nie może dostać wody w tym czasie kiedy mamy pierwszy z izo. dolewamy do
 * wszystkich w których mieliśmy wodę, albo więcej izo już nie będziemy wieźć." A relay bottle that
 * carries izo later left home already holding it — it is reserved from km 0, even though its
 * `Service` record only starts mid-route, so giving it water on an earlier leg (or in a gap between
 * two of its own carb turns) would describe one bottle holding two things at once. This settles the
 * genuinely-open A/B question from the original brief in FAVOUR of "top up everything the ride is
 * already carrying, once it's carrying it" ("dolewamy do wszystkich w których mieliśmy wodę") — by
 * ruling, not by measurement (the two policies tied on every fixture in the measurement suite; see
 * `docs/superpowers/specs/2026-08-24-w5b1-measurements.md` §5). It also **generalizes S7** (a spent
 * one-shot gel vessel takes water once it's spent) to izo: any vessel becomes water-eligible only
 * once ALL of its carb duty — past, present and future — is behind the leg in question.
 */
import { HYDRATION_BUFFER_ML_PER_KG, sweat, totalHours } from '../fuel';
import type { PlanState, Vessel } from '../types';
import { deliveredShare } from './deliveredShare';
import { FLUID_FLOOR_FRACTION } from './skeleton';
import type { Leg, Service, Skeleton } from './types';

const EPS = 1e-6;

/**
 * Guard on the subset enumeration below: `2**MAX_SUBSET_VESSELS` candidate sets, checked against
 * every leg. At 10 that is 1024 subsets — trivial against the runtime budget (§6) — and gear this
 * large has never appeared in a fixture. Above it, skip the search and fall back to the full
 * water-capable set (the pre-W5b-1 largest-first-until-the-floor-clears behaviour), so a plan is
 * still produced, just not the minimal one.
 */
const MAX_SUBSET_VESSELS = 10;

/**
 * For each vessel that has any `carbs` service at all, the km at which its LAST one ends — the
 * point past which it holds no more pending carb duty. A vessel absent from the map never had carb
 * duty and is water-eligible everywhere.
 */
function computeCarbDoneAtKm(carbs: Service[]): Map<string, number> {
  const doneAt = new Map<string, number>();
  for (const c of carbs) {
    const cur = doneAt.get(c.vesselId);
    if (cur === undefined || c.toKm > cur) doneAt.set(c.vesselId, c.toKm);
  }
  return doneAt;
}

/**
 * Whether `vesselId` may carry water on `leg`: true iff it has no carb duty at all, or its LAST carb
 * service ends at or before this leg starts. A vessel with a future carb turn still pending — even
 * one currently sitting in a gap between two of its own turns — is not eligible (the mid-flight
 * ruling above); one whose carb duty is entirely in the past is, which is S7 generalized to izo.
 */
function isEligible(vesselId: string, leg: Leg, carbDoneAtKm: Map<string, number>): boolean {
  const doneAt = carbDoneAtKm.get(vesselId);
  return doneAt === undefined || leg.fromKm >= doneAt - EPS;
}

interface LegWaterInfo {
  floorMl: number;
  /** What `carbs` already delivers on this leg, prorated by `deliveredShare` (P3, §4 step 2). */
  carriedByCarbs: number;
}

/**
 * Per-leg fluid already delivered by `carbs` (P3) — computed once so both the set search and the
 * per-leg emission below reuse the same numbers. Based on km overlap with THIS leg specifically
 * (unlike eligibility above, which looks at a vessel's whole carb history): a sparse-dose gel
 * service can span several legs and deliver 0 to a leg it merely passes through.
 */
function computeLegInfo(
  skeleton: Skeleton,
  carbs: Service[],
  gear: Vessel[],
  route: PlanState['route'],
): LegWaterInfo[] {
  const volByGid = new Map(gear.map((v) => [v.gid, v.vol]));
  return skeleton.legs.map((leg) => {
    let carriedByCarbs = 0;
    for (const c of carbs) {
      const overlaps = Math.min(leg.toKm, c.toKm) > Math.max(leg.fromKm, c.fromKm);
      if (!overlaps) continue;
      carriedByCarbs += (volByGid.get(c.vesselId) ?? 0) * deliveredShare(c, leg, gear, route);
    }
    return { floorMl: FLUID_FLOOR_FRACTION * leg.fluidNeedMl, carriedByCarbs };
  });
}

/** Whether `subset`, combined with each leg's carb credit and each member's eligibility there,
 *  clears every leg's F1 floor. */
function feasible(
  subset: Vessel[],
  legs: Leg[],
  legInfo: LegWaterInfo[],
  carbDoneAtKm: Map<string, number>,
): boolean {
  return legs.every((leg, i) => {
    let total = legInfo[i].carriedByCarbs;
    for (const v of subset) {
      if (isEligible(v.gid, leg, carbDoneAtKm)) total += v.vol;
    }
    return total >= legInfo[i].floorMl - EPS;
  });
}

/**
 * Chooses ONE vessel set for the whole ride (W5b-1 ruling, 2026-08-24): the fewest water-capable
 * vessels that still clear the F1 floor on every leg, ties broken toward the smallest total volume
 * (less credited over-pour), then by `gid` so the result is deterministic. Stop count is not
 * revisited here — L1 already fixed it; this only decides how much of the declared gear a plan at
 * that stop count actually needs.
 *
 * A vessel reserved for carb duty later in the ride contributes zero water capacity to every leg
 * that duty is still pending on (the mid-flight ruling's eligibility test, above) — so feasibility
 * is still monotone in set membership (adding a vessel can only add carried volume on a leg it's
 * eligible for, never remove it), just computed per-leg-per-vessel instead of by raw volume. So
 * enumerating subsets ordered by `(cardinality, totalVolume, gid)` and returning the first feasible
 * one is still correct, not just a heuristic — and cheap, since `gear` here is a handful of vessels
 * (guarded by `MAX_SUBSET_VESSELS` above).
 *
 * If no subset — including the full set — is feasible, that means L1 sized the ride against a
 * capacity L2's water-capable vessels cannot reach (possible now that L1's own capacity test counts
 * every vessel, `skeleton.ts`'s `carryableFluid`, including ones that can't hold water, and now that
 * a vessel with pending carb duty contributes nothing to the legs it's reserved on). Falls back to
 * the full water-capable set and lets the plan come up short rather than inventing a stop — L1 owns
 * stop count, not this function.
 */
function chooseVesselSet(
  waterVessels: Vessel[],
  legs: Leg[],
  legInfo: LegWaterInfo[],
  carbDoneAtKm: Map<string, number>,
): Vessel[] {
  const n = waterVessels.length;
  if (n === 0) return [];
  if (n > MAX_SUBSET_VESSELS) return waterVessels; // guard — fall back to the full set

  const subsets: Vessel[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const subset: Vessel[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(waterVessels[i]);
    subsets.push(subset);
  }
  subsets.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    const volA = a.reduce((s, v) => s + v.vol, 0);
    const volB = b.reduce((s, v) => s + v.vol, 0);
    if (volA !== volB) return volA - volB;
    const idsA = [...a]
      .sort((x, y) => (x.gid < y.gid ? -1 : 1))
      .map((v) => v.gid)
      .join(',');
    const idsB = [...b]
      .sort((x, y) => (x.gid < y.gid ? -1 : 1))
      .map((v) => v.gid)
      .join(',');
    return idsA < idsB ? -1 : idsA > idsB ? 1 : 0;
  });

  for (const subset of subsets) {
    if (feasible(subset, legs, legInfo, carbDoneAtKm)) return subset;
  }
  return waterVessels; // no subset is feasible — fall back, let the measurement show the shortfall
}

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
 * **Vessel selection (W5b-1).** `chooseVesselSet` picks ONE set of water-capable vessels for the
 * whole ride — the fewest that clear the F1 floor on every leg — once, up front. Per leg, every set
 * member that's water-*eligible* there (no carb duty pending, past or present — see `isEligible`) is
 * opened, regardless of whether fewer of them would already clear that particular leg's floor: the
 * ride is already carrying the set and already stopping, so topping up everything it holds water in
 * is free ("dolewamy do wszystkich w których mieliśmy wodę" — the mid-flight ruling above). A member
 * the set doesn't need at all never entered the set in the first place (that's `chooseVesselSet`'s
 * job), so this never stacks capacity beyond what F7 already tolerates as over-pour.
 *
 * **A vessel with pending carb duty is not touched.** Not just "claimed on this exact leg" (the
 * original §4 step 2 reading) — any vessel whose LAST carb service hasn't ended yet, including one
 * sitting in a gap between two of its own carb turns, is excluded from water on every leg up to and
 * including that duty. Once its carb history is entirely in the past, it's eligible everywhere after
 * (S7 generalized to izo). A `Service` is one vessel, one content, one span regardless — mid-leg
 * refills without a stop still aren't representable.
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

  const waterVessels = [...gear].filter((v) => v.allowed.includes('water'));
  const carbDoneAtKm = computeCarbDoneAtKm(carbs);
  const legInfo = computeLegInfo(skeleton, carbs, gear, route);
  const chosenSet = chooseVesselSet(waterVessels, skeleton.legs, legInfo, carbDoneAtKm);
  // Emission order only matters for determinism here (every eligible member is opened regardless of
  // order) — largest-first kept for parity with the rest of the codebase's convention.
  const emissionOrder = [...chosenSet].sort((a, b) => b.vol - a.vol);

  const services: Service[] = [];

  skeleton.legs.forEach((leg, i) => {
    const filledAtStop = i === 0 ? null : i - 1; // S4 (leg 0) vs V1 (every later leg)

    for (const v of emissionOrder) {
      if (!isEligible(v.gid, leg, carbDoneAtKm)) continue; // carb duty pending, past or present
      services.push({
        vesselId: v.gid,
        fromKm: leg.fromKm,
        toKm: leg.toKm,
        content: 'water',
        filledAtStop,
      });
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
