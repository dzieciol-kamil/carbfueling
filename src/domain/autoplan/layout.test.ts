/**
 * Every expectation here is derived by hand — from `cph()`, `sweat()` and `carbsFill()` on a
 * hand-built kit, never from something `layout()` produced. The routes are all flat (no GPX), so
 * `eff` is linear and a span reduces to the schoolbook arithmetic `spans.test.ts` pins:
 * `carbs / cph × speed` km, `ml / sweat × speed` km.
 *
 * The numbers are chosen so the arithmetic is round. At 25 km/h a ride over 2.5 h is `cph` 75, and
 * a 750 ml bottle of a 20 g/100 ml mix holds 150 g, so one load reaches exactly 50 km — which makes
 * a 200 km route exactly four loads long and every boundary a whole number.
 */
import { describe, expect, test } from 'vitest';
import { carbsFill, cph, dist, sweat } from '../fuel';
import { DEFAULT_MIX } from '../types';
import type {
  Content,
  Fill,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  Vessel,
} from '../types';
import { layout, mergeWindowKm } from './layout';
import type { VesselAssignment } from './layout';
import type { DraftFill, DraftFood } from './types';

function makeRoute(o: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 200,
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

/** 20 g/100 ml izo: a 750 ml bottle then holds 150 g, which is exactly 50 km of a 75 g/h ride. */
function makeMix(o: Partial<MixSettings> = {}): MixSettings {
  return { ...DEFAULT_MIX, conc: 20, ...o };
}

function vessel(gid: string, vol: number, allowed: Content[], gelParts = 1): Vessel {
  return { gid, name: gid, vol, allowed, gelParts };
}

function makeState(route: RouteInput, gear: Vessel[], foodLib: FoodLibEntry[] = []): PlanState {
  return { route, mix: makeMix(), gear, fills: [], foods: [], foodLib };
}

/** What `fuel.ts` says is in this vessel when it is filled with `content` — read from `carbsFill`,
 *  never from a literal, so a change to how a bottle's carbs are computed reaches these tests. */
function carbsIn(state: PlanState, gid: string, content: Content): number {
  const probe: Fill = { fid: 0, gid, content, from: 0, to: 0 };
  return carbsFill(probe, state.gear, state.mix);
}

/** The flat-route span of a carb load, straight from the need line's own definition. */
const carbSpan = (route: RouteInput, carbs: number) => (carbs / cph(route)) * route.speed;
/** The same for fluid, against the sweat rate. */
const waterSpan = (route: RouteInput, ml: number) => (ml / sweat(route)) * route.speed;

const of = (fills: DraftFill[], content: Content) => fills.filter((f) => f.content === content);
/** Same as `toEqual` on a fill list, but tolerant in the two numbers — for the routes whose length
 *  is not a whole multiple of the profile's 160 samples, where the inversion lands a few ulps off a
 *  round kilometre. Used only where an exact comparison was measured to be noise-sensitive. */
function expectFillsClose(actual: DraftFill[], expected: DraftFill[]): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((f, i) => {
    expect(f.gid).toBe(expected[i].gid);
    expect(f.content).toBe(expected[i].content);
    expect(f.from).toBeCloseTo(expected[i].from, 9);
    expect(f.to).toBeCloseTo(expected[i].to, 9);
  });
}
const froms = (fills: DraftFill[]) => fills.map((f) => f.from);
const stopXs = (stops: { at: number }[]) => stops.map((s) => s.at);

/**
 * The correspondence both scenario suites check, asserted here on `layout`'s own output: every
 * refill (a fill whose vessel has an earlier one, in ride order) starts exactly at a stop, and
 * every stop is either a refill or a `needsStop` product.
 */
function expectStopsMatchRefills(
  fills: DraftFill[],
  stops: { at: number }[],
  productStops: number[] = [],
): void {
  const seen = new Set<string>();
  const refillStarts: number[] = [];
  for (const f of [...fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) refillStarts.push(f.from);
    else seen.add(f.gid);
  }
  for (const x of refillStarts) {
    expect(stopXs(stops), `refill @${x} has no stop`).toContain(x);
  }
  for (const s of stopXs(stops)) {
    const served = refillStarts.includes(s) || productStops.includes(s);
    expect(served, `stop @${s} serves nothing`).toBe(true);
  }
}

/** A stream is a chain: it starts at km 0, each fill begins where the last ended, and nothing
 *  reaches past the finish. */
