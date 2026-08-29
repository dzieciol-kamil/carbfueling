import { describe, expect, test } from 'vitest';
import type { RouteInput, MixSettings, PlanState, Vessel } from '../types';
import { FLUID_FLOOR_FRACTION, legsForBoundaries } from './skeleton';
import { tidy } from './tidy';
import type { DraftFood, Service, Skeleton } from './types';

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

function water(vol: number, gid: string): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

function dualGel(vol: number, gid: string): Vessel {
  return { gid, name: 'Flask', vol, allowed: ['gel', 'water'], gelParts: 6 };
}

function gelOnly(vol: number, gid: string): Vessel {
  return { gid, name: 'Flask', vol, allowed: ['gel'], gelParts: 6 };
}

function makeState(route: RouteInput, gear: Vessel[]): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib: [], stops: [] };
}

function leg(fromKm: number, toKm: number, fluidNeedMl = 0) {
  return { fromKm, toKm, hours: 1, fluidNeedMl, carbNeedG: 0, absorbCapG: 0 };
}

// A short, steep ramp in the first ~13% of the route, flat afterward — real gradient, matching the
// fixture already used by deliveredShare.test.ts and assignWater.test.ts.
const HILLY_TRACK = { id: 1, ele: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000] };

describe('tidy — A: drop degenerate services', () => {
  test('a near-zero-span service is dropped; a real service on the same vessel and a stop it anchors survive', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 30, origin: 'planned' }],
      legs: [leg(0, 30), leg(30, 60)],
      shortfall: null,
    };
    const services: Service[] = [
      { vesselId: 'v1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      { vesselId: 'v1', fromKm: 30, toKm: 60, content: 'water', filledAtStop: 0 },
      // Degenerate: span far under the skeleton's own 1e-6 km node-dedupe precision.
      { vesselId: 'zero', fromKm: 10, toKm: 10 + 1e-9, content: 'water', filledAtStop: null },
    ];
    const gear = [water(500, 'v1'), water(500, 'zero')];
    const state = makeState(makeRoute({ distance: 60 }), gear);

    const result = tidy(skeleton, services, [], state);

    expect(result.services).toHaveLength(2);
    expect(result.services.some((s) => s.vesselId === 'zero')).toBe(false);
    expect(result.skeleton.stops).toHaveLength(1); // still anchored by v1's second service
  });
});

describe('tidy — B: S7, a spent one-shot gel vessel takes water at an existing stop', () => {
  test('dual (gel+water) vessel gets water from the first stop at/after the gel service ends, to D', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [leg(0, 40), leg(40, 100)],
      shortfall: null,
    };
    const gelService: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 35,
      content: 'gel',
      filledAtStop: null,
    };
    const gear = [dualGel(500, 'flask')];
    const state = makeState(makeRoute({ distance: 100 }), gear);

    const result = tidy(skeleton, [gelService], [], state);

    expect(result.services).toHaveLength(2);
    const water = result.services.find((s) => s.content === 'water')!;
    expect(water).toMatchObject({ vesselId: 'flask', fromKm: 40, toKm: 100, filledAtStop: 0 });
    expect(result.skeleton.stops).toHaveLength(1); // survives — the new service anchors it
  });

  test('gel-only vessel (allowed has no water) gets nothing — the allowed gate holds', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [leg(0, 40), leg(40, 100)],
      shortfall: null,
    };
    const gelService: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 35,
      content: 'gel',
      filledAtStop: null,
    };
    const gear = [gelOnly(500, 'flask')];
    const state = makeState(makeRoute({ distance: 100 }), gear);

    const result = tidy(skeleton, [gelService], [], state);

    expect(result.services).toHaveLength(1); // only the original gel service
    expect(result.services.every((s) => s.content === 'gel')).toBe(true);
    expect(result.skeleton.stops).toHaveLength(0); // unused by anything — dropped by D
  });

  test('no stop exists at or after the gel service ends: the vessel simply stays empty', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 10, origin: 'planned' }], // only stop is before the gel service even ends
      legs: [leg(0, 10), leg(10, 100)],
      shortfall: null,
    };
    const gelService: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 90,
      content: 'gel',
      filledAtStop: null,
    };
    const gear = [dualGel(500, 'flask')];
    const state = makeState(makeRoute({ distance: 100 }), gear);

    const result = tidy(skeleton, [gelService], [], state);

    expect(result.services).toHaveLength(1); // nothing added
    expect(result.skeleton.stops).toHaveLength(0); // km10 stop is unused — dropped
  });

  test("the new service stops at the vessel's next event, not at D, when one exists", () => {
    const skeleton: Skeleton = {
      stops: [
        { km: 40, origin: 'planned' },
        { km: 90, origin: 'planned' },
      ],
      legs: [leg(0, 40), leg(40, 90), leg(90, 120)],
      shortfall: null,
    };
    const gelService: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 35,
      content: 'gel',
      filledAtStop: null,
    };
    // A pre-existing (already V1-valid) later use of the same vessel, anchored to the km90 stop.
    const laterService: Service = {
      vesselId: 'flask',
      fromKm: 90,
      toKm: 120,
      content: 'water',
      filledAtStop: 1,
    };
    const gear = [dualGel(500, 'flask')];
    const state = makeState(makeRoute({ distance: 120 }), gear);

    const result = tidy(skeleton, [gelService, laterService], [], state);

    const added = result.services.find((s) => s.fromKm === 40);
    expect(added).toMatchObject({ vesselId: 'flask', fromKm: 40, toKm: 90, filledAtStop: 0 });
    expect(result.services).toHaveLength(3);
  });
});

