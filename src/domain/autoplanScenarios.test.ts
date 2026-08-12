/**
 * BDD scenarios for autoplan(), transcribed from `docs/tests/autoplan-scenarios.md`.
 *
 * That doc (and its `docs/tests/input|output/*.json` fixtures) is gitignored scratch space, so
 * every scenario is re-expressed here as plain factory calls — same route/gear/mix numbers, no
 * file loading. Scenario ids (#1..#10, izo-1..6, food-1..7) map 1:1 onto the doc's headings.
 *
 * Every scenario states the same five-part `then` (see `Then`): the coverage floors, how many
 * stops the route may cost, how many vessel top-ups that adds up to, and which products get
 * eaten in which order. Stop and refill counts are **ceilings, not targets** — the physics says
 * the ride is doable in that many, and a plan that finds a way to do it in fewer while still
 * clearing the coverage floors is a better plan, not a failing one.
 *
 * Exact km positions are deliberately not asserted, except where a rider-exported build recorded
 * them: the doc's own confirmed builds don't match the even-slot formula, and the "how far before
 * the finish should the last leg stop" question is still open.
 */
import { describe, expect, test } from 'vitest';
import { autoplan } from './autoplan';
import type { AutoplanResult, FoodSelectionEntry } from './autoplan';
import { dist, planSummary } from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  Stop,
  Vessel,
} from './types';

/** The threshold the app itself paints green, for both carbs and hydration. */
const GREEN_PCT = 85;

/**
 * Smallest end-of-route gap seen in the rider's real builds (izo-6 stopped 5km short of a 100km
 * route, food-2's last chews 2km short of 55km). Carbs delivered right at the line never finish
 * draining out of `gut`, so they score as unabsorbed — the exact buffer is unformalized, this is
 * the floor the real data supports.
 */
const FINISH_GAP_FRACTION = 0.02;

const FOOD_LIB: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330 },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

/** The `then` every scenario states, in the shape the rider asked for. */
interface Then {
  /** Floor on the app's carb progress bar, or null when the scenario carries no carbs at all. */
  minCarbs: number | null;
  /** Floor on the app's hydration progress bar, or null when there is no water on board. */
  minHydration: number | null;
  /** Ceiling on carb coverage — only for scenarios whose point is a deliberate shortfall. */
  maxCarbs?: number;
  /** Ceiling on stops. Fewer is better as long as the floors above still hold. */
  maxStops: number;
  /** Ceiling on vessel top-ups — one stop can refill more than one bottle. */
  maxRefills: number;
  /** Products eaten along the route, in order. The selection list is a priority list. */
  products: string[];
}

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

function water(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

function izo(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['izo'], gelParts: 1 };
}

function makePlan(route: RouteInput, gear: Vessel[], mix: MixSettings = makeMix()): PlanState {
  return { route, mix, gear, fills: [], foods: [], foodLib: FOOD_LIB, stops: [] };
}

interface Run {
  state: PlanState;
  result: AutoplanResult;
  /** The state as the app would look after applying the result (mirrors `applyAutoplan`). */
  planned: PlanState;
  D: number;
}

/** Runs autoplan and materializes its drafts the same way `applyAutoplan` does in the store. */
function run(state: PlanState, selection: FoodSelectionEntry[] = []): Run {
  const result = autoplan(state, selection);
  let fid = 1;
  const fills: Fill[] = result.fills.map((f) => ({ ...f, fid: fid++ }));
  let foodId = 1;
  const foods: FoodItem[] = result.foods.map((f) => ({
    ...f,
    id: foodId++,
    name: state.foodLib.find((e) => e.key === f.key)?.pl ?? f.key,
  }));
  let stopId = 1;
  const stops: Stop[] = [
    ...state.stops,
    ...result.newStops.map((sh) => ({ ...sh, id: stopId++, name: 'Sklep', autoCreated: true })),
  ];
  return { state, result, planned: { ...state, fills, foods, stops }, D: dist(state.route) };
}

function stopXs(r: Run): number[] {
  return r.result.newStops.map((s) => s.at).sort((a, b) => a - b);
}

