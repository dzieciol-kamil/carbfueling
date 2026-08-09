import { describe, expect, test } from 'vitest';
import {
  assignWaterLegs,
  autoplan,
  bucketVessels,
  findClimbStarts,
  fluidCapacityStopX,
  planIzoRefills,
  placeItemsEvenly,
  selectItemsForAmount,
  sequentialFills,
  shortRideFills,
} from './autoplan';
import type { FoodSelectionEntry } from './autoplan';
import type {
  FoodLibEntry,
  GpxTrack,
  MixSettings,
  PlanState,
  RouteInput,
  ShopStop,
  Vessel,
} from './types';

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

describe('findClimbStarts', () => {
  test('no GPX track configured on the route: caller is responsible for not calling this — with a flat synthetic-mode elevation profile passed as a real track, a genuine flat track finds nothing', () => {
    const flatTrack: GpxTrack = { id: 1, ele: new Array(11).fill(100) };
    const route = makeRoute({ distance: 100, speed: 25, useGpx: true, gpxTrack: flatTrack });
    expect(findClimbStarts(route, 0, 100)).toEqual([]);
  });

  test('detects a single sustained climb and reports its start x', () => {
    const ele = [100, 100, 100, 100, 100, 100, 700, 700, 700, 700, 700]; // climb between km 50 and 60
    const track: GpxTrack = { id: 1, ele };
    const route = makeRoute({ distance: 100, speed: 25, useGpx: true, gpxTrack: track });
    const starts = findClimbStarts(route, 0, 100);
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBeGreaterThan(48);
    expect(starts[0]).toBeLessThan(56);
  });

  test('restricts detection to the given [fromX, toX] window', () => {
    const ele = [100, 100, 100, 100, 100, 100, 700, 700, 700, 700, 700];
    const track: GpxTrack = { id: 1, ele };
    const route = makeRoute({ distance: 100, speed: 25, useGpx: true, gpxTrack: track });
    expect(findClimbStarts(route, 0, 45)).toEqual([]);
  });
});

const gelEntry: FoodLibEntry = { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 };
const bananaEntry: FoodLibEntry = { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 };

describe('selectItemsForAmount', () => {
  test('walks selection in order, respecting counts, stopping once the amount is reached', () => {
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 2 },
      { key: 'gel', count: 3 },
    ];
    const items = selectItemsForAmount(selection, [bananaEntry, gelEntry], 50);
    // 2 bananas = 46g (not enough), pulls in 1 gel = 68g total, stops
    expect(items.map((i) => i.key)).toEqual(['banana', 'banana', 'gel']);
  });

  test('returns fewer items than the full selection when the amount is small', () => {
    const selection: FoodSelectionEntry[] = [{ key: 'banana', count: 3 }];
    const items = selectItemsForAmount(selection, [bananaEntry], 20);
    expect(items).toHaveLength(1);
  });

  test('stops when selection is exhausted, even if amount is not fully reached', () => {
    const selection: FoodSelectionEntry[] = [{ key: 'banana', count: 1 }];
    const items = selectItemsForAmount(selection, [bananaEntry], 200);
    expect(items).toHaveLength(1);
  });
});

describe('placeItemsEvenly', () => {
  test('spaces items evenly across [startX, D] when no GPX track is present', () => {
    const route = makeRoute({ distance: 100, speed: 25, useGpx: false });
    const foods = placeItemsEvenly([bananaEntry, gelEntry], 40, 100, route);
    expect(foods).toHaveLength(2);
    expect(foods[0].from).toBeLessThan(foods[1].from);
    foods.forEach((f) => {
      expect(f.from).toBeGreaterThanOrEqual(40);
      expect(f.from).toBeLessThanOrEqual(100);
    });
  });

  test('biases a slot to a nearby climb start when a GPX track is present', () => {
    const ele = [100, 100, 100, 100, 100, 100, 700, 700, 700, 700, 700]; // climb ~50-60
    const track: GpxTrack = { id: 1, ele };
    const route = makeRoute({ distance: 100, speed: 25, useGpx: true, gpxTrack: track });
    const foods = placeItemsEvenly([bananaEntry], 0, 100, route); // single item, even slot center = 50
    expect(foods[0].from).toBeGreaterThan(48);
    expect(foods[0].from).toBeLessThan(60);
  });

  test('empty item list returns no foods', () => {
    const route = makeRoute();
    expect(placeItemsEvenly([], 0, 100, route)).toEqual([]);
  });
});

