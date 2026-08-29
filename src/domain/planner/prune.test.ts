import { describe, expect, test } from 'vitest';
import type { DraftFood, FoodSelectionEntry } from '../autoplan';
import { COVERAGE_TARGET_PCT, HYDRATION_TARGET_PCT, planSummary } from '../fuel';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { pruneUnneededFood } from './prune';
import { servicesToFills } from './services';
import type { Service } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 40,
    speed: 20,
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

function makeState(route: RouteInput, gear: Vessel[], foodLib: FoodLibEntry[]): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib, stops: [] };
}

/** Same synthetic-scoring `prune.ts` itself does — used here only to validate fixtures/postconditions
 *  against the real, shipped `planSummary()`, never to re-derive `pruneUnneededFood`'s own logic. */
function score(state: PlanState, services: Service[], foods: DraftFood[]) {
  const draftFoods = foods.map((f, i) => ({ ...f, id: i, name: f.key }));
  const draftFills = servicesToFills(services, state.gear).map((f, i) => ({ ...f, fid: i }));
  return planSummary({ ...state, fills: draftFills, foods: draftFoods });
}

/** A `cont` item spread across `[from, to]` — the same delivery shape `assignFood.ts`'s own
 *  `spreadInWindow` produces, which is what makes coverage track carb share predictably enough to
 *  build fixtures by hand. */
function spread(key: string, carbs: number, from: number, to: number): DraftFood {
  return { key, carbs, cont: true, from, to };
}

const GEL: FoodLibEntry = { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22, cont: true, span: 10 };
const COLA: FoodLibEntry = {
  key: 'cola',
  pl: 'Cola',
  en: 'Cola',
  carbs: 35,
  ml: 330,
  needsStop: true,
};
const BANANA: FoodLibEntry = { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 };
const FOOD_LIB = [GEL, COLA, BANANA];

describe('pruneUnneededFood — basics', () => {
  test('empty foods returns the same (empty) array', () => {
    const state = makeState(makeRoute(), [], FOOD_LIB);
    expect(pruneUnneededFood(state, [], [], [])).toEqual([]);
  });

  test('a plan already under the coverage floor is pruned of nothing (rule 3)', () => {
    const route = makeRoute({ distance: 200 }); // huge target, one small gel can't get near it
    const state = makeState(route, [], FOOD_LIB);
    const foods: DraftFood[] = [spread('gel', 22, 5, 15)];
    const selection: FoodSelectionEntry[] = [{ key: 'gel', count: 1 }];

    const baseline = score(state, [], foods);
    expect(baseline.coverage).toBeLessThan(COVERAGE_TARGET_PCT);

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual(foods);
  });

  test('never prunes the last survivor when doing so would drop the plan below the floor', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    const foods: DraftFood[] = [spread('gel', 90, 2, 38)]; // spans (almost) the whole route
    const selection: FoodSelectionEntry[] = [{ key: 'gel', count: 1 }];

    const baseline = score(state, [], foods);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(score(state, [], []).coverage).toBeLessThan(COVERAGE_TARGET_PCT);

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual(foods);
  });

  test('drops the lowest selection-priority product while coverage stays green', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    // Two products, each alone comfortably clears the floor — together they overshoot it. Banana
    // was picked first (higher priority); gel second (lower priority, tried first for removal).
    const foods: DraftFood[] = [spread('banana', 80, 2, 38), spread('gel', 80, 2, 38)];
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 1 },
      { key: 'gel', count: 1 },
    ];

    const baseline = score(state, [], foods);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(score(state, [], [foods[0]]).coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual([foods[0]]); // gel (lower priority) is gone, banana survives
  });

  test('greedy, one removal at a time: the second-lowest-priority survivor is protected by what the first removal already cost', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    // Two bananas (same priority, selected first) plus one gel (selected last). All three together
    // comfortably clear the floor; the two bananas alone still clear it; either banana alone does
    // not. So exactly one removal (the gel) should happen.
    const foods: DraftFood[] = [
      spread('banana', 40, 2, 38),
      spread('banana', 40, 2, 38),
      spread('gel', 40, 2, 38),
    ];
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 2 },
      { key: 'gel', count: 1 },
    ];

    expect(score(state, [], foods).coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(score(state, [], [foods[0], foods[1]]).coverage).toBeGreaterThanOrEqual(
      COVERAGE_TARGET_PCT,
    );
    expect(score(state, [], [foods[0]]).coverage).toBeLessThan(COVERAGE_TARGET_PCT);

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual([foods[0], foods[1]]); // only the gel (last-selected) is gone
  });

  test('every surviving product earns its place: removing any one of them alone drops the plan below green', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    const foods: DraftFood[] = [
      spread('banana', 40, 2, 38),
      spread('banana', 40, 2, 38),
      spread('gel', 40, 2, 38),
    ];
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 2 },
      { key: 'gel', count: 1 },
    ];

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result.length).toBeGreaterThan(0);
    for (const survivor of result) {
      const without = result.filter((f) => f !== survivor);
      const s = score(state, [], without);
      expect(
        s.coverage,
        `removing ${survivor.key} should have dropped coverage below the floor`,
      ).toBeLessThan(COVERAGE_TARGET_PCT);
    }
  });
});

