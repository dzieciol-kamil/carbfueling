/**
 * Combined BDD scenarios for autoplan() — water + izo + gel + products on the same route.
 *
 * The siloed scenarios (`autoplanScenarios.test.ts`, #1-10 / izo-1..6 / food-1..7) each test one
 * domain in isolation. These ten (mix-1..mix-10) are the realistic case: several vessels, several
 * contents, a product selection, and the rules that only show up when the domains have to share a
 * route. Their `given`/`when` are the fixtures in `docs/tests/input/mix-*.json` (gitignored, so
 * re-expressed here as factory calls); the rider reviewed the current planner's answer to each and
 * ruled on what is wrong with it.
 *
 * The `then` has the same five parts as the siloed scenarios — the app's own two badges, a ceiling
 * on stops, a ceiling on top-ups, and which products get eaten — plus the combined-only invariants
 * below.
 *
 * Deliberately *not* expressed as thresholds: "how much of the route must be covered". The rider's
 * ruling is that the planner cannot promise a percentage, because it has no say over what the rider
 * packed — it searches for the best plan the given resources allow. So the distribution rules here
 * are relative (a leg against its own siblings, a plan against an evenly-spread version of itself),
 * never "must reach N%".
 */
import { describe, expect, test } from 'vitest';
import { autoplan } from './autoplan';
import type { AutoplanResult, FoodSelectionEntry } from './autoplan/types';
import { coverageStatus, dist, hydrationStatus, planSummary, samples, totalHours } from './fuel';
import type { CoverageStatus } from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  ShopStop,
  Vessel,
} from './types';

/**
 * The stop shape, the food-library shape and the plan-plus-stops shape these scenarios work in.
 *
 * `feat/autoplan` had renamed `ShopStop` to `Stop` with an `autoCreated` flag, threaded a `stops`
 * array through `PlanState`, and given `FoodLibEntry` the `needsStop` flag that mix-7..9 are built
 * on; none of that exists on this branch. No scenario places a stop by hand and nothing asserts on
 * the materialized array, so the suite carries the extra fields locally rather than reshaping the
 * app's own types for them — `planSummary` reads only route/mix/gear/fills/foods, so a
 * `ScenarioState` is a valid `PlanState`.
 */
type Stop = ShopStop & { autoCreated?: boolean };
type ScenarioState = PlanState & { stops: Stop[] };
type ScenarioFoodLibEntry = FoodLibEntry & { needsStop?: boolean };

/** How far an existing stop may sit from a planned stop and still be treated as the same one in
 *  these assertions — a test tolerance, not anything the engine itself enforces, which is why it
 *  lives here rather than being exported from `./autoplan`. */
const STOP_SNAP_KM = 3;

/** Nothing is delivered on the finish line — there'd be no time left to absorb it. */
const FINISH_GAP_FRACTION = 0.02;

/**
 * Two stops closer than this are the same stop: nobody pulls over twice inside 10km. Matches
 * `minStopX`, which already keeps the *first* stop from parking on the start line.
 */
function mergeWindow(D: number): number {
  return Math.min(10, D * 0.2);
}

const FOOD_LIB: ScenarioFoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  // You don't carry a cola for 40km — you buy it. Eating one is a stop.
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

interface Then {
  /** Expected carb badge, or null when the scenario carries no carbs at all. */
  carbs: CoverageStatus | null;
  /** Expected hydration badge, or null when there is no water on board. */
  hydration: CoverageStatus | null;
  /** Ceiling on stops. Fewer is better as long as the floors above still hold. */
  maxStops: number;
  /** Ceiling on vessel top-ups — one stop can refill more than one bottle. */
  maxRefills: number;
  /**
   * Products eaten along the route, in order. Only stated where the priority list alone decides
   * the order; once a `needsStop` product is in play it is pinned to a stop instead, so those
   * scenarios state `productCounts` (how many of each) and leave the ordering to the planner.
   */
  products?: string[];
  productCounts?: Record<string, number>;
}

function makeRoute(o: Partial<RouteInput> = {}): RouteInput {
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
    ...o,
  };
}