/** Top-ups, not fills: the first fill of each vessel is what the rider leaves home with. */
function refillCount(r: Run): number {
  const perVessel = new Map<string, number>();
  for (const f of r.result.fills) perVessel.set(f.gid, (perVessel.get(f.gid) || 0) + 1);
  let total = 0;
  for (const n of perVessel.values()) total += n - 1;
  return total;
}

/** Products in the order they are actually eaten along the route. */
function productOrder(r: Run): string[] {
  return [...r.result.foods].sort((a, b) => a.from - b.from).map((f) => f.key);
}

/** How many full loads it takes to reach 85% of the requirement, minus the one carried from home. */
function loadsNeeded(need: number, load: number): number {
  return Math.ceil((0.85 * need) / load) - 1;
}

/**
 * Checks the scenario's stated `then`, plus the structural rules that hold everywhere: refills
 * are real stops, fills tile the route per vessel, and no two products are ever open at once.
 */
function expectThen(r: Run, then: Then): void {
  const { D, result } = r;
  const summary = planSummary(r.planned);

  // --- the stated `then` -----------------------------------------------------------------
  if (then.minCarbs !== null) expect(summary.coverage).toBeGreaterThanOrEqual(then.minCarbs);
  if (then.maxCarbs !== undefined) expect(summary.coverage).toBeLessThanOrEqual(then.maxCarbs);
  if (then.minHydration !== null) {
    expect(summary.hydrationPct).toBeGreaterThanOrEqual(then.minHydration);
  }
  expect(stopXs(r).length).toBeLessThanOrEqual(then.maxStops);
  expect(refillCount(r)).toBeLessThanOrEqual(then.maxRefills);
  expect(productOrder(r)).toEqual(then.products);

  // --- structural rules ------------------------------------------------------------------
  // Every refill is a real stop stop, and every stop stop is a refill — no free tap water.
  const boundaries = [...new Set(result.fills.map((f) => f.from).filter((x) => x > 0))].sort(
    (a, b) => a - b,
  );
  const round = (x: number) => Math.round(x * 100) / 100;
  expect(stopXs(r).map(round)).toEqual(boundaries.map(round));

  // Stops sit strictly inside the route, and the first one isn't parked at the start line.
  const stops = stopXs(r);
  for (const x of stops) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(D);
  }
  if (stops.length > 0) expect(stops[0]).toBeGreaterThanOrEqual(3);
  if (stops.length > 1) {
    const gaps = stops.slice(1).map((x, i) => x - stops[i]);
    const typical = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    expect(stops[0]).toBeGreaterThanOrEqual(0.6 * typical);
  }

  // Per vessel: fills start at the line, run contiguously, and stay inside the route.
  for (const v of r.state.gear) {
    const own = result.fills.filter((f) => f.gid === v.gid).sort((a, b) => a.from - b.from);
    if (own.length === 0) continue;
    expect(own[0].from).toBe(0);
    for (const f of own) {
      expect(f.to).toBeGreaterThan(f.from);
      expect(f.to).toBeLessThanOrEqual(D + 1e-9);
    }
    for (let i = 1; i < own.length; i++) {
      expect(own[i].from).toBeCloseTo(own[i - 1].to, 6);
    }
  }

  // No two products are ever open at once — not even two of the same kind.
  const foods = [...result.foods].sort((a, b) => a.from - b.from);
  for (let i = 1; i < foods.length; i++) {
    expect(foods[i].from).toBeGreaterThanOrEqual(foods[i - 1].to);
    expect(foods[i].from).toBeGreaterThan(foods[i - 1].from);
  }
  // Nothing is eaten on the finish line — there'd be no time left to absorb it.
  for (const f of foods) {
    expect(f.to).toBeLessThanOrEqual(D * (1 - FINISH_GAP_FRACTION));
  }
}

/** A ride the rider carries the whole way: one fill per vessel, start to finish, no stop. */
function expectSingleFillRide(r: Run): void {
  expect(r.result.fills).toHaveLength(r.state.gear.length);
  for (const f of r.result.fills) {
    expect(f).toMatchObject({ from: 0, to: r.D });
  }
}

