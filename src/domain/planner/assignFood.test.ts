import { describe, expect, test } from 'vitest';
import type { FoodLibEntry, PlanState, RouteInput } from '../types';
import { assignFood } from './assignFood';
import type { FoodSelectionEntry, Service, Skeleton, StopNode } from './types';

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

function makeState(route: RouteInput, foodLib: FoodLibEntry[]): PlanState {
  return {
    route,
    mix: {
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
    },
    gear: [],
    fills: [],
    foods: [],
    foodLib,
    stops: [],
  };
}

function skeletonWithStops(stopKms: number[]): Skeleton {
  const stops: StopNode[] = stopKms.map((km) => ({ km, origin: 'planned' }));
  return { stops, legs: [], shortfall: null };
}

const GEL: FoodLibEntry = { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 25 };
const COLA: FoodLibEntry = {
  key: 'cola',
  pl: 'Cola',
  en: 'Cola',
  carbs: 20,
  ml: 250,
  needsStop: true,
};
const CHEWS: FoodLibEntry = { key: 'chews', pl: 'Żelki', en: 'Chews', carbs: 30 };
const BAR: FoodLibEntry = { key: 'bar', pl: 'Baton', en: 'Bar', carbs: 40, cont: true, span: 10 };

const NO_SERVICES: Service[] = [];

describe('assignFood — basics', () => {
  test('empty selection returns nothing', () => {
    const route = makeRoute({ distance: 150 });
    const state = makeState(route, [GEL]);
    const skeleton = skeletonWithStops([]);

    expect(assignFood(skeleton, NO_SERVICES, state, [])).toEqual([]);
  });

  test('a selection key with no matching library entry is skipped, not thrown', () => {
    const route = makeRoute({ distance: 150 });
    const state = makeState(route, [GEL]);
    const skeleton = skeletonWithStops([]);
    const selection: FoodSelectionEntry[] = [{ key: 'does-not-exist', count: 2 }];

    expect(assignFood(skeleton, NO_SERVICES, state, selection)).toEqual([]);
  });
});

describe('assignFood — P2: carried items spread by carb share', () => {
  test('equal-carb items land at roughly even, ascending positions across the route', () => {
    const route = makeRoute({ distance: 150 });
    const state = makeState(route, [GEL]);
    const skeleton = skeletonWithStops([]);
    const selection: FoodSelectionEntry[] = [{ key: 'gel', count: 3 }];

    const foods = assignFood(skeleton, NO_SERVICES, state, selection);

    expect(foods).toHaveLength(3);
    expect(foods.every((f) => f.key === 'gel')).toBe(true);
    // Strictly ascending — evenly spread, not stacked.
    for (let i = 1; i < foods.length; i++) expect(foods[i].from).toBeGreaterThan(foods[i - 1].from);
    // None past the finish gap.
    const D = 150;
    for (const f of foods) expect(f.from).toBeLessThan(D * 0.99);
  });

  test('a larger item claims a proportionally larger slice, moving later items further out', () => {
    const route = makeRoute({ distance: 150 });
    const state = makeState(route, [GEL, CHEWS]); // chews has more carbs than gel
    const skeleton = skeletonWithStops([]);
    const selectionEqual: FoodSelectionEntry[] = [
      { key: 'gel', count: 1 },
      { key: 'gel', count: 1 },
    ];
    const selectionBig: FoodSelectionEntry[] = [
      { key: 'chews', count: 1 },
      { key: 'gel', count: 1 },
    ];

    const evenFoods = assignFood(skeleton, NO_SERVICES, state, selectionEqual);
    const bigFirstFoods = assignFood(skeleton, NO_SERVICES, state, selectionBig);

    // With a bigger first item, the second item's slot starts later than in the equal-carb case.
    expect(bigFirstFoods[1].from).toBeGreaterThan(evenFoods[1].from);
  });

  test('a cont item is placed at its own span, clipped to its window', () => {
    const route = makeRoute({ distance: 100 });
    const state = makeState(route, [BAR]);
    const skeleton = skeletonWithStops([]);
    const selection: FoodSelectionEntry[] = [{ key: 'bar', count: 1 }];

    const [food] = assignFood(skeleton, NO_SERVICES, state, selection);

    expect(food.cont).toBe(true);
    expect(food.to - food.from).toBeLessThanOrEqual(10); // BAR.span
    expect(food.to).toBeGreaterThan(food.from);
  });
});