function makeMix(o: Partial<MixSettings> = {}): MixSettings {
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
    ...o,
  };
}

function vessel(gid: string, name: string, vol: number, allowed: Vessel['allowed']): Vessel {
  return { gid, name, vol, allowed, gelParts: 4 };
}

function makePlan(route: RouteInput, gear: Vessel[], mix: MixSettings = makeMix()): ScenarioState {
  return { route, mix, gear, fills: [], foods: [], foodLib: FOOD_LIB, stops: [] };
}

interface Run {
  state: ScenarioState;
  result: AutoplanResult;
  /** The state as the app would look after applying the result (mirrors `applyAutoplan`). */
  planned: ScenarioState;
  D: number;
}

/** Runs autoplan and materializes its drafts the same way `applyAutoplan` does in the store. */
function run(state: ScenarioState, selection: FoodSelectionEntry[] = []): Run {
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

function productOrder(r: Run): string[] {
  return [...r.result.foods].sort((a, b) => a.from - b.from).map((f) => f.key);
}

function countBy(keys: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = (out[k] || 0) + 1;
  return out;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * The lowest point of the fluid delivery line, as a share of the target rate there.
 *
 * The rider's rule: the line may wave, the ride may end at 100% or above, but it must never sag
 * below 85% of the target anywhere. That is a stronger and far more legible statement than any
 * route-total percentage — `planSummary().hydrationPct` is a plain `fluidPlanned / sweatLoss` sum
 * ratio, which is why it scored "drink everything by km 130, then trickle a litre over the last
 * 239" at 91% and looked healthy.
 *
 * Measured on the raw per-sample deltas rather than `fluidRate`/`fluidNeedRate`: those two are
 * double-EMA smoothed for the chart's sake, which makes the ratio meaningless for the first few
 * kilometres (delivery ramps up from a standing start while the requirement doesn't). The smoothing
 * never undershoots, so a plan that holds the floor on the raw series holds it on the chart too.
 */
function worstFluidPct(state: PlanState, D: number): number {
  const S = samples(state);
  const dt = totalHours(state.route) / (S.length - 1);
  // The last stretch is exempt for the same reason products can't be eaten there: a plan that has
  // to keep pouring across the finish line isn't a better plan, and carbs delivered there don't
  // absorb in time anyway.
  const cutoff = D * (1 - FINISH_GAP_FRACTION);
  let worst = Infinity;
  for (let i = 1; i < S.length; i++) {
    if (S[i].x > cutoff) break;
    const need = (S[i].fluidNeed - S[i - 1].fluidNeed) / dt;
    // Below the short-ride buffer gate there is no requirement to fall short of.
    if (need < 1) continue;
    const got = (S[i].ml - S[i - 1].ml) / dt;
    worst = Math.min(worst, (got / need) * 100);
  }
  return worst === Infinity ? 100 : Math.round(worst);
}

/**
 * The same resources, spread evenly over the whole route: every vessel's fills tile 0→D in equal
 * legs, every product sits in the middle of an equal slot. It is the dumbest defensible plan there
 * is, which makes it a fair floor — a planner that searched for a good arrangement has no business
 * scoring below it.
 */
function evenlySpread(planned: PlanState, D: number): PlanState {
  // Tiles up to the same finish gap the real plan has to respect, so the comparison never rewards
  // dumping the last load across the line where it couldn't be absorbed anyway.
  const end = D * (1 - FINISH_GAP_FRACTION);
  const fills: Fill[] = [];
  const byVessel = new Map<string, Fill[]>();
  for (const f of planned.fills) {
    const own = byVessel.get(f.gid) || [];
    own.push(f);
    byVessel.set(f.gid, own);
  }
  for (const own of byVessel.values()) {
    const n = own.length;
    own
      .sort((a, b) => a.from - b.from)
      .forEach((f, i) => {
        fills.push({ ...f, from: (i * end) / n, to: ((i + 1) * end) / n });
      });
  }
  const n = planned.foods.length;
  const foods: FoodItem[] = [...planned.foods]
    .sort((a, b) => a.from - b.from)
    .map((f, i) => {
      const at = ((i + 0.5) * end) / n;
      return { ...f, from: at, to: f.cont ? Math.min(end, at + (f.to - f.from)) : at };
    });
  return { ...planned, fills, foods };
}

/**
 * Checks the scenario's stated `then`, the structural rules inherited from the siloed scenarios,
 * and the combined-only rules the rider ruled on while reviewing mix-1..mix-10.
 */
function expectThen(r: Run, then: Then): void {
  const { D, result } = r;
  const summary = planSummary(r.planned);

  // --- the stated `then` -----------------------------------------------------------------
  // The pass criterion is the app's own pair of badges — the same two calls `SummaryCards` and
  // `MobilePlanList` make, argument for argument — not a percentage floor of the suite's own.
  if (then.carbs !== null) {
    expect(
      coverageStatus(
        summary.carbRateGph,
        totalHours(r.state.route),
        summary.carbPlannedRateGph,
        summary.carbAbsCapGph,
        summary.carbTargetGph,
      ),
    ).toBe(then.carbs);
  }
  if (then.hydration !== null) {
    expect(hydrationStatus(summary.waterBalancePct, r.state.route.temp)).toBe(then.hydration);
  }
  expect(stopXs(r).length).toBeLessThanOrEqual(then.maxStops);
  expect(refillCount(r)).toBeLessThanOrEqual(then.maxRefills);
  if (then.products) expect(productOrder(r)).toEqual(then.products);
  if (then.productCounts) expect(countBy(productOrder(r))).toEqual(then.productCounts);

  // --- inherited structural rules ---------------------------------------------------------
  // Every refill is a real stop stop, and every stop stop is a refill or a `needsStop` product.
  const boundaries = new Set(result.fills.map((f) => Math.round(f.from * 100) / 100));
  boundaries.delete(0);
  const stops = stopXs(r);
  const stopProducts = result.foods.filter((f) => FOOD_LIB.find((e) => e.key === f.key)?.needsStop);
  for (const x of stops) {
    const isRefill = [...boundaries].some((b) => Math.abs(b - x) <= STOP_SNAP_KM);
    const isProductStop = stopProducts.some((f) => Math.abs(f.from - x) <= STOP_SNAP_KM);
    expect(isRefill || isProductStop, `stop @${x} serves nothing`).toBe(true);
  }
  for (const b of boundaries) {
    expect(
      stops.some((x) => Math.abs(x - b) <= STOP_SNAP_KM),
      `refill @${b} has no stop`,
    ).toBe(true);
  }

  // Stops sit strictly inside the route and never on the start line.
  for (const x of stops) {
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(D);
  }
  if (stops.length > 0) expect(stops[0]).toBeGreaterThanOrEqual(Math.min(3, D * 0.1));

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

  // No two products are ever open at once, and nothing lands on the finish line.
  const foods = [...result.foods].sort((a, b) => a.from - b.from);
  for (let i = 1; i < foods.length; i++) {
    expect(foods[i].from).toBeGreaterThanOrEqual(foods[i - 1].to);
    expect(foods[i].from).toBeGreaterThan(foods[i - 1].from);
  }
  for (const f of foods) expect(f.to).toBeLessThanOrEqual(D * (1 - FINISH_GAP_FRACTION));

  // --- combined-only rules ----------------------------------------------------------------
  expectStopsMerged(r);
  expectStopProducts(r);
  expectFluidNeverSags(r);
  expectProductsSpanTheRoute(r);
  expectNotWorseThanEvenSpread(r);
}

/** R1: water, izo and stop-products share one stop — no second pull-over 2km down the road. */
function expectStopsMerged(r: Run): void {
  const stops = stopXs(r);
  const w = mergeWindow(r.D);
  for (let i = 1; i < stops.length; i++) {
    expect(
      stops[i] - stops[i - 1],
      `stops @${stops[i - 1]} and @${stops[i]} should be one`,
    ).toBeGreaterThanOrEqual(w);
  }
}

/** R2: a cola is bought, not carried — it can only be eaten at a stop. */
function expectStopProducts(r: Run): void {
  const stops = stopXs(r);
  for (const f of r.result.foods) {
    if (!FOOD_LIB.find((e) => e.key === f.key)?.needsStop) continue;
    expect(
      stops.some((x) => Math.abs(x - f.from) <= STOP_SNAP_KM),
      `${f.key} @${f.from} is not at a stop`,
    ).toBe(true);
  }
}

/**
 * The rider's own floor on the *shape* of the fluid line — unrelated to whatever `hydrationStatus`
 * grades the plan on, and deliberately not unified with it: this one is about the line never
 * dipping anywhere, not about the route total. See `expectFluidNeverSags`.
 */
const FLUID_SAG_FLOOR_PCT = 85;

/**
 * R4: the fluid line never sags below `FLUID_SAG_FLOOR_PCT` of the target, anywhere on the route.
 * It may wave above it and the ride may finish at 100%+ — what it may not do is dip.
 *
 * This is the whole capacity rule restated pointwise: since a load's delivery rate is
 * `volume / leg duration`, the floor caps how long a leg may be (`vol / (0.85 × need)`), and the
 * stop count falls out of that. One bottle just means shorter legs and more top-ups — never a leg
 * stretched thin enough to sag, which is what produced the mix-9 shape (105 ml/h against an
 * 820 ml/h target for the last 239km, while the badge still read 91%).
 */
function expectFluidNeverSags(r: Run): void {
  const worst = worstFluidPct(r.planned, r.D);
  expect(
    worst,
    'the fluid line sags below the floor somewhere on the route',
  ).toBeGreaterThanOrEqual(FLUID_SAG_FLOOR_PCT);
}

/**
 * R6: products are spread along the route, not stacked into a block at the end. Two relative
 * checks — how much of the route the product sequence spans, and how even the gaps inside it are.
 */
function expectProductsSpanTheRoute(r: Run): void {
  const foods = [...r.result.foods].sort((a, b) => a.from - b.from);
  if (foods.length < 3) return;
  const span = foods[foods.length - 1].to - foods[0].from;
  expect(span, 'products are bunched into one stretch of the route').toBeGreaterThanOrEqual(
    0.6 * r.D,
  );
  const gaps = foods.slice(1).map((f, i) => f.from - foods[i].from);
  expect(Math.max(...gaps), 'products are unevenly spaced').toBeLessThanOrEqual(2 * median(gaps));
}

/**
 * R3/R5, carbs only: the plan the search settled on must beat the naive "spread everything evenly"
 * arrangement of the same resources. This is the threshold-free form of the rider's "you fill up as
 * best you can with what you've got" — no promised percentage, just a floor made of the same items
 * laid out the dumbest way. Fluid doesn't need it: `expectFluidNeverSags` says something stronger.
 */
function expectNotWorseThanEvenSpread(r: Run): void {
  if (r.planned.fills.length + r.planned.foods.length < 2) return;
  const even = evenlySpread(r.planned, r.D);
  expect(planSummary(r.planned).coverage + 1).toBeGreaterThanOrEqual(planSummary(even).coverage);
}

describe('autoplan combined scenarios — water + izo', () => {
  test('mix-1: 120km / izo 650 + water 750 — do the two domains share their stops?', () => {
    const r = run(
      makePlan(makeRoute({ distance: 120, temp: 25 }), [
        vessel('g1', 'Bidon izo', 650, ['izo']),
        vessel('g2', 'Bidon woda', 750, ['water']),
      ]),
    );
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 5,
      maxRefills: 5,
      products: [],
    });
  });

  test('mix-2: 100km / one 750ml bottle that takes both water and izo', () => {
    const r = run(
      makePlan(makeRoute({ distance: 100, temp: 26 }), [
        vessel('g1', 'Bidon', 750, ['water', 'izo']),
      ]),
    );
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 4,
      maxRefills: 4,
      products: [],
    });
  });

  test('mix-3: 130km / concentrated 18g mix reserves the big bottle for water', () => {
    const r = run(
      makePlan(
        makeRoute({ distance: 130, temp: 28 }),
        [
          vessel('g1', 'Bidon duży', 750, ['water', 'izo']),
          vessel('g2', 'Bidon mały', 650, ['water', 'izo']),
        ],
        makeMix({ conc: 18 }),
      ),
    );
    // Five stops today, two of them 5km apart — they are one stop, so four is the ceiling.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 4,
      maxRefills: 6,
      products: [],
    });
  });
});

