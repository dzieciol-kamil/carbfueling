import { describe, expect, test } from 'vitest';
import {
  STOP_SNAP_KM,
  autoplan,
  bucketVessels,
  findClimbStarts,
  gridXs,
  minStopX,
  pinStopItems,
  placeItemsEvenly,
  selectItemsForAmount,
} from './autoplan';
import type { FoodSelectionEntry } from './autoplan';
import { COVERAGE_TARGET_PCT, planSummary, rateStats, samples, sweat, totalHours } from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  GpxTrack,
  MixSettings,
  PlanState,
  RouteInput,
  Stop,
  Vessel,
} from './types';

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
    stops: [],
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

  /**
   * The reservation exists to put plain water alongside a syrupy mix, so it can only fall on a
   * bottle that may hold water. Reserving one that may not takes it out of the izo pool without
   * putting it anywhere else — the biggest bottle on the bike then rides the whole day empty.
   */
  test('a bottle that cannot hold water is never the one reserved for water', () => {
    const izoOnly: Vessel = {
      gid: 'g5',
      name: 'Izo only',
      vol: 750,
      allowed: ['izo'],
      gelParts: 1,
    };
    const { izoVessels, reservedWaterVessel } = bucketVessels(
      [izoOnly, bidon2],
      makeMix({ conc: 20 }),
    );
    expect(reservedWaterVessel?.gid).toBe('g2');
    expect(izoVessels.map((v) => v.gid)).toEqual(['g5']);
  });

  test('nothing is reserved when no izo-capable vessel may hold water', () => {
    const izoOnly: Vessel = {
      gid: 'g5',
      name: 'Izo only',
      vol: 750,
      allowed: ['izo'],
      gelParts: 1,
    };
    const izoOnly2: Vessel = {
      gid: 'g6',
      name: 'Izo only 2',
      vol: 500,
      allowed: ['izo'],
      gelParts: 1,
    };
    const { izoVessels, reservedWaterVessel } = bucketVessels(
      [izoOnly, izoOnly2],
      makeMix({ conc: 20 }),
    );
    expect(reservedWaterVessel).toBeNull();
    expect(izoVessels.map((v) => v.gid)).toEqual(['g5', 'g6']);
  });
});

/**
 * Every bottle the rider straps on has to carry something.
 *
 * A concentrated mix wants a plain-water bottle next to it, but the bottle picked for that job has
 * to be one that may actually hold water. Picked wrongly, the vessel falls out of the izo pool and
 * is refused by the water side too, and the plan quietly rides a full-size bottle around empty
 * while paying for extra refills of the small one it did use.
 */