describe('pruneUnneededFood — nominal carb floor', () => {
  // All three fixtures below share the default 40 km / 20 km/h route: totalHours = 2, cph (mid
  // duration, mid intensity) = 45 g/h, so target = 2 × 45 = 90 g exactly (COVERAGE_TARGET_PCT
  // floor = 0.8 × 90 = 72 g). Every food spreads over the same [2, 38] window on that route, so
  // with no gpx the route's effort curve is exactly linear in distance, and as long as an item's
  // average delivery rate over its window stays below the (also constant) need rate, every gram it
  // delivers lands ahead of its matching need slice and is credited in full — `coverage` and the
  // nominal ratio agree exactly except for `coverage`'s integer rounding. That means a total placed
  // of 71.6g — inside [71.55, 72) — rounds `coverage` up to 80 (green) while the raw nominal ratio
  // (totalCarbs / target) stays strictly below 0.8 — the same rounding gap the real 0.7975 "believable
  // band" case hits, reproduced here on purpose.

  test('a removal that keeps coverage green is rejected once it would drop the nominal ratio below the floor', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    // banana (71.6g, kept) + gel (4.4g, lowest priority, tried for removal first) = 76g total.
    const foods: DraftFood[] = [spread('banana', 71.6, 2, 38), spread('gel', 4.4, 2, 38)];
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 1 },
      { key: 'gel', count: 1 },
    ];

    const baseline = score(state, [], foods);
    expect(baseline.totalCarbs).toBeCloseTo(76, 6);
    expect(baseline.target).toBeCloseTo(90, 6);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(baseline.totalCarbs / baseline.target).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT / 100);

    // Without the gel, banana alone (71.6g) is what removing it would leave: coverage still rounds
    // green, but the nominal ratio is genuinely under the floor.
    const withoutGel = score(state, [], [foods[0]]);
    expect(withoutGel.totalCarbs / withoutGel.target).toBeLessThan(COVERAGE_TARGET_PCT / 100);
    expect(withoutGel.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT); // the rounding gap

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual(foods); // gel survives — coverage alone would have let it go
  });

  test('a removal is still accepted when both coverage and the nominal ratio clear their floors', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    // banana (75g, kept) + gel (20g, lowest priority) = 95g total.
    const foods: DraftFood[] = [spread('banana', 75, 2, 38), spread('gel', 20, 2, 38)];
    const selection: FoodSelectionEntry[] = [
      { key: 'banana', count: 1 },
      { key: 'gel', count: 1 },
    ];

    const baseline = score(state, [], foods);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(baseline.totalCarbs / baseline.target).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT / 100);

    // Banana alone (75g) clears both floors comfortably — no rounding edge involved.
    const withoutGel = score(state, [], [foods[0]]);
    expect(withoutGel.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(withoutGel.totalCarbs / withoutGel.target).toBeGreaterThanOrEqual(
      COVERAGE_TARGET_PCT / 100,
    );

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual([foods[0]]); // gel (lower priority) is still gone, as before this change
  });

  test('rule 3 analogue: a plan already below the nominal floor (but reading coverage-green) has nothing removed', () => {
    const route = makeRoute();
    const state = makeState(route, [], FOOD_LIB);
    // A single 71.6g item — the exact "trial" state from the first test above, now as the baseline.
    const foods: DraftFood[] = [spread('banana', 71.6, 2, 38)];
    const selection: FoodSelectionEntry[] = [{ key: 'banana', count: 1 }];

    const baseline = score(state, [], foods);
    // The OLD rule 3 (coverage alone) would not have blocked this plan...
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    // ...but the nominal ratio is genuinely under the floor from the start.
    expect(baseline.totalCarbs / baseline.target).toBeLessThan(COVERAGE_TARGET_PCT / 100);

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual(foods); // untouched
  });
});