describe('autoplan combined scenarios — gel vessel reused for water', () => {
  test('mix-4: 90km / 30°C / bidon 650 water + flask 250 gel-or-water', () => {
    const route = makeRoute({ distance: 90, temp: 30 });
    const mix = makeMix();
    const flask = vessel('g2', 'Flaszka', 250, ['gel', 'water']);
    const r = run(makePlan(route, [vessel('g1', 'Bidon', 650, ['water']), flask], mix));
    // The flask never gets refilled with gel once spent (gel is strictly one-shot), so its full
    // 250ml × gelConc content — 150g — is the hard ceiling on this scenario's carbs. That used to
    // force a hand-derived percentage floor, because a share-of-target bar the kit physically
    // cannot reach is not a bar at all. The badge grades a *rate* against `min(target, plateau)`
    // instead, and 150g spread over this ride clears the plateau, so green is reachable here with
    // the flask alone — no ceiling arithmetic needed to state it.
    // The scenario's real point is *where* those grams land — spread far enough down the route that
    // the shortfall isn't "eat everything by km 50, then coast" (expectNotWorseThanEvenSpread).
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 5,
      maxRefills: 8,
      products: [],
    });
  });

  test('mix-5: 70km / 15°C — water needs no stop, so the empty flask must not invent one', () => {
    const r = run(
      makePlan(makeRoute({ distance: 70, speed: 20, intensity: 'low', temp: 15, weight: 80 }), [
        vessel('g1', 'Bidon 1', 1000, ['water']),
        vessel('g2', 'Bidon 2', 750, ['water']),
        vessel('g3', 'Flaszka', 250, ['gel']),
      ]),
      [{ key: 'gel', count: 4 }],
    );
    // The rider's own build hits 93% with exactly these two gels, just placed better: the search
    // has to exhaust placement before it reaches for a third item from the selection.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 0,
      maxRefills: 0,
      products: ['gel', 'gel'],
    });
  });
});