describe('tidy — C: F6, a free top-up at an existing stop when the leg after it dips (useGpx: true, hilly)', () => {
  test('opens idle water vessels to clear the F1 floor on a real gradient leg; never touches the leg before the first stop', () => {
    const route = makeRoute({
      distance: 150,
      useGpx: true,
      gpxTrack: HILLY_TRACK,
      intensity: 'mid',
      temp: 20,
      weight: 75,
    });
    const stopKm = 20;
    // Real, gradient-derived legs from the already-verified pure helper — not hand-picked numbers.
    const legs = legsForBoundaries(route, MIX, [0, stopKm, 150]);
    const skeleton: Skeleton = {
      stops: [{ km: stopKm, origin: 'planned' }],
      legs,
      shortfall: null,
    };

    // Sized off the real computed floor (not a round number): each vessel alone is short, together
    // they clear it by a small margin — forcing the loop to open both.
    const floor = FLUID_FLOOR_FRACTION * legs[1].fluidNeedMl;
    const gear = [water(Math.ceil(floor / 2) + 50, 'a'), water(Math.ceil(floor / 2) + 50, 'b')];
    const state = makeState(route, gear);

    const result = tidy(skeleton, [], [], state);

    const leg1Services = result.services.filter(
      (s) => s.fromKm === legs[1].fromKm && s.toKm === legs[1].toKm,
    );
    expect(leg1Services.length).toBeGreaterThan(0);
    const delivered = leg1Services.reduce(
      (sum, s) => sum + (gear.find((v) => v.gid === s.vesselId)?.vol ?? 0),
      0,
    );
    expect(delivered).toBeGreaterThanOrEqual(floor);
    for (const s of leg1Services) {
      expect(s.content).toBe('water');
      expect(s.filledAtStop).toBe(0);
    }

    // leg0 has no preceding stop — F6 never applies there, even though it is equally short.
    expect(
      result.services.some((s) => s.fromKm === legs[0].fromKm && s.toKm === legs[0].toKm),
    ).toBe(false);
  });

  test('a leg already at/above the floor is left untouched — no gratuitous top-up', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [leg(0, 40, 500), leg(40, 80, 1000)],
      shortfall: null,
    };
    const existing: Service = {
      vesselId: 'a',
      fromKm: 40,
      toKm: 80,
      content: 'water',
      filledAtStop: 0,
    };
    const gear = [water(1000, 'a')]; // exactly covers floor = 0.85*1000 = 850
    const state = makeState(makeRoute({ distance: 80 }), gear);

    const result = tidy(skeleton, [existing], [], state);

    expect(result.services).toHaveLength(1);
    expect(result.services[0]).toEqual(existing);
  });
});