describe('autoplan scenarios — water only', () => {
  test('#1: 20km / 500ml / 15°C / 65kg — one bottle covers the ride', () => {
    const r = run(
      makePlan(makeRoute({ distance: 20, speed: 20, intensity: 'low', temp: 15, weight: 65 }), [
        water(500),
      ]),
    );
    // 330ml of sweat loss against a 500ml bottle — confirmed against the rider's export.
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: 0,
      maxRefills: 0,
      products: [],
    });
    expectSingleFillRide(r);
  });

  test('#2: 200km / 1000ml — the rider hand-built this one with four stops', () => {
    const r = run(
      makePlan(makeRoute({ distance: 200, speed: 25, intensity: 'mid', temp: 20, weight: 75 }), [
        water(1000),
      ]),
    );
    // 5600ml needed, 1000ml carried: four top-ups get hydration to 89%.
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(5600, 1000),
      maxRefills: loadsNeeded(5600, 1000),
      products: [],
    });
    // Rider's real build: 37 / 77 / 117 / 157. Even-load spacing lands them ~35.7km apart.
    for (const [i, x] of stopXs(r).entries()) {
      expect(x).toBeGreaterThan(25 + i * 35);
      expect(x).toBeLessThan(50 + i * 40);
    }
  });

  test('#3: 15km / 350ml / 38°C / 85kg — brutal but brief, under the 1.5%-body-mass gate', () => {
    const r = run(
      makePlan(makeRoute({ distance: 15, speed: 30, intensity: 'high', temp: 38, weight: 85 }), [
        water(350),
      ]),
    );
    // 885ml lost against a 1275ml gate: no water planning at all, despite 38°C.
    expectThen(r, {
      minCarbs: null,
      minHydration: null,
      maxStops: 0,
      maxRefills: 0,
      products: [],
    });
    expectSingleFillRide(r);
  });

  test('#4: 120km / 650ml / 25°C / 70kg', () => {
    const r = run(
      makePlan(makeRoute({ distance: 120, speed: 25, intensity: 'mid', temp: 25, weight: 70 }), [
        water(650),
      ]),
    );
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(4080, 650),
      maxRefills: loadsNeeded(4080, 650),
      products: [],
    });
  });

  test('#5: 100km / 500ml + 500ml / 25°C / 80kg — split capacity', () => {
    const r = run(
      makePlan(makeRoute({ distance: 100, speed: 25, intensity: 'mid', temp: 25, weight: 80 }), [
        water(500, 'g1'),
        water(500, 'g2'),
      ]),
    );
    // Same 1000ml as #6, just in two bottles — so the same stops, but each one tops up both.
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(3880, 1000),
      maxRefills: 2 * loadsNeeded(3880, 1000),
      products: [],
    });
    for (const v of ['g1', 'g2']) {
      expect(r.result.fills.filter((f) => f.gid === v)).toHaveLength(stopXs(r).length + 1);
    }
  });

  test('#6: 100km / one 1000ml bottle — same stops as the two-bottle #5', () => {
    const route = makeRoute({ distance: 100, speed: 25, intensity: 'mid', temp: 25, weight: 80 });
    const r = run(makePlan(route, [water(1000)]));
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(3880, 1000),
      maxRefills: loadsNeeded(3880, 1000),
      products: [],
    });
    // Only the total ml matters, not how many bottles it is spread across.
    const split = run(makePlan(route, [water(500, 'g1'), water(500, 'g2')]));
    expect(stopXs(r)).toEqual(stopXs(split));
  });

  test('#7: 300km / 750ml — modest gear on an ultra, and the honest number of stops', () => {
    const r = run(
      makePlan(makeRoute({ distance: 300, speed: 25, intensity: 'mid', temp: 22, weight: 78 }), [
        water(750),
      ]),
    );
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(9840, 750),
      maxRefills: loadsNeeded(9840, 750),
      products: [],
    });
  });

  test('#8: 70km / 1000ml / 5°C / 70kg — 81.6% of the need is not green, so it costs a stop', () => {
    const r = run(
      makePlan(makeRoute({ distance: 70, speed: 20, intensity: 'low', temp: 5, weight: 70 }), [
        water(1000),
      ]),
    );
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(1225, 1000),
      maxRefills: loadsNeeded(1225, 1000),
      products: [],
    });
  });

  test('#9: 22km / 35°C / 75kg — 1056ml lost, just under the 1125ml gate', () => {
    const r = run(
      makePlan(makeRoute({ distance: 22, speed: 30, intensity: 'high', temp: 35, weight: 75 }), [
        water(500),
      ]),
    );
    expectThen(r, {
      minCarbs: null,
      minHydration: null,
      maxStops: 0,
      maxRefills: 0,
      products: [],
    });
    expectSingleFillRide(r);
  });

  test('#10: 24km / 35°C / 75kg — 1152ml clears the gate, so water is planned despite <1h', () => {
    const r = run(
      makePlan(makeRoute({ distance: 24, speed: 30, intensity: 'high', temp: 35, weight: 75 }), [
        water(500),
      ]),
    );
    // The one scenario where the old "<1h means don't bother" rule and the sweat gate disagree.
    expectThen(r, {
      minCarbs: null,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(1152, 500),
      maxRefills: loadsNeeded(1152, 500),
      products: [],
    });
  });
});