function expectTiled(fills: DraftFill[], D: number): void {
  expect(fills.length).toBeGreaterThan(0);
  expect(fills[0].from).toBe(0);
  for (let i = 0; i < fills.length; i++) {
    expect(fills[i].to).toBeGreaterThan(fills[i].from);
    expect(fills[i].to).toBeLessThanOrEqual(D);
    if (i > 0) expect(fills[i].from).toBeCloseTo(fills[i - 1].to, 9);
  }
}

describe("the owner's zero-stop example", () => {
  /**
   * *"2 izo bottles + a gel flask + a bladder covers 100 km with zero stops"* — because every
   * content needs at most as many loads as it has vessels, and the first pass over a stream's
   * vessels is all handovers, which are free.
   *
   * 100 km at 25 km/h is 4 h, so `cph` is 75 and the ride wants 300 g. Two 750 ml bottles of the
   * 20 g/100 ml mix hold 150 g each: 50 km apiece, 100 km together, exactly the route.
   */
  const route = makeRoute({ distance: 100 });
  const gear = [
    vessel('b1', 750, ['izo', 'water']),
    vessel('b2', 750, ['izo', 'water']),
    vessel('flask', 250, ['gel', 'water']),
    vessel('bladder', 2000, ['water']),
  ];
  const state = makeState(route, gear);
  const assignment: VesselAssignment[] = [
    { gid: 'b1', content: 'izo', loads: 1 },
    { gid: 'b2', content: 'izo', loads: 1 },
    { gid: 'flask', content: 'gel', loads: 1 },
    { gid: 'bladder', content: 'water', loads: 1 },
  ];

  test('the kit is the one the example describes', () => {
    // Guards the fixture: if either of these stops being true the assertions below stop meaning
    // what they say.
    expect(carbsIn(state, 'b1', 'izo')).toBe(150);
    expect(carbSpan(route, 150)).toBe(50);
    expect(dist(route)).toBe(100);
  });

  test('no stop at all', () => {
    expect(layout(state, assignment, []).stops).toEqual([]);
  });

  test('the izo bottles hand over contiguously from 0 to the finish', () => {
    const izo = of(layout(state, assignment, []).fills, 'izo');
    expect(izo).toEqual([
      { gid: 'b1', content: 'izo', from: 0, to: 50 },
      { gid: 'b2', content: 'izo', from: 50, to: 100 },
    ]);
  });

  test('each stream tiles from km 0 in parallel with the others', () => {
    const { fills } = layout(state, assignment, []);
    // The flask holds 250 ml of a 60 g/100 ml gel — 150 g, the same 50 km as a bottle.
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    expect(of(fills, 'gel')).toEqual([{ gid: 'flask', content: 'gel', from: 0, to: 50 }]);
    // 700 ml/h of sweat over 4 h is 2800 ml, so a 2000 ml bladder covers 2000/700 × 25 km and
    // legitimately runs out before the line — which costs nothing, since it buys no refill.
    expect(sweat(route)).toBe(700);
    const water = of(fills, 'water');
    expect(water).toHaveLength(1);
    expect(water[0].gid).toBe('bladder');
    expect(water[0].from).toBe(0);
    expect(water[0].to).toBeCloseTo(waterSpan(route, 2000), 9);
  });

  test('the spent flask gets no water, because there is no stop to get it at', () => {
    // Rule 5 in its negative direction: the flask is empty from km 50 and would happily take
    // water, but a bottle earning its keep that way must not buy a stop to do it.
    const { fills, stops } = layout(state, assignment, []);
    expect(stops).toEqual([]);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
  });
});

