import { describe, expect, test } from 'vitest';
import { dist, samples, sweat, totalHours } from '../fuel';
import type { DraftFill } from '../autoplan';
import type { Fill, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assertInvariantV1, assignWater } from './assignWater';
import { buildSkeleton, FLUID_FLOOR_FRACTION } from './skeleton';
import type { CostWeights } from './skeleton';
import { servicesToFills } from './services';
import type { Service, Skeleton } from './types';

/** `servicesToFills` returns `DraftFill[]` (no `fid`); `samples()` needs a real `Fill[]`. Mirrors
 *  services.test.ts's own helper for the same reason. */
function asFills(drafts: DraftFill[]): Fill[] {
  return drafts.map((d, i) => ({ ...d, fid: i }));
}

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 100,
    speed: 25,
    hours: 0,
    minutes: 0,
    weight: 75,
    preMealCarbs: 0,
    preMealMinutes: 0,
    intensity: 'mid',
    temp: 20,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

const MIX: MixSettings = {
  conc: 8.4,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  salt: 0.16,
  citric: 0.2,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};

function water(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

/** A vessel that can carry carbs and water both — used to test the carb/water handoff (§4 step 2). */
function dualVessel(vol: number, gid: string): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water', 'izo', 'gel'], gelParts: 1 };
}

function makeState(route: RouteInput, gear: Vessel[]): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib: [], stops: [] };
}

const BALANCED: CostWeights = { wStop: 1.0, wLoad: 1.0, wShort: 1000 };

/** F1's own test method (spec: "Test the F1 floor on raw per-sample deltas, not the EMA-smoothed
 *  fluidRate/fluidNeedRate"). `ml`/`fluidNeed` are already the raw, unsmoothed cumulative curves —
 *  `samples()`'s own comment confirms `fluidRate`/`fluidNeedRate` are a *separate*, further-smoothed
 *  pair built from them. Diffing consecutive samples reconstructs the raw instantaneous rate without
 *  going anywhere near the smoothed fields. Last 2% of the route is exempt per F1. */
function worstRawFluidPct(state: PlanState): number {
  const S = samples(state);
  const D = dist(state.route);
  let worst = Infinity;
  for (let i = 1; i < S.length; i++) {
    if (S[i].x > D * 0.98) continue;
    const deliveredDelta = S[i].ml - S[i - 1].ml;
    const needDelta = S[i].fluidNeed - S[i - 1].fluidNeed;
    if (needDelta <= 0) continue;
    const pct = deliveredDelta / needDelta;
    if (pct < worst) worst = pct;
  }
  return worst;
}