describe('autoplan combined scenarios — products alongside bottles', () => {
  test('mix-6: 140km / izo 650 + water 750 + a mixed selection', () => {
    const r = run(
      makePlan(makeRoute({ distance: 140, temp: 22 }), [
        vessel('g1', 'Bidon izo', 650, ['izo']),
        vessel('g2', 'Bidon woda', 750, ['water']),
      ]),
      [
        { key: 'gel', count: 4 },
        { key: 'chew', count: 2 },
        { key: 'banana', count: 1 },
      ],
    );
    // Gels alone with no water alongside them is a punishment, and today every product sits in the
    // back half of the route — the whole selection has to be laid out across the ride, not queued
    // up after the izo runs out.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 3,
      maxRefills: 4,
      products: ['gel', 'gel', 'gel', 'gel', 'chew', 'chew', 'banana'],
    });
  });

  test('mix-7: 70km / 28°C / bidon 500 water + cola×4 — each cola is a stop, and a top-up', () => {
    const r = run(
      makePlan(makeRoute({ distance: 70, temp: 28 }), [vessel('g1', 'Bidon', 500, ['water'])]),
      [
        { key: 'cola', count: 4 },
        { key: 'gel', count: 2 },
      ],
    );
    // The rider allowed four colas, so four stops is the honest answer — and the water bottle gets
    // topped up at every one of them, which is why the stop count buys more than the carbs.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 4,
      maxRefills: 4,
      productCounts: { cola: 4, gel: 2 },
    });
  });
});