describe('autoplan scenarios — izo only', () => {
  test('izo-1: 60km / 650ml @ 8.4g', () => {
    const r = run(makePlan(makeRoute({ distance: 60 }), [izo(650)]));
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: loadsNeeded(108, 54.6),
      maxRefills: loadsNeeded(108, 54.6),
      products: [],
    });
  });

  test('izo-2: 150km / 750ml @ 8.4g', () => {
    const r = run(makePlan(makeRoute({ distance: 150 }), [izo(750)]));
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: loadsNeeded(450, 63),
      maxRefills: loadsNeeded(450, 63),
      products: [],
    });
  });

  test('izo-3: 250km / 500ml @ 8.4g — a small bottle on an ultra', () => {
    const r = run(makePlan(makeRoute({ distance: 250 }), [izo(500)]));
    // 15 is what the raw sums demand; the real integral has room to need fewer.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: loadsNeeded(750, 42),
      maxRefills: loadsNeeded(750, 42),
      products: [],
    });
  });

  test('izo-4: 60km / 650ml @ 15g — a concentrated mix carries the whole ride', () => {
    const r = run(makePlan(makeRoute({ distance: 60 }), [izo(650)], makeMix({ conc: 15 })));
    // 97.5g of a 108g target, 90% — green without stopping. Confirmed against the export.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: 0,
      maxRefills: 0,
      products: [],
    });
    expectSingleFillRide(r);
  });

  test('izo-5: 60km at high intensity — the higher target costs more than izo-1', () => {
    const r = run(makePlan(makeRoute({ distance: 60, intensity: 'high' }), [izo(650)]));
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: loadsNeeded(144, 54.6),
      maxRefills: loadsNeeded(144, 54.6),
      products: [],
    });
    const izo1 = run(makePlan(makeRoute({ distance: 60 }), [izo(650)]));
    expect(stopXs(r).length).toBeGreaterThanOrEqual(stopXs(izo1).length);
  });

  test('izo-6: 100km / 1000ml @ 8.4g — two stops, and the last leg stops short of the line', () => {
    const r = run(makePlan(makeRoute({ distance: 100 }), [izo(1000)]));
    // Built by hand twice, both times two stops near 32 and 64 — one fewer than the raw sums
    // demand, because `coverage()` integrates absorption instead of dividing totals.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: 2,
      maxRefills: 2,
      products: [],
    });
    expect(stopXs(r)).toHaveLength(2);
    expect(stopXs(r)[0]).toBeGreaterThan(20);
    expect(stopXs(r)[0]).toBeLessThan(45);
    expect(stopXs(r)[1]).toBeGreaterThan(50);
    expect(stopXs(r)[1]).toBeLessThan(80);
    // Carbs poured in at the finish never drain out of `gut`, so they score as unabsorbed.
    const last = Math.max(...r.result.fills.map((f) => f.to));
    expect(last).toBeLessThanOrEqual(100 * (1 - FINISH_GAP_FRACTION));
  });
});