describe('assignWater', () => {
  test("F4 gate: below the sweat-vs-body-mass threshold, no refills are planned but S4's base load still ships", () => {
    // temp=10 (no heat bonus), intensity='low' (iB=0): sweat = round(380/10)*10 = 380 ml/h.
    // distance=5, speed=25 ⇒ hours=0.2 ⇒ sweatLoss=76ml, well under weight(75)*15=1125.
    const route = makeRoute({ distance: 5, speed: 25, intensity: 'low', temp: 10, weight: 75 });
    expect(sweat(route) * totalHours(route)).toBeLessThan(route.weight * 15);
    const state = makeState(route, [water(1000)]);
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 5, hours: 0.2, fluidNeedMl: 76, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };

    // F4 gates *refill planning*, not the rider's starting bottle (S4) — a single unanchored
    // service carrying it the whole way, no stop.
    expect(assignWater(skeleton, state, [])).toEqual([
      { vesselId: 'g1', fromKm: 0, toKm: 5, content: 'water', filledAtStop: null },
    ]);
  });

  test('one service per leg, anchored per V1: null at the start, the prior stop everywhere else', () => {
    const route = makeRoute({ distance: 75, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(700)]);
    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });
    expect(skeleton.stops).toHaveLength(2); // reuses the hand-verified skeleton.test.ts #1 scenario

    const services = assignWater(skeleton, state, []);

    expect(services).toHaveLength(3);
    services.forEach((s, i) => {
      expect(s.vesselId).toBe('g1');
      expect(s.content).toBe('water');
      expect(s.fromKm).toBe(skeleton.legs[i].fromKm);
      expect(s.toKm).toBe(skeleton.legs[i].toKm);
      expect(s.filledAtStop).toBe(i === 0 ? null : i - 1);
    });
  });

  test('S4: a vessel more than sufficient on its own leaves a second vessel unopened', () => {
    const route = makeRoute({ distance: 75, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    // Single 700ml bottle alone already clears every leg's floor (skeleton.test.ts #1); a second,
    // smaller bottle is along for the ride but never needed.
    const state = makeState(route, [water(700, 'big'), water(200, 'small')]);
    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });

    const services = assignWater(skeleton, state, []);

    expect(services.length).toBeGreaterThan(0);
    expect(services.every((s) => s.vesselId === 'big')).toBe(true);
    expect(services.some((s) => s.vesselId === 'small')).toBe(false);
  });

  test('a leg whose floor needs two vessels together opens both, same span and anchor', () => {
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };
    // floor = 0.85 * 1000 = 850. One 500ml vessel alone can't clear it; both together (1000) can.
    const route = makeRoute({ distance: 40, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(500, 'a'), water(500, 'b')]);

    const services = assignWater(skeleton, state, []);

    expect(services).toHaveLength(2);
    expect(services.map((s) => s.vesselId).sort()).toEqual(['a', 'b']);
    for (const s of services) {
      expect(s.fromKm).toBe(0);
      expect(s.toKm).toBe(40);
      expect(s.filledAtStop).toBeNull();
    }
  });

  test('W5b-1: chooseVesselSet ties broken by smallest total volume, then by gid', () => {
    // floor = 0.85 * 1000 = 850. No single 300/300/700ml vessel clears it alone, so the search moves
    // to pairs. {x,y} = 600ml is the cheapest pair by volume but stays short of the floor, so it's
    // rejected even though it's tried first (cardinality 2, smallest volume). The two pairs that
    // *do* clear it — {x,w} and {y,w}, both 1000ml — tie on volume, so gid breaks the tie: sorted
    // vessel ids 'w,x' < 'w,y', so {x,w} wins and 'y' is never opened.
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };
    const route = makeRoute({ distance: 40, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(300, 'x'), water(300, 'y'), water(700, 'w')]);

    const services = assignWater(skeleton, state, []);

    expect(services.map((s) => s.vesselId).sort()).toEqual(['w', 'x']);
    expect(services.some((s) => s.vesselId === 'y')).toBe(false);
  });

  test('W5b-1: no feasible subset falls back to the full water-capable set rather than inventing a stop', () => {
    // floor = 0.85 * 1000 = 850. Even both vessels together (300 + 400 = 700) fall short, so no
    // subset — including the full set — clears it. `chooseVesselSet` falls back to the full set
    // (both opened) instead of throwing or silently planning less than it can; the caller (L1's own
    // skeleton, in the real pipeline) is what reports the resulting shortfall — this function's job
    // ends at "carry everything you have".
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };
    const route = makeRoute({ distance: 40, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(300, 'a'), water(400, 'b')]);

    const services = assignWater(skeleton, state, []);

    expect(services.map((s) => s.vesselId).sort()).toEqual(['a', 'b']);
  });

  test('F3: one small bottle forces several top-ups — no policy cap on stop/service count', () => {
    // Deliberately smaller than the F3 reference bottle (1000ml/4 stops in skeleton.test.ts #2) so
    // the count must climb well past any of the old engine's fixed refill caps.
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(400)]);
    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });
    expect(skeleton.shortfall).toBeNull();
    expect(skeleton.stops.length).toBeGreaterThan(6); // physics-driven, not policy-capped

    const services = assignWater(skeleton, state, []);

    // Single vessel ⇒ exactly one service per leg, all on that vessel.
    expect(services).toHaveLength(skeleton.legs.length);
    expect(services.every((s) => s.vesselId === 'g1')).toBe(true);
    assertInvariantV1(services, skeleton); // re-asserted directly, not just trusted from inside assignWater
  });

  test('F1 raw-delta floor holds end to end on a real assigned plan (single-leg, exact 85% boundary)', () => {
    // Reuses skeleton.test.ts #1's hand-verified numbers: sweat=700ml/h, hours=3, totalFluidNeed=2100.
    // A single vessel sized at exactly 0.85 * 2100 = 1785ml, carried the whole route with no stop,
    // puts the raw delivered/need ratio right at the F1 boundary everywhere (flat route ⇒ both `ml`
    // and `fluidNeed` ramp linearly in x, so the ratio of their raw deltas is constant).
    const route = makeRoute({ distance: 75, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const D = dist(route);
    const state = makeState(route, [water(1785)]);
    const skeleton: Skeleton = {
      stops: [],
      legs: [
        {
          fromKm: 0,
          toKm: D,
          hours: totalHours(route),
          fluidNeedMl: 2100,
          carbNeedG: 0,
          absorbCapG: 0,
        },
      ],
      shortfall: null,
    };

    const services = assignWater(skeleton, state, []);
    expect(services).toHaveLength(1);

    const fullState: PlanState = {
      ...state,
      fills: asFills(servicesToFills(services, state.gear)),
    };
    const worst = worstRawFluidPct(fullState);

    expect(worst).toBeGreaterThanOrEqual(FLUID_FLOOR_FRACTION - 1e-6);
    expect(worst).toBeLessThan(FLUID_FLOOR_FRACTION + 0.02); // tight to the boundary, not oversized
  });

  test('F1 raw-delta floor holds end to end on a real multi-stop skeleton', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(1000)]);
    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });
    expect(skeleton.shortfall).toBeNull();

    const services = assignWater(skeleton, state, []);
    const fullState: PlanState = {
      ...state,
      fills: asFills(servicesToFills(services, state.gear)),
    };
    const worst = worstRawFluidPct(fullState);

    expect(worst).toBeGreaterThanOrEqual(FLUID_FLOOR_FRACTION - 1e-6);
  });

  test('§4 step 2: a ride the carb credit alone fully covers opens no water vessel at all', () => {
    // floor = 0.85 * 1000 = 850. A single izo service spanning the whole (only) leg delivers its
    // vessel's full 900ml as fluid (P3) — already past the floor — so the ride needs zero
    // water-capable vessels: `chooseVesselSet` (W5b-1) picks the empty set, and an empty set opens
    // nothing on any leg regardless of Policy A/B (see the next test for where A and B actually
    // diverge — this one doesn't, on purpose, since it isolates the "needs nothing at all" case).
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };
    const route = makeRoute({ distance: 40, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [dualVessel(900, 'izoVessel'), water(500, 'spare')]);
    const carbs: Service[] = [
      { vesselId: 'izoVessel', fromKm: 0, toKm: 40, content: 'izo', filledAtStop: null },
    ];

    const services = assignWater(skeleton, state, carbs);

    expect(services).toEqual([]);
  });

  test('W5b-1/Policy B: a set member still gets topped up on a leg the carb credit alone already clears', () => {
    // Supersedes the old per-leg reading of §4 step 2 ("a leg already cleared by carbs opens no
    // water vessel at all", as a blanket rule) — decided 2026-08-24, see
    // docs/superpowers/specs/2026-08-24-w5b1-measurements.md §5. The ruling ("nalewać do
    // wszystkich": once a vessel is part of the ride's chosen set, top it up at every stop it isn't
    // carb-claimed at, not just the legs that individually need it) beat "Policy A" (skip a leg the
    // carb credit alone clears) in a tie: the two never produced different numbers anywhere in the
    // measured fixture suite, so the decision came down to which one the ruling's own words
    // describe — this scenario is the smallest one that tells them apart.
    //
    // Leg 0's floor (850) is cleared by 'izoVessel's carb credit (900) alone. Leg 1 (floor 425) has
    // no carb credit at all, so the ride's chosen set must include 'spare' (500ml, cheaper than
    // reusing the claimed-elsewhere 'izoVessel' at 900ml) to cover it. Policy B then opens 'spare'
    // on BOTH legs — including leg 0, which never needed it.
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [
        { fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 },
        { fromKm: 40, toKm: 80, hours: 2, fluidNeedMl: 500, carbNeedG: 0, absorbCapG: 0 },
      ],
      shortfall: null,
    };
    const route = makeRoute({ distance: 80, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [dualVessel(900, 'izoVessel'), water(500, 'spare')]);
    const carbs: Service[] = [
      { vesselId: 'izoVessel', fromKm: 0, toKm: 40, content: 'izo', filledAtStop: null },
    ];

    const services = assignWater(skeleton, state, carbs);

    expect(services).toHaveLength(2);
    expect(services.every((s) => s.vesselId === 'spare')).toBe(true);
    expect(services.map((s) => [s.fromKm, s.toKm])).toEqual([
      [0, 40],
      [40, 80],
    ]);
  });

  test('§4 step 2: a vessel already claimed by carbs is skipped even as the largest candidate', () => {
    // floor = 0.85 * 1000 = 850. The claimed vessel (800ml) alone falls 50ml short of the floor, so
    // water must open a further vessel — but never the claimed one, even though at 800ml it would
    // otherwise be picked first (largest-first, S4).
    const skeleton: Skeleton = {
      stops: [],
      legs: [{ fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 }],
      shortfall: null,
    };
    const route = makeRoute({ distance: 40, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [dualVessel(800, 'izoVessel'), water(100, 'small')]);
    const carbs: Service[] = [
      { vesselId: 'izoVessel', fromKm: 0, toKm: 40, content: 'izo', filledAtStop: null },
    ];

    const services = assignWater(skeleton, state, carbs);

    expect(services).toHaveLength(1);
    expect(services[0].vesselId).toBe('small');
    expect(services.some((s) => s.vesselId === 'izoVessel')).toBe(false);
  });

  test('§4 step 2: a service spanning several legs is credited by duration share, not counted whole on each', () => {
    // A single izo service covers legs 0 and 1 together (0->80, two 40km/2h legs) — not aligned to
    // the leg boundary at 40, the same shape a gel service's own back-to-back staggering produces.
    // Its 900ml vessel is credited proportionally: half the service's duration falls in each leg, so
    // each leg sees 450ml of credit — short of the 850 floor either way — never the full 900ml
    // double-counted onto both.
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [
        { fromKm: 0, toKm: 40, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 },
        { fromKm: 40, toKm: 80, hours: 2, fluidNeedMl: 1000, carbNeedG: 0, absorbCapG: 0 },
      ],
      shortfall: null,
    };
    const route = makeRoute({ distance: 80, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [dualVessel(900, 'span'), water(1000, 'topup')]);
    const carbs: Service[] = [
      { vesselId: 'span', fromKm: 0, toKm: 80, content: 'izo', filledAtStop: null },
    ];

    const services = assignWater(skeleton, state, carbs);

    // Both legs still need a top-up (450 credited < 850 floor on each); the spanning vessel itself
    // is claimed on both legs (its service overlaps both), so every opened service is 'topup'.
    expect(services).toHaveLength(2);
    expect(services.every((s) => s.vesselId === 'topup')).toBe(true);
  });

  test('§4/V1: a vessel carrying carbs early and water later is anchored correctly across the combined timeline', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 60, origin: 'planned' }],
      legs: [
        { fromKm: 0, toKm: 60, hours: 2, fluidNeedMl: 100, carbNeedG: 0, absorbCapG: 0 },
        { fromKm: 60, toKm: 120, hours: 2, fluidNeedMl: 500, carbNeedG: 0, absorbCapG: 0 },
      ],
      shortfall: null,
    };
    const route = makeRoute({ distance: 120, speed: 20, intensity: 'mid', temp: 20, weight: 75 });
    // 'dual' is the only water-capable vessel, so leg 1 (unclaimed there) must open it for water.
    const state = makeState(route, [dualVessel(500, 'dual')]);
    const carbs: Service[] = [
      { vesselId: 'dual', fromKm: 0, toKm: 60, content: 'gel', filledAtStop: null }, // S4
    ];

    const services = assignWater(skeleton, state, carbs);

    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      vesselId: 'dual',
      fromKm: 60,
      toKm: 120,
      content: 'water',
      filledAtStop: 0, // anchored to skeleton.stops[0], km 60 — matches its own fromKm
    });
    expect(skeleton.stops[0].km).toBe(services[0].fromKm);

    // Re-asserted directly over the combined timeline, not the water array alone.
    expect(() => assertInvariantV1([...carbs, ...services], skeleton)).not.toThrow();
  });
});