describe('assignFood — S3: needsStop items pin to stops', () => {
  test('with no stops anywhere, a needsStop item is dropped entirely', () => {
    const route = makeRoute({ distance: 150 });
    const state = makeState(route, [COLA]);
    const skeleton = skeletonWithStops([]);
    const selection: FoodSelectionEntry[] = [{ key: 'cola', count: 1 }];

    expect(assignFood(skeleton, NO_SERVICES, state, selection)).toEqual([]);
  });

  test('one needsStop item per stop, spread across the available stops rather than stacked at the first', () => {
    const route = makeRoute({ distance: 120 });
    const state = makeState(route, [COLA]);
    const skeleton = skeletonWithStops([30, 60, 90]);
    const selection: FoodSelectionEntry[] = [{ key: 'cola', count: 3 }];

    const foods = assignFood(skeleton, NO_SERVICES, state, selection);

    expect(foods).toHaveLength(3);
    expect(foods.every((f) => f.cont === false)).toBe(true);
    expect(foods.map((f) => f.from).sort((a, b) => a - b)).toEqual([30, 60, 90]);
  });

  test('more needsStop units than stops: they share a stop, offset so they do not overlap exactly', () => {
    const route = makeRoute({ distance: 70 });
    const state = makeState(route, [COLA]);
    const skeleton = skeletonWithStops([35]); // just one stop
    const selection: FoodSelectionEntry[] = [{ key: 'cola', count: 4 }]; // mix-7's own shape

    const foods = assignFood(skeleton, NO_SERVICES, state, selection);

    expect(foods).toHaveLength(4);
    expect(foods.every((f) => f.key === 'cola')).toBe(true);
    // All anchored at (or immediately after, offset by the stacking gap) the one stop.
    for (const f of foods) expect(f.from).toBeGreaterThanOrEqual(35);
    for (const f of foods) expect(f.from).toBeLessThan(35 + 5); // small stacking offsets, not spread
    // Distinct positions — not literally stacked on top of each other.
    const uniquePositions = new Set(foods.map((f) => f.from));
    expect(uniquePositions.size).toBe(4);
  });

  test('needsStop items prefer a stop a carb/water service is already anchored to', () => {
    const route = makeRoute({ distance: 120 });
    const state = makeState(route, [COLA]);
    const skeleton = skeletonWithStops([30, 60, 90]);
    // Only the stop at km 60 (skeleton.stops[1]) has a service anchored to it.
    const services: Service[] = [
      { vesselId: 'v', fromKm: 60, toKm: 90, content: 'water', filledAtStop: 1 },
    ];
    const selection: FoodSelectionEntry[] = [{ key: 'cola', count: 1 }];

    const foods = assignFood(skeleton, services, state, selection);

    expect(foods).toHaveLength(1);
    expect(foods[0].from).toBe(60);
  });

  test('falls back to every stop once needsStop demand exceeds the serviced stops', () => {
    const route = makeRoute({ distance: 120 });
    const state = makeState(route, [COLA]);
    const skeleton = skeletonWithStops([30, 60, 90]);
    // Only one serviced stop (km 60), but two cola units are selected.
    const services: Service[] = [
      { vesselId: 'v', fromKm: 60, toKm: 90, content: 'water', filledAtStop: 1 },
    ];
    const selection: FoodSelectionEntry[] = [{ key: 'cola', count: 2 }];

    const foods = assignFood(skeleton, services, state, selection);

    expect(foods).toHaveLength(2);
    // Spread across the full stop list (30/60/90), not both forced onto km 60.
    const positions = new Set(foods.map((f) => f.from));
    expect(positions.has(60) && positions.size === 1).toBe(false);
  });
});

describe('assignFood — P1: span and gap spacing', () => {
  test('a mixed selection spans at least 60% of D with no gap over 2x the median', () => {
    const route = makeRoute({ distance: 150 });
    const D = 150;
    const state = makeState(route, [GEL, CHEWS, COLA]);
    const skeleton = skeletonWithStops([50, 100]);
    const selection: FoodSelectionEntry[] = [
      { key: 'gel', count: 3 },
      { key: 'chews', count: 2 },
      { key: 'cola', count: 2 },
    ];

    const foods = assignFood(skeleton, NO_SERVICES, state, selection);
    const positions = foods.map((f) => f.from).sort((a, b) => a - b);

    const span = positions[positions.length - 1] - positions[0];
    expect(span).toBeGreaterThanOrEqual(0.6 * D);

    const gaps: number[] = [];
    for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i - 1]);
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const median = sortedGaps[Math.floor(sortedGaps.length / 2)];
    for (const g of gaps) expect(g).toBeLessThanOrEqual(2 * median + 1e-6);
  });
});

describe('assignFood — carried items avoid a pinned stop-product', () => {
  test('carried products are placed in the gaps left by pinned items, not on top of them', () => {
    const route = makeRoute({ distance: 100 });
    const state = makeState(route, [GEL, COLA]);
    const skeleton = skeletonWithStops([50]);
    const selection: FoodSelectionEntry[] = [
      { key: 'cola', count: 1 },
      { key: 'gel', count: 2 },
    ];

    const foods = assignFood(skeleton, NO_SERVICES, state, selection);
    const cola = foods.find((f) => f.key === 'cola')!;
    const gels = foods.filter((f) => f.key === 'gel');

    expect(cola.from).toBe(50);
    for (const g of gels) expect(Math.abs(g.from - cola.from)).toBeGreaterThan(0.4);
  });
});