describe('autoplan scenarios — products only', () => {
  test('food-1: 90km, 11 gels selected — the whole selection is used', () => {
    const r = run(makePlan(makeRoute({ distance: 90 }), [water(750)]), [{ key: 'gel', count: 11 }]);
    // 242g of a 270g target: the selection runs out before the target does.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(2520, 750),
      maxRefills: loadsNeeded(2520, 750),
      products: Array(11).fill('gel'),
    });
  });

  test('food-2: 55km, gel > banana > chews > cola — stops at 149g, cola untouched', () => {
    // The banana sits second on purpose: it bruises, so the rider wants it eaten before the
    // chews. Priority is the rider's own ordering, not a carb-density ranking.
    const r = run(
      makePlan(makeRoute({ distance: 55, speed: 20, intensity: 'low' }), [water(750)]),
      [
        { key: 'gel', count: 3 },
        { key: 'banana', count: 1 },
        { key: 'chew', count: 2 },
        { key: 'cola', count: 1 },
      ],
    );
    // Both of the rider's independent builds landed on 3 gels + 1 banana + 2 chews = 149g (90%),
    // eaten in exactly that order, with the cola left in the pocket.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(1623, 750),
      maxRefills: loadsNeeded(1623, 750),
      products: ['gel', 'gel', 'gel', 'banana', 'chew', 'chew'],
    });
    expect(r.result.foods.reduce((a, f) => a + f.carbs, 0)).toBe(149);
  });

  test('food-3: 40km, a single gel selected — autoplan never adds what the rider did not pick', () => {
    const r = run(
      makePlan(makeRoute({ distance: 40, speed: 20, intensity: 'low' }), [water(750)]),
      [{ key: 'gel', count: 1 }],
    );
    // 22g against a 60g target. The shortfall stays visible instead of being invented away.
    expectThen(r, {
      minCarbs: null,
      maxCarbs: 45,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(1180, 750),
      maxRefills: loadsNeeded(1180, 750),
      products: ['gel'],
    });
  });

  test('food-4: 24km, 10 gels selected — only 3 are placed, the rest stay in the pocket', () => {
    const r = run(makePlan(makeRoute({ distance: 24, speed: 20 }), [water(750)]), [
      { key: 'gel', count: 10 },
    ]);
    // 2 gels miss the 54g target, 3 clear it. 840ml of sweat is under the gate, so no water stop.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: null,
      maxStops: 0,
      maxRefills: 0,
      products: ['gel', 'gel', 'gel'],
    });
  });

  test('food-5: 40km, 2 packs of chews — placed back-to-back, never overlapping', () => {
    const r = run(
      makePlan(makeRoute({ distance: 40, speed: 20, intensity: 'low' }), [water(750)]),
      [{ key: 'chew', count: 2 }],
    );
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: GREEN_PCT,
      maxStops: loadsNeeded(1180, 750),
      maxRefills: loadsNeeded(1180, 750),
      products: ['chew', 'chew'],
    });
    const chews = [...r.result.foods].sort((a, b) => a.from - b.from);
    expect(chews[0].to).toBeLessThanOrEqual(chews[1].from);
    expect(chews[0].cont).toBe(true);
  });

  test('food-6: 15km / 0.6h — the carb gate skips every product, water still gets its fill', () => {
    const r = run(makePlan(makeRoute({ distance: 15 }), [water(750)]), [{ key: 'gel', count: 5 }]);
    expectThen(r, {
      minCarbs: null,
      minHydration: null,
      maxStops: 0,
      maxRefills: 0,
      products: [],
    });
    expectSingleFillRide(r);
  });

  test('food-7: 60km, 3 colas — their 990ml counts as fluid, so the bottle needs no refill', () => {
    const r = run(makePlan(makeRoute({ distance: 60 }), [water(1000)]), [
      { key: 'cola', count: 3 },
    ]);
    // 1000ml carried + 990ml of cola against 1680ml of sweat loss — green without stopping.
    expectThen(r, {
      minCarbs: GREEN_PCT,
      minHydration: GREEN_PCT,
      maxStops: 0,
      maxRefills: 0,
      products: ['cola', 'cola', 'cola'],
    });
    expectSingleFillRide(r);
  });
});