describe('assertInvariantV1', () => {
  const skeleton: Skeleton = { stops: [{ km: 30, origin: 'planned' }], legs: [], shortfall: null };

  test('throws when a vessel is reused without being anchored to any stop', () => {
    const services: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      { vesselId: 'g1', fromKm: 30, toKm: 60, content: 'water', filledAtStop: null }, // should be 0
    ];
    expect(() => assertInvariantV1(services, skeleton)).toThrow(/V1/);
  });

  test("throws when a service's stop km does not match its fromKm", () => {
    const services: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      { vesselId: 'g1', fromKm: 35, toKm: 60, content: 'water', filledAtStop: 0 }, // stop is at km 30
    ];
    expect(() => assertInvariantV1(services, skeleton)).toThrow(/V1/);
  });

  test('does not throw for a correctly anchored relay, and null stays legal on the first service', () => {
    const services: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      { vesselId: 'g1', fromKm: 30, toKm: 60, content: 'water', filledAtStop: 0 },
    ];
    expect(() => assertInvariantV1(services, skeleton)).not.toThrow();
  });

  test('a wrongly-unanchored water service is missed when checked alone, but caught combined with its carb history', () => {
    // 'g1' carried gel 0->30 (a real earlier use) before switching to water 30->60. Checked alone,
    // the water service is index 0 within its own (water-only) array, so the "first service may be
    // null" rule silently waves it through even though it is actually a reuse. This is exactly why
    // V1 must be checked over the vessel's combined timeline (§4 step 2), not one source array.
    const carbs: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 30, content: 'gel', filledAtStop: null },
    ];
    const badWater: Service[] = [
      { vesselId: 'g1', fromKm: 30, toKm: 60, content: 'water', filledAtStop: null }, // wrong: should be 0
    ];
    expect(() => assertInvariantV1(badWater, skeleton)).not.toThrow(); // the gap
    expect(() => assertInvariantV1([...carbs, ...badWater], skeleton)).toThrow(/V1/); // combined catches it
  });

  test('assignWater itself throws on a malformed skeleton where a leg boundary has no matching stop', () => {
    const route = makeRoute({ distance: 50, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(1000)]);
    const badSkeleton: Skeleton = {
      stops: [{ km: 999, origin: 'planned' }], // real leg boundary is at km 25, not 999
      legs: [
        { fromKm: 0, toKm: 25, hours: 1, fluidNeedMl: 500, carbNeedG: 0, absorbCapG: 0 },
        { fromKm: 25, toKm: 50, hours: 1, fluidNeedMl: 500, carbNeedG: 0, absorbCapG: 0 },
      ],
      shortfall: null,
    };

    expect(() => assignWater(badSkeleton, state, [])).toThrow(/V1/);
  });
});