describe('the first refill is the first stop', () => {
  /**
   * Three loads over two bottles: the first pass (`a` then `b`) is two home loads and costs
   * nothing; the wrap back onto `a` is the first refill, and that is where the rider pulls over.
   */
  const route = makeRoute({ distance: 150 });
  const gear = [vessel('a', 750, ['izo', 'water']), vessel('b', 750, ['izo', 'water'])];
  const state = makeState(route, gear);
  const assignment: VesselAssignment[] = [
    { gid: 'a', content: 'izo', loads: 2 },
    { gid: 'b', content: 'izo', loads: 1 },
  ];

  test('one stop, at the third load’s start', () => {
    const { fills, stops } = layout(state, assignment, []);
    const izo = of(fills, 'izo');
    expectFillsClose(izo, [
      { gid: 'a', content: 'izo', from: 0, to: 50 },
      { gid: 'b', content: 'izo', from: 50, to: 100 },
      { gid: 'a', content: 'izo', from: 100, to: 150 },
    ]);
    expect(stops).toHaveLength(1);
    // Two loads' worth of riding, and — the same statement from the other side — exactly where the
    // third load begins.
    expect(stops[0].at).toBeCloseTo(2 * carbSpan(route, carbsIn(state, 'a', 'izo')), 9);
    expect(stops[0].at).toBe(izo[2].from);
  });

  test('the handover at km 50 is free — it is not a stop', () => {
    const { stops } = layout(state, assignment, []);
    expect(stopXs(stops)).not.toContain(50);
  });

  test('and b, empty from km 100, is topped up with water at that same stop', () => {
    // Rule 2: one stop tops up every bottle at once. `a` is refilled with izo, `b` with water.
    const { fills } = layout(state, assignment, []);
    const bWater = fills.filter((f) => f.gid === 'b' && f.content === 'water');
    expect(bWater).toHaveLength(1);
    expect(bWater[0].from).toBeCloseTo(100, 9);
    expect(bWater[0].to).toBeCloseTo(100 + waterSpan(route, 750), 9);
  });
});

describe('stops = max(0, L - V)', () => {
  /**
   * A 200 km route at 25 km/h is 8 h, so 600 g at `cph` 75 — exactly four 150 g loads, each
   * reaching 50 km. Every case below therefore places all `L` of its loads inside the route (the
   * test asserts it), which is the precondition the formula needs.
   */
  const route = makeRoute();
  const gear = ['a', 'b', 'c', 'd'].map((g) => vessel(g, 750, ['izo', 'water']));
  const state = makeState(route, gear);

  test('the fixture is four loads long', () => {
    expect(dist(route)).toBe(200);
    expect(carbSpan(route, carbsIn(state, 'a', 'izo'))).toBe(50);
  });

  const cases: [label: string, loads: number[]][] = [
    ['1 load / 1 vessel', [1]],
    ['2 loads / 1 vessel', [2]],
    ['3 loads / 1 vessel', [3]],
    ['4 loads / 1 vessel', [4]],
    ['2 loads / 2 vessels', [1, 1]],
    ['3 loads / 2 vessels', [2, 1]],
    ['4 loads / 2 vessels', [2, 2]],
    ['3 loads / 3 vessels', [1, 1, 1]],
    ['4 loads / 3 vessels', [2, 1, 1]],
    ['4 loads / 4 vessels', [1, 1, 1, 1]],
  ];

  test.each(cases)('%s', (_label, loads) => {
    const assignment: VesselAssignment[] = loads.map((n, i) => ({
      gid: gear[i].gid,
      content: 'izo',
      loads: n,
    }));
    const L = loads.reduce((a, b) => a + b, 0);
    const V = loads.length;
    const { fills, stops } = layout(state, assignment, []);
    // Every assigned load was actually planned — otherwise the formula is being tested against a
    // truncated stream (see the next describe).
    expect(of(fills, 'izo')).toHaveLength(L);
    expect(stops).toHaveLength(Math.max(0, L - V));
    expectStopsMatchRefills(fills, stops);
  });
});

describe('a load past the finish line is not planned', () => {
  /**
   * Where the "≈" in `stops ≈ max(0, L − V)` lives. Nothing is delivered on the finish line, so a
   * fifth load on a route four loads long has nowhere to go — and the stop it would have bought
   * does not exist either.
   */
  const route = makeRoute();
  const state = makeState(route, [vessel('a', 750, ['izo', 'water'])]);

  test('five loads over a four-load route give four fills and three stops', () => {
    const { fills, stops } = layout(state, [{ gid: 'a', content: 'izo', loads: 5 }], []);
    const izo = of(fills, 'izo');
    expect(izo).toHaveLength(4);
    expect(froms(izo)).toEqual([0, 50, 100, 150]);
    expect(izo[3].to).toBe(dist(route));
    expect(stopXs(stops)).toEqual([50, 100, 150]);
  });
});