const HYDRATION_ROUTE = makeRoute({ distance: 30, temp: 22 });

describe('pruneUnneededFood — needsStop items also protect hydration', () => {
  test('a needsStop item is kept when removing it would drop a hydration-green plan below the hydration floor', () => {
    const gear: Vessel[] = [
      { gid: 'g1', name: 'Bidon', vol: 700, allowed: ['water'], gelParts: 1 },
    ];
    const state = makeState(HYDRATION_ROUTE, gear, FOOD_LIB);
    const services: Service[] = [
      {
        vesselId: 'g1',
        fromKm: 0,
        toKm: HYDRATION_ROUTE.distance,
        content: 'water',
        filledAtStop: null,
      },
    ];
    const foods: DraftFood[] = [
      spread('gel', 60, 2, 28), // clears COVERAGE_TARGET_PCT on carbs alone, without cola
      { key: 'cola', carbs: 35, ml: 330, cont: false, from: 5, to: 5 },
    ];
    const selection: FoodSelectionEntry[] = [
      { key: 'gel', count: 1 },
      { key: 'cola', count: 1 },
    ];

    const baseline = score(state, services, foods);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(baseline.hydrationPct).toBeGreaterThanOrEqual(HYDRATION_TARGET_PCT);
    const withoutCola = score(state, services, [foods[0]]);
    // Carb coverage survives losing the cola, but hydration would not — the reason to keep it is
    // specifically the fluid it carries, not its carbs.
    expect(withoutCola.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(withoutCola.hydrationPct).toBeLessThan(HYDRATION_TARGET_PCT);

    const result = pruneUnneededFood(state, services, foods, selection);
    expect(result).toEqual(foods); // the cola stays
  });

  test('a needsStop item may still be pruned when the plan never started hydration-green', () => {
    const state = makeState(HYDRATION_ROUTE, [], FOOD_LIB); // no bottle — hydration is short regardless
    const foods: DraftFood[] = [
      spread('gel', 60, 2, 28),
      { key: 'cola', carbs: 35, ml: 330, cont: false, from: 5, to: 5 },
    ];
    const selection: FoodSelectionEntry[] = [
      { key: 'gel', count: 1 },
      { key: 'cola', count: 1 },
    ];

    const baseline = score(state, [], foods);
    expect(baseline.coverage).toBeGreaterThanOrEqual(COVERAGE_TARGET_PCT);
    expect(baseline.hydrationPct).toBeLessThan(HYDRATION_TARGET_PCT); // already short before pruning

    const result = pruneUnneededFood(state, [], foods, selection);
    expect(result).toEqual([foods[0]]); // this pass isn't on the hook for a pre-existing shortfall
  });
});