describe('fluidCapacityStopX', () => {
  test('returns null when carried water capacity already covers the leg to the first planned stop', () => {
    const route = makeRoute({ distance: 100, speed: 25, temp: 15, intensity: 'low', weight: 75 });
    // sweat() at temp<=15, low intensity, weight 75 -> base=380, iB=0 -> 380 ml/h
    // a 100km / 25kph = 4h ride: 40km leg = 1.6h -> ~608ml needed, one 750ml vessel covers it
    const result = fluidCapacityStopX(route, [waterBottle], 40);
    expect(result).toBeNull();
  });

  test('returns an earlier stop x when carried water capacity runs out before the first planned stop', () => {
    const route = makeRoute({ distance: 100, speed: 25, temp: 35, intensity: 'high', weight: 90 });
    const smallBottle: Vessel = {
      gid: 'g9',
      name: 'Small',
      vol: 400,
      allowed: ['water'],
      gelParts: 1,
    };
    const result = fluidCapacityStopX(route, [smallBottle], 80);
    expect(result).not.toBeNull();
    expect(result as number).toBeLessThan(80);
  });

  test('no water-capable vessels at all returns null (nothing to size against)', () => {
    const route = makeRoute();
    expect(fluidCapacityStopX(route, [], 40)).toBeNull();
  });
});

describe('assignWaterLegs', () => {
  test('gives each water vessel one fill per leg between consecutive stop boundaries', () => {
    const fills = assignWaterLegs([waterBottle], [30, 70], 100);
    expect(fills).toEqual([
      { gid: 'g4', content: 'water', from: 0, to: 30 },
      { gid: 'g4', content: 'water', from: 30, to: 70 },
      { gid: 'g4', content: 'water', from: 70, to: 100 },
    ]);
  });

  test('no stops at all: one fill spanning the whole route per water vessel', () => {
    const fills = assignWaterLegs([waterBottle], [], 100);
    expect(fills).toEqual([{ gid: 'g4', content: 'water', from: 0, to: 100 }]);
  });

  test('no water vessels: no fills', () => {
    expect(assignWaterLegs([], [30], 100)).toEqual([]);
  });
});

describe('autoplan (integration)', () => {
  test('short ride (<1h): water-only fills, no food, no shops, selection ignored', () => {
    const route = makeRoute({ mode: 'time', hours: 0, minutes: 40 });
    const state = makePlan({ route, gear: [bidon], foodLib: [bananaEntry] });
    const result = autoplan(state, [{ key: 'banana', count: 5 }]);
    expect(result.fills.every((f) => f.content === 'water')).toBe(true);
    expect(result.foods).toEqual([]);
    expect(result.newShops).toEqual([]);
  });

  test('start izo + full selection already covers target: refill legs get water, fewer items placed than selected', () => {
    const route = makeRoute({ distance: 40, speed: 25 }); // 1.6h ride, small target
    const mix = makeMix({ conc: 8.4 });
    const state = makePlan({
      route,
      mix,
      gear: [bidon],
      foodLib: [bananaEntry],
    });
    const result = autoplan(state, [{ key: 'banana', count: 5 }]);
    expect(result.fills.some((f) => f.content === 'izo')).toBe(true);
    // no izo refill fill should exist beyond the single start fill, since balance <= 0
    expect(result.fills.filter((f) => f.content === 'izo')).toHaveLength(1);
    expect(result.foods.length).toBeLessThan(5);
  });

  test('long route with limited gear/food: izo refill inserted, remaining shortfall left visible (not fabricated)', () => {
    const route = makeRoute({ distance: 300, speed: 25 }); // 12h ride, large target
    const mix = makeMix({ conc: 8.4 });
    const state = makePlan({
      route,
      mix,
      gear: [bidon],
      foodLib: [bananaEntry],
    });
    const result = autoplan(state, [{ key: 'banana', count: 1 }]);
    const izoFills = result.fills.filter((f) => f.content === 'izo');
    expect(izoFills.length).toBeGreaterThan(1); // start fill + at least one refill
    expect(result.newShops.length).toBeGreaterThan(0);
  });

  test('gear with a gel-capable vessel: gel fill is one-shot, never appears more than once for that vessel', () => {
    const route = makeRoute({ distance: 200, speed: 25 });
    const mix = makeMix({ conc: 8.4 });
    const state = makePlan({
      route,
      mix,
      gear: [bidon, flask],
      foodLib: [bananaEntry],
    });
    const result = autoplan(state, [{ key: 'banana', count: 2 }]);
    const gelFillsForFlask = result.fills.filter((f) => f.gid === 'g3' && f.content === 'gel');
    expect(gelFillsForFlask).toHaveLength(1);
    // flask never gets an izo refill continuation either
    expect(result.fills.filter((f) => f.gid === 'g3' && f.content === 'izo')).toHaveLength(0);
  });
});