describe('streams tile the route independently and in parallel', () => {
  /**
   * Izo, gel and water are drunk at the same time, so each starts again at km 0 rather than
   * queueing behind the one before it.
   *
   * The carb vessels here are deliberately not allowed to hold water, so rule 5 cannot add a
   * top-up and every `water` fill in the result belongs to the water stream itself.
   */
  const route = makeRoute();
  const gear = [
    vessel('a', 750, ['izo']),
    vessel('flask', 250, ['gel']),
    vessel('bladder', 1000, ['water']),
  ];
  const state = makeState(route, gear);
  const assignment: VesselAssignment[] = [
    { gid: 'a', content: 'izo', loads: 2 },
    { gid: 'flask', content: 'gel', loads: 2 },
    { gid: 'bladder', content: 'water', loads: 3 },
  ];

  test('each stream is a contiguous chain from km 0, none of it past the finish', () => {
    const { fills } = layout(state, assignment, []);
    for (const c of ['izo', 'gel', 'water'] as Content[]) expectTiled(of(fills, c), dist(route));
  });

  test('the two carb streams overlap, because they are drunk together', () => {
    const { fills } = layout(state, assignment, []);
    expect(froms(of(fills, 'izo'))).toEqual([0, 50]);
    // The flask's 150 g of gel is the same 50 km as a bottle's 150 g of izo, so the gel stream sits
    // exactly on top of the izo one rather than after it.
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    expect(froms(of(fills, 'gel'))).toEqual([0, 50]);
  });

  test('and the water stream runs on its own clock', () => {
    const { fills, stops } = layout(state, assignment, []);
    const step = waterSpan(route, 1000);
    const water = of(fills, 'water');
    expect(water).toHaveLength(3);
    water.forEach((f, i) => expect(f.from).toBeCloseTo(i * step, 9));
    // izo and gel both refill at 50; water refills at ~35.7 and ~71.4, both further than the 10 km
    // window from it, so the plan needs three stops.
    expect(mergeWindowKm(dist(route))).toBe(10);
    expect(stops).toHaveLength(3);
    expect(stopXs(stops)[1]).toBe(50);
    expectStopsMatchRefills(fills, stops);
  });
});

describe('merging nearby stops', () => {
  const route = makeRoute();
  const D = dist(route);

  test('the window is the suite’s own: min(10 km, 20% of D)', () => {
    expect(mergeWindowKm(200)).toBe(10);
    expect(mergeWindowKm(30)).toBe(6);
  });

  /**
   * A water vessel of 1260 ml covers 1260/700 × 25 = 45 km, so its refill lands 5 km before the
   * izo bottle's at 50 — inside the window. One stop, at the earlier of the two, and the izo
   * boundary moves back onto it.
   */
  test('two refills inside the window become one stop, and the fills move with it', () => {
    const gear = [vessel('a', 750, ['izo']), vessel('w', 1260, ['water'])];
    const state = makeState(route, gear);
    expect(waterSpan(route, 1260)).toBe(45);

    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    expect(stops).toEqual([{ at: 45 }]);
    // The izo refill was computed at 50 and is pulled back to 45; its `to` stays where the tiling
    // put it, so the move is absorbed by the two fills either side rather than re-tiling the rest.
    expect(of(fills, 'izo')).toEqual([
      { gid: 'a', content: 'izo', from: 0, to: 45 },
      { gid: 'a', content: 'izo', from: 45, to: 100 },
    ]);
    expect(of(fills, 'water')).toEqual([
      { gid: 'w', content: 'water', from: 0, to: 45 },
      { gid: 'w', content: 'water', from: 45, to: 90 },
    ]);
    for (const c of ['izo', 'water'] as Content[]) expectTiled(of(fills, c), D);
    expectStopsMatchRefills(fills, stops);
  });

  test('two refills further apart than the window stay two stops', () => {
    // 1000 ml of water covers ~35.7 km, which is 14.3 km short of the izo refill at 50.
    const gear = [vessel('a', 750, ['izo']), vessel('w', 1000, ['water'])];
    const state = makeState(route, gear);
    expect(50 - waterSpan(route, 1000)).toBeGreaterThan(mergeWindowKm(D));

    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    expect(stops).toHaveLength(2);
    expect(stopXs(stops)[0]).toBeCloseTo(waterSpan(route, 1000), 9);
    expect(stopXs(stops)[1]).toBe(50);
    for (const c of ['izo', 'water'] as Content[]) expectTiled(of(fills, c), D);
    expectStopsMatchRefills(fills, stops);
  });

  /**
   * Two refills of the *same* vessel inside one window: a 100 ml bottle of the 20 g/100 ml mix
   * holds 20 g, which is 6⅔ km, so loads two and three both want a stop within 10 km of each
   * other. They become one stop — and one of the two loads is dropped, which is not a rounding
   * artefact but the truth of it: at a single stop you can fill a bottle once.
   */
  test('two refills of one vessel inside the window collapse into a single load', () => {
    const state = makeState(route, [vessel('a', 100, ['izo'])]);
    const step = carbSpan(route, carbsIn(state, 'a', 'izo'));
    expect(step).toBeCloseTo(20 / 3, 9);
    // The gap between the two refills — at `step` and at `2 × step` — is one step, inside the window.
    expect(step).toBeLessThan(mergeWindowKm(D));

    const { fills, stops } = layout(state, [{ gid: 'a', content: 'izo', loads: 3 }], []);
    expect(fills).toHaveLength(2);
    expect(fills[0].from).toBe(0);
    expect(fills[0].to).toBeCloseTo(step, 9);
    expect(fills[1].from).toBeCloseTo(step, 9);
    expect(fills[1].to).toBeCloseTo(3 * step, 9);
    expect(stops).toHaveLength(1);
    expect(stopXs(stops)[0]).toBeCloseTo(step, 9);
    expectTiled(fills, D);
    expectStopsMatchRefills(fills, stops);
  });
});