describe('autoplan (a concentrated mix with an izo-only bottle)', () => {
  const izoOnly: Vessel = { gid: 'g5', name: 'Izo only', vol: 750, allowed: ['izo'], gelParts: 1 };
  const both: Vessel = {
    gid: 'g6',
    name: 'Bidon',
    vol: 500,
    allowed: ['water', 'izo'],
    gelParts: 1,
  };
  const result = autoplan(
    makePlan({
      route: makeRoute({ distance: 120, speed: 25 }),
      mix: makeMix({ conc: 20 }),
      gear: [izoOnly, both],
    }),
    [],
  );

  test('the big izo-only bottle carries something', () => {
    expect(result.fills.some((f) => f.gid === 'g5')).toBe(true);
  });

  test('what it carries is izo, since that is all it may hold', () => {
    expect(result.fills.filter((f) => f.gid === 'g5').every((f) => f.content === 'izo')).toBe(true);
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

describe('pinStopItems', () => {
  const cola: FoodLibEntry = {
    key: 'cola',
    pl: 'Cola',
    en: 'Cola',
    carbs: 35,
    ml: 330,
    needsStop: true,
  };

  test('several products bought at one stop are laid out one after another', () => {
    const pinned = pinStopItems([cola, cola, cola, cola], [30], 100);
    expect(pinned).toHaveLength(4);
    expect(new Set(pinned.map((p) => p.from)).size).toBe(4);
  });

  test('a product goes to each stop when there are stops to go round', () => {
    const pinned = pinStopItems([cola, cola, cola], [20, 45, 70], 100);
    expect(pinned.map((p) => p.from)).toEqual([20, 45, 70]);
  });
});

/**
 * A `needsStop` product is one nobody carries — a cola, an ice cream. The rider picked it, so it has
 * to end up in the plan, and the only place it can be eaten is a stop. On a ride whose bottles never
 * run dry there is no refill to hang it on, which used to make it vanish silently: its carbs and its
 * fluid were already spent from the budget, and then the plan came back with no food in it at all.
 */
describe('autoplan (products that have to be bought)', () => {
  const cola: FoodLibEntry = {
    key: 'cola',
    pl: 'Cola',
    en: 'Cola',
    carbs: 35,
    ml: 330,
    needsStop: true,
  };
  const bigBottle: Vessel = { gid: 'g9', name: 'Big', vol: 1000, allowed: ['water'], gelParts: 1 };
  // 60km at 25kph on a mild day: one litre covers the whole ride, so nothing else asks for a stop.
  const state = makePlan({
    route: makeRoute({ distance: 60 }),
    gear: [bigBottle],
    foodLib: [cola],
  });
  const result = autoplan(state, [{ key: 'cola', count: 3 }]);

  test('the colas the rider picked are in the plan', () => {
    expect(result.foods.map((f) => f.key)).toEqual(['cola', 'cola', 'cola']);
  });

  test('each one is eaten at a stop, which the plan creates for it', () => {
    expect(result.newStops.length).toBeGreaterThan(0);
    result.foods.forEach((f) => {
      const atStop = result.newStops.some((s) => Math.abs(s.at - f.from) <= STOP_SNAP_KM);
      expect(atStop, `${f.key} at ${f.from.toFixed(1)}km is not at a stop`).toBe(true);
    });
  });

  test('they are spread over three stops, not bought three at a time at one', () => {
    const stopFor = (x: number) =>
      result.newStops.findIndex((s) => Math.abs(s.at - x) <= STOP_SNAP_KM);
    const used = new Set(result.foods.map((f) => stopFor(f.from)));
    expect(used.size).toBe(3);
  });

  test('a stop it created is a real refill, not a bookmark', () => {
    const boundaries = result.fills.map((f) => f.from);
    result.newStops.forEach((s) => {
      const refills = boundaries.some((b) => Math.abs(b - s.at) <= STOP_SNAP_KM);
      expect(refills, `stop at ${s.at.toFixed(1)}km refills nothing`).toBe(true);
    });
  });
});

/**
 * The same product, on a ride the water side never plans for.
 *
 * Under the hydration buffer a rider starts with there is no water plan at all — no refill, and so
 * nothing for the stop-product loop to hang a stop on. The cola still costs its carbs against what
 * the bottles have to cover, so dropping it silently builds the izo side thinner to feed food that
 * was never placed. A stop is a marker on the route; the plan can afford to make one for a product
 * the rider explicitly picked, whether or not a bottle happens to need filling there.
 */
describe('autoplan (products that have to be bought, below the hydration gate)', () => {
  const cola: FoodLibEntry = {
    key: 'cola',
    pl: 'Cola',
    en: 'Cola',
    carbs: 35,
    ml: 330,
    needsStop: true,
  };
  // 37.5km at 25kph, 20°C, 75kg: 1.5h of sweat is 1050ml against the 1125ml buffer the rider starts
  // with, so the water side plans nothing at all. The bottle carries no carbs either, which leaves
  // the whole 57g target (85% of 67.5g) to the two colas.
  const waterOnlyBottle: Vessel = {
    gid: 'g1',
    name: 'Bidon',
    vol: 650,
    allowed: ['water'],
    gelParts: 1,
  };
  const state = makePlan({
    route: makeRoute({ distance: 37.5, speed: 25, temp: 20, weight: 75 }),
    gear: [waterOnlyBottle],
    foodLib: [cola],
  });
  const result = autoplan(state, [{ key: 'cola', count: 2 }]);

  test('the colas the rider picked are in the plan', () => {
    expect(result.foods.map((f) => f.key)).toEqual(['cola', 'cola']);
  });

  test('each one has a stop to be bought at', () => {
    expect(result.newStops.length).toBeGreaterThan(0);
    result.foods.forEach((f) => {
      const atStop = result.newStops.some((s) => Math.abs(s.at - f.from) <= STOP_SNAP_KM);
      expect(atStop, `${f.key} at ${f.from.toFixed(1)}km is not at a stop`).toBe(true);
    });
  });

  test('no stop lands on the start line or inside the finish', () => {
    result.newStops.forEach((s) => {
      expect(s.at).toBeGreaterThan(0);
      expect(s.at).toBeLessThan(37.5);
    });
  });
});

/**
 * How far short of the line a carb stream ends.
 *
 * The rider's own builds end it a little early — sugar swallowed in the last minutes is still in
 * the gut at the finish — but the gap he left was small next to the leg it came out of (5km off a
 * 33km leg on his 100km build). Measured as a share of the *route* instead, the same gap eats a
 * short leg alive: a small bottle on an ultra would have to pour its whole ration in a couple of
 * kilometres, which is exactly the unabsorbable dump the gap exists to avoid.
 */
describe('autoplan (the end of a carb stream)', () => {
  test('the finish gap cannot swallow the leg it is trimmed from', () => {
    const route = makeRoute({ distance: 400 });
    const flask: Vessel = { gid: 'g1', name: 'Bidon', vol: 250, allowed: ['izo'], gelParts: 1 };
    const izoFills = autoplan(makePlan({ route, gear: [flask] }), [])
      .fills.filter((f) => f.content === 'izo')
      .sort((a, b) => a.from - b.from);
    expect(izoFills.length).toBeGreaterThan(2);
    const lens = izoFills.map((f) => f.to - f.from);
    const last = lens[lens.length - 1];
    const median = [...lens].sort((a, b) => a - b)[Math.floor(lens.length / 2)];
    expect(
      last / median,
      `last load poured over ${last.toFixed(1)}km against ${median.toFixed(1)}km for the rest`,
    ).toBeGreaterThan(0.7);
  });

  test('a load the ride is short of still drinks all the way in', () => {
    // 63g across a 1.6h ride: 39g/h against the 45g/h it could absorb — every gram counts.
    const route = makeRoute({ distance: 40, speed: 25 });
    const bottle: Vessel = { gid: 'g1', name: 'Bidon', vol: 750, allowed: ['izo'], gelParts: 1 };
    const izoFills = autoplan(makePlan({ route, gear: [bottle] }), []).fills.filter(
      (f) => f.content === 'izo',
    );
    expect(izoFills).toHaveLength(1);
    expect(izoFills[0].to).toBe(40);
  });
});

/**
 * Snapping a grid point onto the rider's own stop must not turn the grid around.
 *
 * Legs are equal slices of time, so on a climb they are a kilometre long or less — shorter than the
 * 3km a stop may pull a boundary forward. Pull one boundary past the next and the "leg" between them
 * runs backwards: a fill that ends before it starts, and stops in the wrong order on the chart.
 */
describe('autoplan (grid vs. the rider’s stops)', () => {
  // A wall at km20: 500m of ascent per kilometre, so three grid legs fit inside three kilometres.
  const wall: number[] = [];
  for (let i = 0; i <= 60; i++) {
    if (i < 20) wall.push(100);
    else if (i < 23) wall.push(100 + (i - 20) * 500);
    else wall.push(1600 - (i - 23) * 20);
  }
  const steep = makeRoute({
    distance: 60,
    speed: 22,
    temp: 30,
    useGpx: true,
    gpxTrack: { id: 3, ele: wall },
  });

  test('a stop past the next boundary is not snapped to', () => {
    // Natural grid: 0, 11.63, 20.54, 22.48, 32.95, 46.47, 60 — the stop sits beyond the 22.48 leg.
    const xs = gridXs(steep, 6, [{ id: 1, at: 23.4, name: 'Sklep' }]);
    xs.forEach((x, i) => {
      if (i > 0)
        expect(x, `grid runs backwards: ${xs.map((v) => v.toFixed(2)).join(' ')}`).toBeGreaterThan(
          xs[i - 1],
        );
    });
  });

  test('a stop that fits between two boundaries still moves the stop onto it', () => {
    const xs = gridXs(steep, 6, [{ id: 1, at: 12.5, name: 'Sklep' }]);
    expect(xs).toContain(12.5);
  });

  /**
   * Keeping the stops from a previous run must not mean planning around a frozen list.
   *
   * A rider who keeps them expects the plan to *use* what is already on the route and to speak up
   * where it needs somewhere new — not to silently make do with too few refills, and not to line
   * up a second pull-over two kilometres past one he already has.
   */
  const long = makeRoute({ distance: 200, speed: 25, temp: 25 });
  const oneBottle: Vessel = { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water'], gelParts: 1 };

  test('stops already on the route are used instead of new ones beside them', () => {
    const fresh = autoplan(makePlan({ route: long, gear: [oneBottle] }), []);
    expect(fresh.newStops.length).toBeGreaterThan(1);
    const kept: Stop[] = fresh.newStops.map((s, i) => ({ id: i + 1, at: s.at, name: 'Postój' }));

    const again = autoplan(makePlan({ route: long, gear: [oneBottle], stops: kept }), []);
    expect(again.newStops).toEqual([]);
  });

  test('a new stop is added where the ride needs one and nothing is nearby', () => {
    // One stop kept from a shorter ride, then the route doubles: the rest still has to be planned.
    const kept: Stop[] = [{ id: 1, at: 40, name: 'Żabka' }];
    const result = autoplan(makePlan({ route: long, gear: [oneBottle], stops: kept }), []);
    expect(result.newStops.length).toBeGreaterThan(0);
    for (const s of result.newStops) {
      expect(
        Math.abs(s.at - 40),
        'a new stop was planned right next to the kept one',
      ).toBeGreaterThan(STOP_SNAP_KM);
    }
  });
});

/**
 * The fluid floor has to be measured the way the chart draws it.
 *
 * `fuel.ts` spreads both what a bottle delivers and what the rider loses by **effort**, not by the
 * clock: an hour of climbing costs more sweat than an hour of descending, and a bottle drunk across
 * it empties faster too. A planner that lays its legs out by time and then checks them against a
 * flat sweat rate is measuring in the wrong units, and the error lands exactly where it hurts — the
 * climb, where the ratio is worst and the rider is thirstiest.
 */
describe('autoplan (hilly routes)', () => {
  /** The lowest point of the delivery line as a share of the target, straight off `samples()`. */
  function worstFluidPct(state: PlanState): { pct: number; at: number } {
    const S = samples(state);
    const D = state.route.distance;
    const dt = totalHours(state.route) / (S.length - 1);
    let worst = { pct: Infinity, at: 0 };
    for (let i = 1; i < S.length; i++) {
      if (S[i].x > D * 0.98) break;
      const need = (S[i].fluidNeed - S[i - 1].fluidNeed) / dt;
      if (need < 1) continue;
      const pct = ((S[i].ml - S[i - 1].ml) / dt / need) * 100;
      if (pct < worst.pct) worst = { pct, at: S[i].x };
    }
    return worst;
  }

  // A long climb in the first third, then down: 3.5km of ascent per sample step at the steepest.
  const ele: number[] = [];
  for (let i = 0; i <= 90; i++) ele.push(i < 30 ? 100 + i * 45 : 1450 - (i - 30) * 22);
  const track: GpxTrack = { id: 7, ele };
  const hilly = makeRoute({ distance: 90, speed: 25, temp: 30, useGpx: true, gpxTrack: track });
  const bottle: Vessel = { gid: 'g1', name: 'Bidon', vol: 750, allowed: ['water'], gelParts: 1 };

  test('the line holds its floor on the climb, not just on paper', () => {
    const state = makePlan({ route: hilly, gear: [bottle] });
    const result = autoplan(state, []);
    const applied: PlanState = {
      ...state,
      fills: result.fills.map((f, i) => ({ ...f, fid: i + 1 })),
      stops: result.newStops.map((s, i) => ({ ...s, id: i + 1, name: 'Sklep' })),
    };
    const { pct, at } = worstFluidPct(applied);
    expect(pct, `line drops to ${Math.round(pct)}% at km ${Math.round(at)}`).toBeGreaterThanOrEqual(
      85,
    );
  });
});

describe('autoplan (integration)', () => {
  test('short ride (<1h): water-only fills, no food, no stops, selection ignored', () => {
    const route = makeRoute({ mode: 'time', hours: 0, minutes: 40 });
    const state = makePlan({ route, gear: [bidon], foodLib: [bananaEntry] });
    const result = autoplan(state, [{ key: 'banana', count: 5 }]);
    expect(result.fills.every((f) => f.content === 'water')).toBe(true);
    expect(result.foods).toEqual([]);
    expect(result.newStops).toEqual([]);
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
    expect(result.newStops.length).toBeGreaterThan(0);
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

  test('water vessel capacity constraint creates stops for refilling', () => {
    // Hot, intense conditions with long distance and small water capacity
    // causes water to run out before route ends
    const route = makeRoute({ distance: 100, speed: 25, temp: 35, intensity: 'high', weight: 90 });
    const smallWater: Vessel = {
      gid: 'g5',
      name: 'Small Water',
      vol: 300,
      allowed: ['water'],
      gelParts: 1,
    };
    const mix = makeMix({ conc: 8.4 });
    const state = makePlan({
      route,
      mix,
      gear: [bidon, smallWater],
      foodLib: [bananaEntry],
    });
    // Minimal selection to avoid needing izo refills (which would also create stops)
    const result = autoplan(state, [{ key: 'banana', count: 1 }]);

    // Water vessel should have multiple fills, indicating a stop was created
    // due to water capacity constraint
    const waterFills = result.fills.filter((f) => f.content === 'water' && f.gid === 'g5');
    expect(waterFills.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Golden path: the gear the app actually ships with (`defaultGear` in `appStore.ts`) — one
 * izo-capable bidon and one gel-capable flask, and **no water-only vessel at all**.
 *
 * Every task-scoped test above uses synthetic gear with a dedicated water-only bottle, which is
 * why a whole class of bugs survived to the final review: with real gear the plan came out with
 * zero water fills (45-67% hydration), a dozen izo refill stops on a long ride, overlapping fills
 * on the same vessel, and every gram of carbs crammed into the first two hours.
 */
const realBidon: Vessel = {
  gid: 'g1',
  name: 'Bidon',
  vol: 650,
  allowed: ['water', 'izo'],
  gelParts: 4,
};
const realFlask: Vessel = {
  gid: 'g2',
  name: 'Flask',
  vol: 250,
  allowed: ['izo', 'water', 'gel'],
  gelParts: 4,
};
const defaultGear: Vessel[] = [realBidon, realFlask];

const realFoodLib: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

/** Applies an autoplan result the same way `applyAutoplan` in `appStore.ts` does. */
function applyResult(
  state: PlanState,
  result: ReturnType<typeof autoplan>,
): { state: PlanState; stopCount: number } {
  const fills: Fill[] = result.fills.map((f, i) => ({ ...f, fid: i + 1 }));
  const foods: FoodItem[] = result.foods.map((f, i) => ({ ...f, id: i + 1, name: f.key }));
  const stops: Stop[] = [
    ...state.stops,
    ...result.newStops.map((s, i) => ({ ...s, id: 1000 + i, name: 'Sklep' })),
  ];
  return { state: { ...state, fills, foods, stops }, stopCount: stops.length };
}

function overlappingPairs(fills: { gid: string; from: number; to: number }[]): string[] {
  const byGid = new Map<string, { from: number; to: number }[]>();
  fills.forEach((f) => {
    const list = byGid.get(f.gid) || [];
    list.push(f);
    byGid.set(f.gid, list);
  });
  const bad: string[] = [];
  byGid.forEach((list, gid) => {
    const sorted = list.slice().sort((a, b) => a.from - b.from);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].from < sorted[i - 1].to - 1e-9) {
        bad.push(
          `${gid}: ${sorted[i - 1].from.toFixed(1)}→${sorted[i - 1].to.toFixed(1)} overlaps ${sorted[i].from.toFixed(1)}→${sorted[i].to.toFixed(1)}`,
        );
      }
    }
  });
  return bad;
}

describe('autoplan (golden path, app default gear)', () => {
  const route = makeRoute({ distance: 100, speed: 25 }); // 4h, target 300g
  const state = makePlan({ route, mix: makeMix(), gear: defaultGear, foodLib: realFoodLib });
  const selection: FoodSelectionEntry[] = [{ key: 'banana', count: 2 }];
  const result = autoplan(state, selection);

  test('produces water fills — the izo-capable bidon carries water outside its izo stretches', () => {
    const water = result.fills.filter((f) => f.content === 'water');
    expect(water.length).toBeGreaterThan(0);
    expect(water.some((f) => f.gid === 'g1')).toBe(true);
  });

  test('the bidon water fills cover exactly what its izo fills do not', () => {
    const bidonFills = result.fills.filter((f) => f.gid === 'g1').sort((a, b) => a.from - b.from);
    expect(bidonFills[0].from).toBe(0);
    expect(bidonFills[bidonFills.length - 1].to).toBeCloseTo(100, 5);
    for (let i = 1; i < bidonFills.length; i++) {
      // contiguous or gapped, but never overlapping, and always progressing
      expect(bidonFills[i].from).toBeGreaterThanOrEqual(bidonFills[i - 1].to);
    }
  });

  test('the gel flask keeps its one-shot gel and is never given a second gel fill', () => {
    const flaskFills = result.fills.filter((f) => f.gid === 'g2');
    expect(flaskFills.filter((f) => f.content === 'gel')).toHaveLength(1);
    expect(flaskFills.filter((f) => f.content === 'izo')).toHaveLength(0);
    // any water it does get sits strictly after the gel is gone
    const gelFill = flaskFills.find((f) => f.content === 'gel')!;
    flaskFills
      .filter((f) => f.content === 'water')
      .forEach((f) => expect(f.from).toBeGreaterThanOrEqual(gelFill.to));
  });

  test('no two fills for the same vessel overlap', () => {
    expect(overlappingPairs(result.fills)).toEqual([]);
  });

  test('no stop lands at the start line', () => {
    result.newStops.forEach((s) => expect(s.at).toBeGreaterThanOrEqual(minStopX(100)));
  });

  test('hydration and carb coverage clear the rider-accepted floors', () => {
    const summary = planSummary(applyResult(state, result).state);
    // Floors, not targets. The carb floor tracks the app's own green threshold
    // (`COVERAGE_TARGET_PCT`); hydration stays at the older, weaker 80 on purpose — this is mixed
    // gear (one bottle shared between izo and water), which the siloed scenarios don't cover.
    expect(summary.hydrationPct).toBeGreaterThanOrEqual(80);
    expect(summary.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
  });

  test('carbs are spread across the route, not crammed into the first two hours', () => {
    const applied = applyResult(state, result).state;
    const { samples } = rateStats(applied);
    const total = samples[samples.length - 1].intake;
    const halfway = samples[Math.floor(samples.length / 2)].intake;
    // pre-fix this was ~282g of 305g (92%) delivered by the halfway point
    expect(halfway / total).toBeLessThan(0.7);
  });
});

describe('autoplan (long route, app default gear)', () => {
  // 194km of rolling terrain at 28kph — the shape of the real GPX ride the rider reported, where
  // the pre-fix algorithm produced ~6 stops, no water at all and 30% hydration.
  const ele: number[] = [];
  for (let i = 0; i <= 200; i++) ele.push(180 + Math.sin(i / 7) * 120 + Math.sin(i / 31) * 260);
  const track: GpxTrack = { id: 1, ele };
  const route = makeRoute({ distance: 194, speed: 28, useGpx: true, gpxTrack: track });
  const state = makePlan({ route, mix: makeMix(), gear: defaultGear, foodLib: realFoodLib });
  const result = autoplan(state, [
    { key: 'banana', count: 2 },
    { key: 'gel', count: 1 },
  ]);

  test('no stop lands essentially at departure', () => {
    result.newStops.forEach((s) => expect(s.at).toBeGreaterThanOrEqual(minStopX(194)));
  });

  test('water fills exist and cover a meaningful share of the route', () => {
    const water = result.fills.filter((f) => f.content === 'water');
    expect(water.length).toBeGreaterThan(0);
    const bidonWaterKm = water
      .filter((f) => f.gid === 'g1')
      .reduce((a, f) => a + (f.to - f.from), 0);
    expect(bidonWaterKm).toBeGreaterThan(194 * 0.4);
  });

  test('the flask piggybacks water on stops that already exist, after its gel is gone', () => {
    const flaskWater = result.fills.filter((f) => f.gid === 'g2' && f.content === 'water');
    expect(flaskWater.length).toBeGreaterThan(0);
    const stops = result.newStops.map((s) => s.at);
    const gelEnd = result.fills.find((f) => f.gid === 'g2' && f.content === 'gel')!.to;
    flaskWater.forEach((f) => {
      expect(f.from).toBeGreaterThanOrEqual(gelEnd - 1e-9);
      // each leg starts either at a real stop or at the moment the gel ran out — never at a
      // position that would require inventing a new stop
      const atStop = stops.some((s) => Math.abs(s - f.from) < 1e-9);
      expect(atStop || Math.abs(f.from - gelEnd) < 1e-9).toBe(true);
    });
  });

  test('no two fills for the same vessel overlap', () => {
    expect(overlappingPairs(result.fills)).toEqual([]);
  });

  test('lands in the believable band a careful manual plan reaches with this gear', () => {
    const summary = planSummary(applyResult(state, result).state);
    // The rider's own best hand-built plan for this route/gear was 436g of 520g (84%).
    expect(summary.totalCarbs / summary.target).toBeGreaterThan(0.8);
    // Pre-fix this route planned zero water and reported 30% hydration.
    expect(summary.hydrationPct).toBeGreaterThanOrEqual(60);
    expect(summary.fluidPlanned).toBeGreaterThan(sweat(route) * totalHours(route) * 0.6);
  });
});