describe('tidy — D: drop stops nothing uses, remap filledAtStop, rebuild legs', () => {
  test('a stop with no anchored service and no food is dropped; indices remap; legs rebuild and conserve total need', () => {
    const route = makeRoute({ distance: 120, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const oldBoundaries = [0, 30, 60, 90, 120];
    const oldLegs = legsForBoundaries(route, MIX, oldBoundaries);
    const skeleton: Skeleton = {
      stops: [
        { km: 30, origin: 'planned' },
        { km: 60, origin: 'planned' }, // nothing anchors this one — droppable
        { km: 90, origin: 'planned' },
      ],
      legs: oldLegs,
      shortfall: null,
    };
    const services: Service[] = [
      { vesselId: 'v1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      // One continuous service spans both the 30-60 and 60-90 legs — no refill needed at km60,
      // which is exactly why that stop ends up with nothing anchored to it.
      { vesselId: 'v1', fromKm: 30, toKm: 90, content: 'water', filledAtStop: 0 },
      { vesselId: 'v2', fromKm: 90, toKm: 120, content: 'water', filledAtStop: 2 },
    ];
    const gear = [water(2000, 'v1'), water(900, 'v2')];
    const state = makeState(route, gear);

    const result = tidy(skeleton, services, [], state);

    expect(result.skeleton.stops.map((s) => s.km)).toEqual([30, 90]);
    expect(result.skeleton.legs).toHaveLength(3); // stops.length + 1

    // filledAtStop remapped: old index 0 (km30) -> 0 (unchanged position); old index 2 (km90) -> 1.
    const v1Second = result.services.find((s) => s.vesselId === 'v1' && s.fromKm === 30)!;
    const v2Only = result.services.find((s) => s.vesselId === 'v2')!;
    expect(v1Second.filledAtStop).toBe(0);
    expect(v2Only.filledAtStop).toBe(1);
    expect(result.skeleton.stops[v2Only.filledAtStop!].km).toBe(90);

    // Rebuilt legs match legsForBoundaries independently called on the surviving boundaries.
    const expectedLegs = legsForBoundaries(route, MIX, [0, 30, 90, 120]);
    expect(result.skeleton.legs).toEqual(expectedLegs);

    // Same route span, so total fluid need is conserved across the re-partition.
    const oldTotal = oldLegs.reduce((a, l) => a + l.fluidNeedMl, 0);
    const newTotal = result.skeleton.legs.reduce((a, l) => a + l.fluidNeedMl, 0);
    expect(newTotal).toBeCloseTo(oldTotal, 6);
  });
});

describe('tidy — E: assertions actually fire on malformed input', () => {
  test('throws /V1/ when a service is reused without a stop anchor', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 30, origin: 'planned' }],
      legs: [leg(0, 30), leg(30, 60)],
      shortfall: null,
    };
    const services: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 30, content: 'water', filledAtStop: null },
      { vesselId: 'g1', fromKm: 30, toKm: 60, content: 'water', filledAtStop: null }, // bug: should be 0
    ];
    const gear = [water(500, 'g1')];
    const state = makeState(makeRoute({ distance: 60 }), gear);

    expect(() => tidy(skeleton, services, [], state)).toThrow(/V1/);
  });

  test('throws /S1/ when two used (surviving) stops sit closer than minStopX(D)', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 });
    const skeleton: Skeleton = {
      stops: [
        { km: 50, origin: 'planned' },
        { km: 55, origin: 'planned' }, // 5km apart — under minStopX(200) = 10
      ],
      legs: [leg(0, 50), leg(50, 55), leg(55, 200)],
      shortfall: null,
    };
    const services: Service[] = [
      { vesselId: 'v1', fromKm: 0, toKm: 50, content: 'water', filledAtStop: null },
      { vesselId: 'v1', fromKm: 50, toKm: 55, content: 'water', filledAtStop: 0 }, // anchors stop 0
      { vesselId: 'v2', fromKm: 55, toKm: 200, content: 'water', filledAtStop: 1 }, // anchors stop 1
    ];
    const gear = [water(500, 'v1'), water(500, 'v2')];
    const state = makeState(route, gear);

    expect(() => tidy(skeleton, services, [], state)).toThrow(/S1/);
  });
});

describe('tidy — no-op: a plan with nothing to tidy comes back structurally identical', () => {
  test('no degenerate services, no spent gel, no dip, no unused stop — deep-equal, not merely equivalent', () => {
    const skeleton: Skeleton = {
      stops: [{ km: 40, origin: 'planned' }],
      legs: [leg(0, 40), leg(40, 80)], // fluidNeedMl 0 everywhere: F6's floor is trivially met
      shortfall: null,
    };
    const services: Service[] = [
      { vesselId: 'g1', fromKm: 0, toKm: 40, content: 'water', filledAtStop: null },
      { vesselId: 'g1', fromKm: 40, toKm: 80, content: 'water', filledAtStop: 0 },
    ];
    const foods: DraftFood[] = [{ key: 'gel', carbs: 25, cont: false, from: 20, to: 20 }];
    const gear = [water(500, 'g1')];
    const state = makeState(makeRoute({ distance: 80 }), gear);

    const result = tidy(skeleton, services, foods, state);

    expect(result.skeleton).toEqual(skeleton);
    expect(result.services).toEqual(services);
    expect(result.foods).toEqual(foods);
  });
});