describe('needsStop products', () => {
  const FOOD_LIB: FoodLibEntry[] = [
    { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
    { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
  ];
  const route = makeRoute();
  const state = makeState(route, [vessel('a', 750, ['izo'])], FOOD_LIB);
  const assignment: VesselAssignment[] = [{ gid: 'a', content: 'izo', loads: 2 }];
  const food = (key: string, from: number): DraftFood => ({ key, carbs: 35, from, to: from });

  test('a product you buy is a stop; one you carried is not', () => {
    const carried = layout(state, [], [food('banana', 47)]);
    expect(carried.stops).toEqual([]);
    const bought = layout(state, [], [food('cola', 47)]);
    expect(bought.stops).toEqual([{ at: 47 }]);
  });

  test('a refill near one is pulled onto it, because the product cannot move', () => {
    // The cola is bought at km 47 and the izo refill was computed at 50 — 3 km apart, inside the
    // window. The product's position is the caller's and comes back untouched, so the boundary is
    // the one that gives way.
    const foods = [food('cola', 47)];
    const { fills, stops } = layout(state, assignment, foods);
    expect(stops).toEqual([{ at: 47 }]);
    expect(of(fills, 'izo')).toEqual([
      { gid: 'a', content: 'izo', from: 0, to: 47 },
      { gid: 'a', content: 'izo', from: 47, to: 100 },
    ]);
    expectStopsMatchRefills(fills, stops, [47]);
  });

  test('one further away than the window keeps its own stop', () => {
    const { fills, stops } = layout(state, assignment, [food('cola', 65)]);
    expect(stopXs(stops)).toEqual([50, 65]);
    expect(froms(of(fills, 'izo'))).toEqual([0, 50]);
    expectStopsMatchRefills(fills, stops, [65]);
  });

  test('foods come back out exactly as they went in', () => {
    const foods = [food('cola', 47), food('banana', 120)];
    expect(layout(state, assignment, foods).foods).toBe(foods);
  });
});

describe('a spent vessel takes water at a stop that already exists', () => {
  /**
   * Rule 5. The gel flask is empty from km 50; the izo bottle's refill puts a stop there anyway,
   * so the flask rides on as a water bottle for free. It must never be the reason a stop exists.
   */
  const route = makeRoute();
  const gear = [vessel('a', 750, ['izo', 'water']), vessel('flask', 250, ['gel', 'water'])];
  const state = makeState(route, gear);

  test('it does, when the plan already stops where the vessel is empty', () => {
    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'flask', content: 'gel', loads: 1 },
      ],
      [],
    );
    expect(stops).toEqual([{ at: 50 }]);
    const topUp = fills.filter((f) => f.gid === 'flask' && f.content === 'water');
    expect(topUp).toHaveLength(1);
    expect(topUp[0].from).toBe(50);
    expect(topUp[0].to).toBeCloseTo(50 + waterSpan(route, 250), 9);
    // And it bought nothing: the only stop is the izo refill it happened to coincide with.
    expectStopsMatchRefills(fills, stops);
  });

  test('it does not, when the plan has no stop at all', () => {
    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 1 },
        { gid: 'flask', content: 'gel', loads: 1 },
      ],
      [],
    );
    expect(stops).toEqual([]);
    expect(fills.filter((f) => f.content === 'water')).toHaveLength(0);
  });

  test('nor into a vessel that may not hold water', () => {
    const dry = makeState(route, [
      vessel('a', 750, ['izo', 'water']),
      vessel('flask', 250, ['gel']),
    ]);
    const { fills } = layout(
      dry,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'flask', content: 'gel', loads: 1 },
      ],
      [],
    );
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
  });

  test('nor at a stop it reaches while still carrying carbs', () => {
    // The flask's gel lasts to km 100, past the stop at 50, so there is nothing to top up there.
    const big = makeState(route, [
      vessel('a', 750, ['izo', 'water']),
      vessel('flask', 500, ['gel', 'water']),
    ]);
    const { fills, stops } = layout(
      big,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'flask', content: 'gel', loads: 1 },
      ],
      [],
    );
    expect(stops).toEqual([{ at: 50 }]);
    expect(of(fills, 'gel')).toEqual([{ gid: 'flask', content: 'gel', from: 0, to: 100 }]);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
  });
});

