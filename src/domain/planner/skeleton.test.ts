import { describe, expect, test } from 'vitest';
import { dist } from '../fuel';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { buildSkeleton, minStopX } from './skeleton';
import type { CostWeights } from './skeleton';

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

const FOOD_LIB: FoodLibEntry[] = [];

function water(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

function makeState(route: RouteInput, gear: Vessel[]): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib: FOOD_LIB, stops: [] };
}

const BALANCED: CostWeights = { wStop: 1.0, wLoad: 1.0, wShort: 1000 };
const FEWER_STOPS: CostWeights = { wStop: 2.0, wLoad: 0.3, wShort: 1000 };
const LIGHTER_BIKE: CostWeights = { wStop: 0.5, wLoad: 2.0, wShort: 1000 };

describe('buildSkeleton', () => {
  test('1. flat 75km route, 700ml bottle — hand-computable optimum is 2 stops', () => {
    // route.useGpx = false ⇒ effort is flat (buildProf sets pts[i].effort = 1 unconditionally),
    // so fluid need accumulates exactly linearly in km: fluidNeed(x) = totalFluidNeed * x/D.
    //
    // sweat(route) with weight=75, temp=20, intensity='mid':
    //   base = 380 + max(0,20-15)*42 = 590; iB(mid) = 110
    //   rate = round(((590+110) * (75/75))/10)*10 = 700 ml/h
    // totalHours = 75/25 = 3h  ⇒  totalFluidNeed = 700*3 = 2100 ml (>= 75*15=1125 buffer, so ungated)
    // carryable = 700 ml (one bottle)
    //
    // For n equal legs, cost(n) = wStop*(n-1) + wLoad*(need/n / carryable)^2 * n
    //                           = (n-1) + (2100/700)^2 / n = (n-1) + 9/n   [wStop=wLoad=1]
    // Capacity legality (F1 floor, 0.85): carryable >= 0.85*(2100/n)
    //   n=2: 700 >= 0.85*1050=892.5  → false, illegal
    //   n=3: 700 >= 0.85*700=595     → true, legal (minimum feasible n)
    // cost(3) = 2 + 3    = 5
    // cost(4) = 3 + 2.25 = 5.25
    // cost(5) = 4 + 1.8  = 5.8
    // n=3 (2 stops) strictly minimizes cost among legal n, and — since sum-of-squares over a fixed
    // total is minimized by an equal split — the two stops land exactly on the equal-thirds points.
    const route = makeRoute({ distance: 75, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(700)]);

    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });

    expect(skeleton.shortfall).toBeNull();
    expect(skeleton.stops).toHaveLength(2);
    expect(skeleton.stops.map((s) => s.km)).toEqual([25, 50]);
    expect(skeleton.stops.every((s) => s.origin === 'planned')).toBe(true);
    expect(skeleton.legs).toHaveLength(3);
    expect(skeleton.legs.reduce((a, l) => a + l.fluidNeedMl, 0)).toBeCloseTo(2100, 6);
  });

  test('2. 200km / one 1000ml bidon / water only — F3 real-world reference is 4 stops', () => {
    // Same route as the rider's real hand-built plan (autoplanScenarios.test.ts #2): distance=200,
    // speed=25, intensity='mid', temp=20, weight=75.
    // sweat = 700 ml/h (same calc as test 1), totalHours = 8h ⇒ totalFluidNeed = 5600 ml.
    // F3's closed form: stops = ceil(0.85*need/capacity) - 1 = ceil(0.85*5600/1000) - 1
    //                        = ceil(4.76) - 1 = 5 - 1 = 4.
    //
    // Under the DP's cost function with the spec's *default* weights (wStop=wLoad=1), the true
    // per-n cost is (n-1) + (5600/1000)^2/n = (n-1) + 31.36/n, whose continuous minimum sits at
    // n=sqrt(31.36)=5.6 — almost exactly between the n=5 (4 stops, cost 10.272) and n=6 (5 stops,
    // cost 10.227) integers, with n=6 very slightly cheaper. So the skeleton may legitimately land
    // on 5 stops here, not 4: this is precisely the "starting points, not settled values" gap the
    // spec calls out for the default weights (§3.3) and defers to L3's calibration (§5), not a bug
    // in the search. See the report for the numbers.
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(1000)]);

    const skeleton = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });

    expect(skeleton.shortfall).toBeNull();
    // Not asserted at the exact F3 figure of 4 — see the comment above.
    expect(skeleton.stops.length).toBeGreaterThanOrEqual(4);
    expect(skeleton.stops.length).toBeLessThanOrEqual(5);
  });

  test('3. allowNewStops=false, one rider stop too sparse for a 200km/300ml ride → Shortfall', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(300)]);

    const skeleton = buildSkeleton(state, {
      riderStops: [100],
      allowNewStops: false,
      weights: BALANCED,
    });

    expect(skeleton.shortfall).not.toBeNull();
    expect(skeleton.shortfall?.fluidMl).toBeGreaterThan(0);
    // No exception, and no invented stop: only the rider's own stop is ever a candidate when
    // allowNewStops is false, so nothing with origin 'planned' can appear.
    expect(skeleton.stops.every((s) => s.origin === 'rider')).toBe(true);
    expect(skeleton.stops.map((s) => s.km)).toEqual([100]);
  });

  test('4. the knob: wStop-heavy weights never produce more stops than wLoad-heavy weights', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const state = makeState(route, [water(1000)]);

    const fewerStops = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: FEWER_STOPS,
    });
    const lighterBike = buildSkeleton(state, {
      riderStops: [],
      allowNewStops: true,
      weights: LIGHTER_BIKE,
    });

    expect(fewerStops.shortfall).toBeNull();
    expect(lighterBike.shortfall).toBeNull();
    expect(fewerStops.stops.length).toBeLessThanOrEqual(lighterBike.stops.length);
  });

  test('5. no stop ever lands within minStopX(D) of the start', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const D = dist(route);
    const floor = minStopX(D);

    // A demanding ride (small bottle) that wants several stops, so the invariant is non-trivial.
    const demanding = buildSkeleton(makeState(route, [water(500)]), {
      riderStops: [],
      allowNewStops: true,
      weights: BALANCED,
    });
    expect(demanding.stops.length).toBeGreaterThan(1);
    for (const s of demanding.stops) expect(s.km).toBeGreaterThanOrEqual(floor);

    // A rider stop placed inside the forbidden zone (km 2, well under floor=10) must never be used
    // — S5: "a stop at km 1 is a bug".
    const withEarlyRiderStop = buildSkeleton(makeState(route, [water(1000)]), {
      riderStops: [2],
      allowNewStops: true,
      weights: BALANCED,
    });
    expect(withEarlyRiderStop.stops.some((s) => s.km === 2)).toBe(false);
    for (const s of withEarlyRiderStop.stops) expect(s.km).toBeGreaterThanOrEqual(floor);
  });
});