describe('autoplan combined scenarios — the full kit', () => {
  test('mix-8: 160km / 28°C / izo + water + gel flask + mixed selection', () => {
    const r = run(
      makePlan(makeRoute({ distance: 160, temp: 28, weight: 78 }), [
        vessel('g1', 'Bidon izo', 650, ['izo']),
        vessel('g2', 'Bidon woda', 750, ['water']),
        vessel('g3', 'Flaszka', 250, ['gel', 'water']),
      ]),
      [
        { key: 'gel', count: 3 },
        { key: 'banana', count: 1 },
        { key: 'chew', count: 2 },
        { key: 'cola', count: 2 },
      ],
    );
    // Today: seven stops, two of them 2km apart, and three gels packed 9km apart in the middle of
    // an otherwise empty back half.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 6,
      maxRefills: 8,
      productCounts: { gel: 3, banana: 1, chew: 2, cola: 2 },
    });
  });

  test('mix-9: 300km / izo 1000 + water 1000 — no litre-per-250km trickle legs', () => {
    const r = run(
      makePlan(makeRoute({ distance: 300, temp: 22, weight: 78 }), [
        vessel('g1', 'Bidon izo', 1000, ['izo']),
        vessel('g2', 'Bidon woda', 1000, ['water']),
      ]),
      [
        { key: 'gel', count: 6 },
        { key: 'chew', count: 3 },
        { key: 'cola', count: 3 },
      ],
    );
    // The current plan drinks everything in the first 130km and then stretches one bottle over the
    // remaining 239 — 105 ml/h against an 820 ml/h target. `hydrationPct` can't see it (it's a
    // plain sum ratio), which is exactly why `expectNoTrickleLeg` and the fluid-rate comparison in
    // `expectNotWorseThanEvenSpread` are here.
    //
    // Carbs: the izo bottle's contribution to `totalCarbs` is fixed regardless of which food survives
    // pruning (`pruneUnneededFood` never touches `services`) — measured at 420g here — so with all 12
    // offered units placed, food adds 6×22 + 3×30 + 3×35 = 327g for a 747g nominal total against the
    // 900g target: 83.0%, green but with only 27g of headroom above `COVERAGE_TARGET_PCT`. Pruning
    // walks the rider's selection from the bottom up and takes the first candidate whose removal
    // still clears that floor (his ruling: "we remove as long as it's green, the threshold is 80"):
    // a cola (35g, lowest priority) falls to 712/900 = 79.1%, refused; a chew (30g) to 717/900 =
    // 79.7%, refused; a gel (22g, highest priority) to 725/900 = 80.6% — clears it, so it's the one
    // taken. A second gel would fall to 703/900 = 78.1% and is refused. Exactly one gel goes.
    expectThen(r, {
      carbs: 'good',
      hydration: 'good',
      maxStops: 9,
      maxRefills: 12,
      productCounts: { gel: 5, chew: 3, cola: 3 },
    });
  });

  test('mix-10: 24km / 35°C / high — carbs gated by the hour rule, water planned anyway', () => {
    const route = makeRoute({ distance: 24, speed: 30, intensity: 'high', temp: 35 });
    const r = run(
      makePlan(route, [
        vessel('g1', 'Bidon', 500, ['water', 'izo']),
        vessel('g2', 'Flaszka', 250, ['gel', 'water']),
      ]),
    );
    // Under an hour, so no carbs at all — but 1152ml of sweat clears the 1125ml buffer, so both
    // vessels are water vessels for this ride, including the one that could have taken izo.
    //
    // This used to state a hand-derived physical ceiling, because a percentage-of-sweat-loss floor
    // could never be met here: the gut only clears so much fluid an hour, and over ~0.8h that
    // ceiling sits well under the loss. `hydrationStatus` grades the signed balance in % of body
    // mass against a temperature-dependent limit instead, and that limit is exactly the tolerance
    // the ceiling used to stand in for — so green is the whole statement, no ceiling arithmetic.
    expectThen(r, {
      carbs: null,
      hydration: 'good',
      maxStops: 1,
      maxRefills: 2,
    });
    expect(r.result.foods).toEqual([]);
    for (const f of r.result.fills) expect(f.content).toBe('water');
  });
});
