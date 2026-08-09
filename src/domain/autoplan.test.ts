import { describe, expect, test } from 'vitest';
import { bucketVessels, planIzoRefills, sequentialFills, shortRideFills } from './autoplan';
import type { MixSettings, PlanState, RouteInput, ShopStop, Vessel } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
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

function makeMix(overrides: Partial<MixSettings> = {}): MixSettings {
  return {
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
    ...overrides,
  };
}

function makePlan(overrides: Partial<PlanState> = {}): PlanState {
  return {
    route: makeRoute(),
    mix: makeMix(),
    gear: [],
    fills: [],
    foods: [],
    foodLib: [],
    ...overrides,
  };
}

const bidon: Vessel = {
  gid: 'g1',
  name: 'Bidon',
  vol: 650,
  allowed: ['water', 'izo'],
  gelParts: 4,
};
const bidon2: Vessel = {
  gid: 'g2',
  name: 'Bidon 2',
  vol: 500,
  allowed: ['water', 'izo'],
  gelParts: 4,
};
const flask: Vessel = {
  gid: 'g3',
  name: 'Flask',
  vol: 250,
  allowed: ['izo', 'water', 'gel'],
  gelParts: 4,
};
const waterBottle: Vessel = { gid: 'g4', name: 'Water', vol: 750, allowed: ['water'], gelParts: 1 };

describe('shortRideFills', () => {
  test('under 1h: every water-capable vessel gets one water fill spanning the whole route, no izo/gel', () => {
    const route = makeRoute({ mode: 'time', hours: 0, minutes: 45 });
    const state = makePlan({ route, gear: [bidon, flask] });
    const fills = shortRideFills(state);
    expect(fills).toEqual([
      { gid: 'g1', content: 'water', from: 0, to: expect.any(Number) },
      { gid: 'g3', content: 'water', from: 0, to: expect.any(Number) },
    ]);
    fills.forEach((f) => expect(f.to).toBeCloseTo(8, 0)); // dist() for 45min time-mode = round(0.75*10) = 8
  });
});

describe('bucketVessels', () => {
  test('gel-capable vessel is pulled out of the izo pool even if it also allows izo', () => {
    const { gelVessels, izoVessels, waterOnly, reservedWaterVessel } = bucketVessels(
      [bidon, flask, waterBottle],
      makeMix({ conc: 8.4 }),
    );
    expect(gelVessels.map((v) => v.gid)).toEqual(['g3']);
    expect(izoVessels.map((v) => v.gid)).toEqual(['g1']);
    expect(waterOnly.map((v) => v.gid)).toEqual(['g4']);
    expect(reservedWaterVessel).toBeNull();
  });

  test('concentrated mix reserves the largest izo-capable vessel as parallel water', () => {
    const { izoVessels, reservedWaterVessel } = bucketVessels(
      [bidon, bidon2],
      makeMix({ conc: 20 }),
    );
    expect(reservedWaterVessel?.gid).toBe('g1'); // 650ml > 500ml
    expect(izoVessels.map((v) => v.gid)).toEqual(['g2']);
  });

  test('standard-strength mix keeps every izo-capable vessel as izo', () => {
    const { izoVessels, reservedWaterVessel } = bucketVessels(
      [bidon, bidon2],
      makeMix({ conc: 8.4 }),
    );
    expect(reservedWaterVessel).toBeNull();
    expect(izoVessels.map((v) => v.gid)).toEqual(['g1', 'g2']);
  });
});

describe('sequentialFills', () => {
  test('multiple izo vessels get sequential, non-overlapping ranges (not parallel)', () => {
    const route = makeRoute({ distance: 100, speed: 25 }); // 4h ride
    const mix = makeMix({ conc: 8.4 }); // carbsFill(650ml) = 54.6g, carbsFill(500ml)=42g
    const { fills, totalCarbs, endX } = sequentialFills(
      [bidon, bidon2],
      'izo',
      route,
      [bidon, bidon2],
      mix,
    );
    expect(fills).toHaveLength(2);
    expect(fills[0].from).toBe(0);
    expect(fills[0].to).toBeGreaterThan(0);
    expect(fills[1].from).toBe(fills[0].to); // sequential: vessel 2 starts where vessel 1 ends
    expect(fills[1].to).toBeGreaterThan(fills[1].from);
    expect(totalCarbs).toBeCloseTo(54.6 + 42, 1);
    expect(endX).toBe(fills[1].to);
  });

  test('empty vessel list returns no fills and zero carbs', () => {
    const route = makeRoute();
    const mix = makeMix();
    const { fills, totalCarbs, endX } = sequentialFills([], 'izo', route, [], mix);
    expect(fills).toEqual([]);
    expect(totalCarbs).toBe(0);
    expect(endX).toBe(0);
  });
});

describe('planIzoRefills', () => {
  test("balance already <= 0 is the caller's job to avoid calling this — with balance 0, does nothing", () => {
    const route = makeRoute();
    const mix = makeMix();
    const result = planIzoRefills(route, [bidon], mix, [bidon], 40, 0, []);
    expect(result.fills).toEqual([]);
    expect(result.newShops).toEqual([]);
    expect(result.finalBalance).toBe(0);
    expect(result.stopXs).toEqual([]);
  });

  test('positive balance with no existing shop creates one and refills izo, no special naming', () => {
    const route = makeRoute({ distance: 100, speed: 25 });
    const mix = makeMix({ conc: 8.4 }); // 650ml bidon = 54.6g per fill
    const result = planIzoRefills(route, [bidon], mix, [bidon], 40, 30, []);
    expect(result.newShops).toHaveLength(1);
    expect(result.newShops[0].at).toBe(40);
    expect(result.fills).toHaveLength(1);
    expect(result.fills[0]).toMatchObject({ gid: 'g1', content: 'izo' });
    expect(result.fills[0].from).toBeCloseTo(40, 0);
    expect(result.finalBalance).toBe(0); // 54.6g of capacity easily covers a 30g gap
  });

  test('snaps to an existing shop stop at/after the izo-end point instead of creating a new one', () => {
    const route = makeRoute({ distance: 100, speed: 25 });
    const mix = makeMix({ conc: 8.4 });
    const existingShops: ShopStop[] = [{ id: 1, at: 55, name: 'Sklep' }];
    const result = planIzoRefills(route, [bidon], mix, [bidon], 40, 30, existingShops);
    expect(result.newShops).toEqual([]);
    expect(result.stopXs).toEqual([55]);
    expect(result.fills[0].from).toBeCloseTo(55, 0);
  });

  test('no izo capacity left (empty vessel list) leaves the gap uncovered rather than looping forever', () => {
    const route = makeRoute({ distance: 100, speed: 25 });
    const mix = makeMix();
    const result = planIzoRefills(route, [], mix, [], 40, 30, []);
    expect(result.fills).toEqual([]);
    expect(result.finalBalance).toBe(30);
  });
});