describe('illegal assignments throw', () => {
  /**
   * Legality is knowable from `state.gear` alone and cheaply, so an illegal assignment is a bug in
   * the caller, not a datum. Skipping it would hand back a plan that is not the one asked for and
   * let the search score that plan while believing it had measured another.
   */
  const route = makeRoute();
  const state = makeState(route, [
    vessel('a', 750, ['izo', 'water']),
    vessel('bladder', 2000, ['water']),
  ]);

  test('a content the vessel does not allow', () => {
    expect(() => layout(state, [{ gid: 'bladder', content: 'izo', loads: 1 }], [])).toThrow(
      /may not carry izo/,
    );
  });

  test('a vessel that is not in the gear', () => {
    expect(() => layout(state, [{ gid: 'ghost', content: 'water', loads: 1 }], [])).toThrow(
      /not in the gear/,
    );
  });

  test('the same vessel assigned twice', () => {
    expect(() =>
      layout(
        state,
        [
          { gid: 'a', content: 'izo', loads: 1 },
          { gid: 'a', content: 'water', loads: 1 },
        ],
        [],
      ),
    ).toThrow(/assigned twice/);
  });

  test('and nothing is planned when it throws', () => {
    // The check runs over the whole assignment before any tiling, so a bad entry at the end
    // rejects the lot rather than leaving a half-built draft behind.
    expect(() =>
      layout(
        state,
        [
          { gid: 'a', content: 'izo', loads: 2 },
          { gid: 'bladder', content: 'gel', loads: 1 },
        ],
        [],
      ),
    ).toThrow();
  });
});

describe('degenerate inputs', () => {
  test('an empty assignment plans nothing', () => {
    const state = makeState(makeRoute(), [vessel('a', 750, ['izo'])]);
    expect(layout(state, [], [])).toEqual({ fills: [], foods: [], stops: [] });
  });

  test('loads: 0 leaves the vessel at home', () => {
    const state = makeState(makeRoute(), [vessel('a', 750, ['izo']), vessel('b', 750, ['izo'])]);
    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 0 },
        { gid: 'b', content: 'izo', loads: 1 },
      ],
      [],
    );
    expect(fills).toEqual([{ gid: 'b', content: 'izo', from: 0, to: 50 }]);
    expect(stops).toEqual([]);
  });

  test('every vessel at loads: 0 is the same as no assignment', () => {
    const state = makeState(makeRoute(), [vessel('a', 750, ['izo'])]);
    expect(layout(state, [{ gid: 'a', content: 'izo', loads: 0 }], [])).toEqual({
      fills: [],
      foods: [],
      stops: [],
    });
  });

  test('a zero-distance route demands nothing, so one load covers it and the rest are dropped', () => {
    // `dist()` floors at 1 km and `totalHours` is 0, so both need lines are flat at zero and the
    // very first load reaches the finish.
    const route = makeRoute({ distance: 0 });
    const state = makeState(route, [vessel('a', 750, ['izo'])]);
    expect(dist(route)).toBe(1);
    const { fills, stops } = layout(state, [{ gid: 'a', content: 'izo', loads: 3 }], []);
    expect(fills).toEqual([{ gid: 'a', content: 'izo', from: 0, to: 1 }]);
    expect(stops).toEqual([]);
  });

  test('a vessel that holds nothing is skipped without stalling the relay', () => {
    const route = makeRoute();
    const state = makeState(route, [vessel('empty', 0, ['izo']), vessel('b', 750, ['izo'])]);
    const { fills } = layout(
      state,
      [
        { gid: 'empty', content: 'izo', loads: 1 },
        { gid: 'b', content: 'izo', loads: 1 },
      ],
      [],
    );
    expect(fills).toEqual([{ gid: 'b', content: 'izo', from: 0, to: 50 }]);
  });
});
