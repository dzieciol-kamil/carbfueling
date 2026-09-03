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
import { absCap, carbsFill, cph, dist, preRideGut, samples, sweat, totalHours } from '../fuel';
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

function makeState(
  route: RouteInput,
  gear: Vessel[],
  foodLib: FoodLibEntry[] = [],
  mix: MixSettings = makeMix(),
): PlanState {
  return { route, mix, gear, fills: [], foods: [], foodLib };
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

/** The whole ride's fluid loss, from `fuel.ts`'s own two numbers — the total `waterSpan` above is
 *  the flat-route inverse of, since `sweat × hours` millilitres are lost over `speed × hours` km. */
const fluidNeed = (route: RouteInput) => sweat(route) * totalHours(route);
/** What is left for water to cover once the izo on board has poured its own millilitres: izo is
 *  fluid too, so a water vessel is never matched against the whole requirement when izo is there. */
const residualFluid = (route: RouteInput, izoMl: number) => fluidNeed(route) - izoMl;
/** A water load's flat-route span against that residual — the same `delivered / total × D` shape
 *  as `waterSpan`, with the total the izo left behind. */
const waterSpanResidual = (route: RouteInput, ml: number, izoMl: number) =>
  (ml / residualFluid(route, izoMl)) * dist(route);

const of = (fills: DraftFill[], content: Content) => fills.filter((f) => f.content === content);
/** The carb stream, in ride order. izo and gel are one relay, so they are one chain — which is why
 *  neither content on its own is a chain any more. */
const carbStreamOf = (fills: DraftFill[]) =>
  fills.filter((f) => f.content !== 'water').sort((a, b) => a.from - b.from);
/** What the plan's carb fills actually deliver, read through `fuel.ts` rather than added up from
 *  the volumes here. */
const carbsPlanned = (state: PlanState, fills: DraftFill[]) =>
  carbStreamOf(fills).reduce((g, f) => g + carbsFill({ ...f, fid: 0 }, state.gear, state.mix), 0);
/** The ride's whole carb requirement — `samples()`'s own `target`. */
const carbsRequired = (route: RouteInput) => totalHours(route) * cph(route);
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

  test('the two bottles already cover the carbs, so the flask is never poured', () => {
    // Carbs are one need with two sources. 100 km at 75 g/h asks for 300 g and the bottles hold
    // exactly that between them, so the relay is at the finish before the flask's turn comes round.
    // Tiled per content — a full-route stream each — this same kit planned the flask's 150 g on
    // top of the bottles' 300, i.e. 450 g for a 300 g ride.
    const { fills } = layout(state, assignment, []);
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    expect(of(fills, 'gel')).toEqual([]);
    expect(carbsRequired(route)).toBe(300);
    expect(carbsPlanned(state, fills)).toBeCloseTo(carbsRequired(route), 9);
  });

  test('and the bladder is laid out against the fluid the izo does not supply', () => {
    // 700 ml/h over 4 h is 2800 ml lost, of which the two bottles pour 1500 — so 1300 ml is
    // water's to cover, and a 2000 ml bladder more than sees the ride out. Matched against the
    // whole 2800 it was rate-matched down to 2000/700 × 25 = 71.4 km and poured on top of the izo.
    const { fills } = layout(state, assignment, []);
    expect(sweat(route)).toBe(700);
    expect(residualFluid(route, 1500)).toBe(1300);
    const water = of(fills, 'water');
    expect(water).toHaveLength(1);
    expect(water[0].gid).toBe('bladder');
    expect(water[0].from).toBe(0);
    expect(waterSpanResidual(route, 2000, 1500)).toBeGreaterThan(dist(route));
    expect(water[0].to).toBe(dist(route));
    expect(waterSpan(route, 2000)).toBeLessThan(dist(route));
  });

  test('the flask is in no fill at all — not even a water top-up', () => {
    // Rule 5 in its negative direction. Nothing was ever poured into the flask, so it has no carb
    // duty to have finished; and with no stop anywhere on the route there would be nothing to top
    // it up at either, because a bottle earning its keep that way must not buy a stop to do it.
    const { fills, stops } = layout(state, assignment, []);
    expect(stops).toEqual([]);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(0);
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

describe('the carb sources share one requirement', () => {
  /**
   * The case this change exists for. Each source here is a whole ride's worth of carbs on its own:
   * two 750 ml bottles at two loads each are four × 150 g = 600 g, and two 500 ml flasks of the
   * 60 g/100 ml gel are two × 300 g = 600 g. A 200 km ride at 25 km/h is 8 h at 75 g/h, so it asks
   * for 600 g — and tiling each content independently over the whole route planned all six loads,
   * 1200 g, twice what the rider needs. They are two sources of one need, so they share one relay.
   *
   * The vessels are deliberately single-content, so no top-up can add a fill behind the relay's
   * back and every fill below is the relay's own.
   */
  const route = makeRoute();
  const gear = [
    vessel('b1', 750, ['izo']),
    vessel('flask1', 500, ['gel']),
    vessel('b2', 750, ['izo']),
    vessel('flask2', 500, ['gel']),
  ];
  const state = makeState(route, gear);
  const assignment: VesselAssignment[] = [
    { gid: 'b1', content: 'izo', loads: 2 },
    { gid: 'flask1', content: 'gel', loads: 1 },
    { gid: 'b2', content: 'izo', loads: 2 },
    { gid: 'flask2', content: 'gel', loads: 1 },
  ];

  test('the kit is two full rides of carbs, one from each source', () => {
    // Guards the premise: if this stops being true the test below stops being the doubling case.
    expect(carbsIn(state, 'b1', 'izo')).toBe(150);
    expect(carbsIn(state, 'flask1', 'gel')).toBe(300);
    const everyAssignedLoad = 4 * carbsIn(state, 'b1', 'izo') + 2 * carbsIn(state, 'flask1', 'gel');
    expect(carbsRequired(route)).toBe(600);
    expect(everyAssignedLoad).toBe(2 * carbsRequired(route));
  });

  test('the carbs are covered once, by the sum of the sources', () => {
    const { fills } = layout(state, assignment, []);
    expect(carbsPlanned(state, fills)).toBeCloseTo(carbsRequired(route), 9);
    // And explicitly not the two-streams answer: this assertion is the one that used to fail.
    expect(carbsPlanned(state, fills)).toBeLessThan(1.5 * carbsRequired(route));
  });

  test('the relay interleaves izo and gel in rotation order', () => {
    const { fills } = layout(state, assignment, []);
    const stream = carbStreamOf(fills);
    expect(stream.map((f) => f.gid)).toEqual(['b1', 'flask1', 'b2']);
    expect(stream.map((f) => f.content)).toEqual(['izo', 'gel', 'izo']);
    // 150 g reaches 50 km, 300 g reaches 100: the bottle hands over to the flask, the flask to the
    // other bottle, and that last 150 g lands exactly on the line.
    expect(froms(stream)).toEqual([0, 50, 150]);
    expect(stream[2].to).toBe(dist(route));
  });

  test('the carb stream is one contiguous chain, and it costs no stop', () => {
    const { fills, stops } = layout(state, assignment, []);
    expectTiled(carbStreamOf(fills), dist(route));
    // Three vessels, one load each: the whole relay is its first pass, and a first pass is all
    // handovers.
    expect(stops).toEqual([]);
  });

  test('the vessels the relay never reaches are not planned', () => {
    const { fills } = layout(state, assignment, []);
    // `flask2` never gets a turn, and neither bottle's second load does either.
    expect(fills.filter((f) => f.gid === 'flask2')).toHaveLength(0);
    expect(fills.filter((f) => f.gid === 'b1')).toHaveLength(1);
    expect(fills.filter((f) => f.gid === 'b2')).toHaveLength(1);
  });
});

describe('gel is refilled like anything else', () => {
  /**
   * *"albo dobra niech będą też dolewki do żelu"*. `allowed` binds, so a flask declared `['gel']`
   * can be handed nothing but gel — and the owner's ruling is that it is better refilled than left
   * to ride the rest of the route empty. So a gel vessel is an ordinary member of the rotation: it
   * keeps taking turns, and a second turn is a refill that buys a stop just as a bottle's does.
   *
   * The 250 ml flask of the 60 g/100 ml gel holds 150 g, the same 50 km as the bottle, so the two
   * alternate on a four-load route and the four loads land exactly on the ride's 600 g.
   */
  const route = makeRoute();
  const gear = [vessel('a', 750, ['izo']), vessel('flask', 250, ['gel'])];
  const state = makeState(route, gear);

  test('a second load of gel is a refill, and it costs a stop', () => {
    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'flask', content: 'gel', loads: 2 },
      ],
      [],
    );
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    const stream = carbStreamOf(fills);
    expect(stream.map((f) => f.gid)).toEqual(['a', 'flask', 'a', 'flask']);
    expect(stream.map((f) => f.content)).toEqual(['izo', 'gel', 'izo', 'gel']);
    expect(froms(stream)).toEqual([0, 50, 100, 150]);
    // The wrap onto `a` at 100 and the wrap onto the flask at 150 are both refills, and both are
    // stops. The handover at 50 is the flask's home load and is free.
    expect(stopXs(stops)).toEqual([100, 150]);
    expect(stopXs(stops)).not.toContain(50);
    expectTiled(stream, dist(route));
    expectStopsMatchRefills(fills, stops);
  });

  test('and it is still one requirement covered once between the two sources', () => {
    const { fills } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'flask', content: 'gel', loads: 2 },
      ],
      [],
    );
    expect(carbsPlanned(state, fills)).toBeCloseTo(carbsRequired(route), 9);
  });

  test('the relay keeps coming back to the flask for as many loads as it was given', () => {
    // One bottle and three loads of gel: the bottle takes its single turn, and the flask takes the
    // three remaining passes — two of them refills, two stops.
    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 1 },
        { gid: 'flask', content: 'gel', loads: 3 },
      ],
      [],
    );
    expect(froms(of(fills, 'gel'))).toEqual([50, 100, 150]);
    expect(stopXs(stops)).toEqual([100, 150]);
    expectStopsMatchRefills(fills, stops);
  });
});

describe('water is matched against what the izo does not supply', () => {
  /**
   * izo pours fluid as well as carbs, so the water vessels cover the sweat loss the izo leaves
   * behind, not the whole of it. A 200 km ride at 25 km/h is 8 h at 700 ml/h — 5600 ml.
   */
  const route = makeRoute();
  const D = dist(route);

  /**
   * Read off the *first* of two loads, not the only one: the last load of a water stream is
   * rationed out to the finish (see 'the water stream is rationed to the finish' below), so it no
   * longer says anything about the need line it was matched against. Every load before it does.
   */
  test('the same bottle goes further when there is izo on board', () => {
    const dry = makeState(route, [vessel('w', 900, ['water'])]);
    const alone = layout(dry, [{ gid: 'w', content: 'water', loads: 2 }], []);

    const wet = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 900, ['water'])]);
    const withIzo = layout(
      wet,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    // On its own the bottle is rate-matched against all 5600 ml: 900/5600 × 200 = 32.1 km.
    expect(of(alone.fills, 'water')[0].to).toBeCloseTo(waterSpan(route, 900), 9);
    expect(waterSpan(route, 900)).toBeCloseTo((900 / 5600) * D, 9);
    // With two 750 ml loads of izo also being drunk, only 4100 ml is water's to cover, so the same
    // 900 ml is thinner on the need line and stretches to 43.9 km.
    expect(of(withIzo.fills, 'water')[0].to).toBeCloseTo(waterSpanResidual(route, 900, 1500), 9);
    expect(waterSpanResidual(route, 900, 1500)).toBeCloseTo((900 / 4100) * D, 9);
    expect(of(withIzo.fills, 'water')[0].to).toBeGreaterThan(of(alone.fills, 'water')[0].to);
  });

  test('and it still starts again at km 0, alongside the carb stream', () => {
    // The two needs are drunk at the same time. Sharing a total is not queueing behind one.
    const state = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 900, ['water'])]);
    const { fills } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 1 },
      ],
      [],
    );
    expectTiled(carbStreamOf(fills), D);
    expectTiled(of(fills, 'water'), D);
  });

  test('a load that fell past the finish line pours nothing into the residual', () => {
    // Five izo loads on a four-load route: the fifth is never planned, so the residual is 5600 less
    // four bottles' 3000 ml, not five bottles' 3750. 650 ml of the 2600 ml left is exactly 50 km;
    // counting the load that never happened would have made it 70.3.
    const state = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 650, ['water'])]);
    const { fills } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 5 },
        // Two loads, so the one the residual is read off is not the stream's last — that one is
        // rationed to the finish and no longer reports the line it was matched against.
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );
    expect(of(fills, 'izo')).toHaveLength(4);
    expect(residualFluid(route, 4 * 750)).toBe(2600);
    expect(waterSpanResidual(route, 650, 4 * 750)).toBe(50);
    expect(of(fills, 'water')[0].to).toBeCloseTo(50, 9);
    expect(waterSpanResidual(route, 650, 5 * 750)).toBeGreaterThan(70);
  });

  test('a residual of zero or less means the water vessels get no fills, and no throw', () => {
    // A 10 g/100 ml mix in a 3 litre bladder is 300 g — half the ride's carbs — so two loads cover
    // the carbs and pour 6000 ml, which is more fluid than the ride loses. There is nothing left
    // for water to be matched against, and no fills is the honest answer rather than an error.
    const state = makeState(
      route,
      [vessel('a', 3000, ['izo']), vessel('w', 1500, ['water'])],
      [],
      makeMix({ conc: 10 }),
    );
    const assignment: VesselAssignment[] = [
      { gid: 'a', content: 'izo', loads: 2 },
      { gid: 'w', content: 'water', loads: 2 },
    ];
    expect(carbsIn(state, 'a', 'izo')).toBe(300);
    expect(residualFluid(route, 2 * 3000)).toBe(-400);

    expect(() => layout(state, assignment, [])).not.toThrow();
    const { fills } = layout(state, assignment, []);
    expect(of(fills, 'water')).toHaveLength(0);
    expect(froms(of(fills, 'izo'))).toEqual([0, 100]);
  });
});

describe('where a stream ends', () => {
  const route = makeRoute();
  const D = dist(route);

  /**
   * *"Woda do końca."* Rate-matching is the right span for a load that hands over to another one and
   * the wrong one for the last load of a stream, because there is nothing after it — a bottle
   * holding less than the ride demands is rationed across the route, not drunk out early.
   *
   * The arithmetic: this ride sweats 5600 ml, so 900 ml is rate-matched to 900/5600 × 200 = 32.14 km.
   * That is where the *first* of two loads ends, and it is where a single load used to end, leaving
   * the rider 168 km with an empty bidon.
   */
  test('the water stream is rationed to the finish', () => {
    const state = makeState(route, [vessel('w', 900, ['water'])]);
    expect(waterSpan(route, 900)).toBeCloseTo(32.142857142857146, 9);

    const one = layout(state, [{ gid: 'w', content: 'water', loads: 1 }], []);
    expectFillsClose(one.fills, [{ gid: 'w', content: 'water', from: 0, to: D }]);

    const two = layout(state, [{ gid: 'w', content: 'water', loads: 2 }], []);
    expectFillsClose(two.fills, [
      { gid: 'w', content: 'water', from: 0, to: waterSpan(route, 900) },
      { gid: 'w', content: 'water', from: waterSpan(route, 900), to: D },
    ]);
  });

  /**
   * The gel guard, and the whole of the end-of-route rule for carbs: a dose may not land in the last
   * `GEL_FINISH_GAP_FRACTION` of the route, because it would neither absorb nor have any effect
   * there. 1000 ml of the 60 g/100 ml gel is 600 g, which is exactly this 8 h / 75 g/h ride, so the
   * flask's one load is rate-matched onto the line at 200 km — and pulled back to 196.
   */
  test('a gel load is pulled back out of the last stretch of the route', () => {
    const state = makeState(route, [vessel('f', 1000, ['gel'])]);
    expect(carbsIn(state, 'f', 'gel')).toBe(600);
    expect(carbSpan(route, 600)).toBe(D);

    const { fills } = layout(state, [{ gid: 'f', content: 'gel', loads: 1 }], []);
    expectFillsClose(fills, [{ gid: 'f', content: 'gel', from: 0, to: 196 }]);
    expect(196).toBe(D * 0.98);
  });

  /** A gel load that already stops short of the gap is left exactly where the tiling put it. */
  test('a gel load that ends well short is not moved', () => {
    const state = makeState(route, [vessel('f', 250, ['gel'])]);
    expect(carbSpan(route, carbsIn(state, 'f', 'gel'))).toBe(50);
    const { fills } = layout(state, [{ gid: 'f', content: 'gel', loads: 1 }], []);
    expectFillsClose(fills, [{ gid: 'f', content: 'gel', from: 0, to: 50 }]);
  });

  /** izo has no finish gap of its own: four loads of 50 km tile this route exactly, and the last of
   *  them ends on the line rather than being pulled back the way the gel one is. */
  test('an izo load is left where the tiling put it', () => {
    const state = makeState(route, [vessel('a', 750, ['izo'])]);
    const { fills } = layout(state, [{ gid: 'a', content: 'izo', loads: 4 }], []);
    expect(fills).toHaveLength(4);
    expect(fills[3].to).toBe(D);
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
   * The bottle's two loads are 1500 ml of the 5600 ml this ride sweats away, so water is laid out
   * against the 4100 ml residual — 20.5 ml per kilometre — and 902 ml of it is 44 km. That refill
   * lands 6 km before the izo bottle's at 50, inside the window: one stop, at the earlier of the
   * two, and the izo boundary moves back onto it.
   */
  test('two refills inside the window become one stop, and the fills move with it', () => {
    const gear = [vessel('a', 750, ['izo']), vessel('w', 902, ['water'])];
    const state = makeState(route, gear);
    expect(residualFluid(route, 2 * 750)).toBe(4100);
    expect(waterSpanResidual(route, 902, 2 * 750)).toBe(44);

    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    expect(stops).toHaveLength(1);
    expect(stopXs(stops)[0]).toBeCloseTo(44, 9);
    // The izo refill was computed at 50 and is pulled back to 44; its `to` stays where the tiling
    // put it, so the move is absorbed by the two fills either side rather than re-tiling the rest.
    expectFillsClose(of(fills, 'izo'), [
      { gid: 'a', content: 'izo', from: 0, to: 44 },
      { gid: 'a', content: 'izo', from: 44, to: 100 },
    ]);
    // The second water load is the stream's last, so it is rationed out to the finish rather than
    // ending at the 88 km its own 902 ml would have been rate-matched to.
    expectFillsClose(of(fills, 'water'), [
      { gid: 'w', content: 'water', from: 0, to: 44 },
      { gid: 'w', content: 'water', from: 44, to: D },
    ]);
    for (const c of ['izo', 'water'] as Content[]) expectTiled(of(fills, c), D);
    expectStopsMatchRefills(fills, stops);
  });

  test('two refills further apart than the window stay two stops', () => {
    // 615 ml against the same 4100 ml residual is 30 km, which is 20 km short of the izo refill.
    const gear = [vessel('a', 750, ['izo']), vessel('w', 615, ['water'])];
    const state = makeState(route, gear);
    expect(waterSpanResidual(route, 615, 2 * 750)).toBe(30);
    expect(50 - waterSpanResidual(route, 615, 2 * 750)).toBeGreaterThan(mergeWindowKm(D));

    const { fills, stops } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    expect(stops).toHaveLength(2);
    expect(stopXs(stops)[0]).toBeCloseTo(30, 9);
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

describe('the gut gate', () => {
  /**
   * *"Nie dokładać następnego jak krzywa cukru w żołądku nie spadnie do 0"* — a load waits for the
   * stomach, not only for the need line.
   *
   * Every expectation here is the same two-step derivation: what `fuel.ts`'s own gut lane does to a
   * plan built by hand in the test, and then where `layout` puts the load that has to wait for it.
   * The physical arithmetic is written out beside each one, because reading the zero off the lane
   * and nothing else would only mirror the engine's own search instead of checking it.
   *
   * One thing is worth stating once, because all three depend on it: `samples()` draws 161 points,
   * so on a 200 km route the lane is read every 1.25 km and a clearance always lands on one of those
   * points. The gut is clamped at zero (`stepStomachBuffer` takes `min(buf, capPerStep)`), so it
   * touches the axis rather than crossing it and the point it touches at *is* the answer.
   */

  test('the first load waits out the pre-ride meal', () => {
    // 60 g eaten half an hour before the start, digesting at 20 g/h, leaves 50 g on board at km 0.
    const route = makeRoute({ preMealCarbs: 60, preMealMinutes: 30 });
    const state = makeState(route, [vessel('a', 750, ['izo'])]);
    expect(preRideGut(route)).toBe(50);

    // Nothing is placed yet, so the ceiling the gate reads is `absCap` with no izo/gel split known —
    // the izo ratio alone. 50 g at 90 g/h is 0.5556 h, which at 25 km/h is 13.89 km; the lane only
    // says so at its next point, 15.0.
    const cap = absCap(state.mix);
    expect(cap).toBe(90);
    const curve = samples(state);
    const step = curve[1].x - curve[0].x;
    const start = Math.ceil(((preRideGut(route) / cap) * route.speed) / step) * step;
    expect(start).toBeCloseTo(15, 9);
    expect(curve[Math.round(start / step) - 1].gut).toBeGreaterThan(0);
    expect(curve[Math.round(start / step)].gut).toBe(0);

    const { fills, stops } = layout(state, [{ gid: 'a', content: 'izo', loads: 1 }], []);
    expectFillsClose(fills, [
      {
        gid: 'a',
        content: 'izo',
        from: start,
        to: start + carbSpan(route, carbsIn(state, 'a', 'izo')),
      },
    ]);
    // Waiting is not a refill, so it costs no stop: the bottle was mixed in the kitchen either way.
    expect(stops).toEqual([]);
  });

  test('a load is not placed while the gut still holds the one before it', () => {
    // A 1.2 malto:fructose ratio puts `absCap` at 70 g/h, under the 75 g/h this ride asks for, so a
    // load matched against the need line is poured in faster than it can be taken: the first bottle
    // leaves a backlog behind precisely because it was the right size for the need line.
    const route = makeRoute();
    const state = makeState(route, [vessel('a', 750, ['izo'])], [], makeMix({ ratio: 1.2 }));
    const carbs = carbsIn(state, 'a', 'izo');
    const end = carbSpan(route, carbs);
    const cap = absCap(state.mix, carbs, 0);
    expect(cap).toBe(70);
    expect(cap).toBeLessThan(cph(route));

    // Over its own span the load delivers `carbs` and the gut takes `cap / cph` of them, so it ends
    // holding the rest: 10 g, another 10/70 h — 3.57 km — of absorption, which the lane reports at
    // 53.75.
    const backlog = carbs * (1 - cap / cph(route));
    expect(backlog).toBeCloseTo(10, 9);
    const curve = samples({
      ...state,
      fills: [{ fid: 1, gid: 'a', content: 'izo', from: 0, to: end }],
    });
    const step = curve[1].x - curve[0].x;
    const start = Math.ceil((end + (backlog / cap) * route.speed) / step) * step;
    expect(start).toBeCloseTo(53.75, 9);
    expect(curve[Math.round(end / step)].gut).toBeCloseTo(backlog, 6);
    expect(curve[Math.round(start / step) - 1].gut).toBeGreaterThan(0);
    expect(curve[Math.round(start / step)].gut).toBe(0);

    const { fills, stops } = layout(state, [{ gid: 'a', content: 'izo', loads: 2 }], []);
    // The hole between the two is the rule itself. The first load is deliberately *not* stretched
    // across it: stretching would pour the same carbs over the stretch the gut had no room for,
    // which is the delivery the gate exists to refuse.
    expectFillsClose(fills, [
      { gid: 'a', content: 'izo', from: 0, to: end },
      { gid: 'a', content: 'izo', from: start, to: start + end },
    ]);
    expect(stopXs(stops)).toHaveLength(1);
    expect(stopXs(stops)[0]).toBeCloseTo(start, 9);
  });

  test('the water stream is not gated', () => {
    // The same 50 g of breakfast that holds the izo back to 15 km. Water carries no carbs, so it
    // neither joins the backlog nor waits for it — *"jak cukru jest dużo to można sięgnąć po samą
    // wodę w tym czasie"*. Both water loads sit where the residual fluid line put them, seam to
    // seam from km 0, with the last one rationed to the finish as always.
    const route = makeRoute({ preMealCarbs: 60, preMealMinutes: 30 });
    const D = dist(route);
    const state = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 750, ['water'])]);
    const { fills } = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 1 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );

    const seam = waterSpanResidual(route, 750, 750);
    expectFillsClose(of(fills, 'water'), [
      { gid: 'w', content: 'water', from: 0, to: seam },
      { gid: 'w', content: 'water', from: seam, to: D },
    ]);
    // And the izo alongside it did wait, so this is the two rules in one plan rather than a route
    // the gate happened not to bite on.
    expect(of(fills, 'izo')[0].from).toBeCloseTo(15, 9);
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
    // The izo refill is due at km 50 and the cola is bought at 55 — 5 km apart, inside the window.
    // The product's position is the caller's and comes back untouched, so the boundary is the one
    // that gives way, and the load behind it stretches to meet it.
    //
    // This used to read the merge from the other side, a cola at 47 pulling the boundary back to it.
    // The gut gate rules that arrangement out and the test below is what it does instead: a bought
    // product is 35 g of sugar, and 35 g takes about as long to clear as the merge window is wide,
    // so a product *before* a boundary now pushes it away rather than attracting it. The mechanism
    // under test — an immovable candidate wins its cluster — is the same from either side, and this
    // is the side the gate leaves reachable.
    const foods = [food('cola', 55)];
    const { fills, stops } = layout(state, assignment, foods);
    expect(stops).toEqual([{ at: 55 }]);
    expect(of(fills, 'izo')).toEqual([
      { gid: 'a', content: 'izo', from: 0, to: 55 },
      { gid: 'a', content: 'izo', from: 55, to: 100 },
    ]);
    expectStopsMatchRefills(fills, stops, [55]);
  });

  test('a product before a boundary defers it instead, so each keeps its own stop', () => {
    // The cola at 47 lands while the first bottle is still pouring, and the load behind it may not
    // start until that 35 g has cleared. Derived from `fuel.ts`'s own gut lane, asked about a plan
    // built here by hand — the first load and the cola, nothing else.
    const curve = samples({
      ...state,
      fills: [{ fid: 1, gid: 'a', content: 'izo', from: 0, to: 50 }],
      foods: [{ id: 1, key: 'cola', name: 'Cola', carbs: 35, from: 47, to: 47 }],
    });
    const step = curve[1].x - curve[0].x;
    const i = curve.findIndex((s) => s.x >= 50 && s.gut <= 0);
    const clear = curve[i].x;
    // The arithmetic behind that index, so the number is checkable without the search: the cola's
    // 35 g arrive against a 90 g/h ceiling that the izo is already using 75 g/h of, so 3 km of
    // overlap eat 1.8 g of it and the remaining 33.2 g need another 9.2 km at the full ceiling once
    // the bottle runs dry at 50 — 59.2 km, which the 1.25 km lane reports at 60.
    expect(absCap(state.mix)).toBe(90);
    expect(step).toBeCloseTo(1.25, 9);
    expect(curve[i - 1].gut).toBeGreaterThan(0);
    expect(clear).toBeCloseTo(60, 9);
    // 13 km apart is outside the 10 km window, so neither candidate moves.
    expect(clear - 47).toBeGreaterThan(mergeWindowKm(dist(route)));

    const { fills, stops } = layout(state, assignment, [food('cola', 47)]);
    expectFillsClose(of(fills, 'izo'), [
      { gid: 'a', content: 'izo', from: 0, to: 50 },
      {
        gid: 'a',
        content: 'izo',
        from: clear,
        to: clear + carbSpan(route, carbsIn(state, 'a', 'izo')),
      },
    ]);
    expect(stopXs(stops)).toEqual([47, clear]);
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

describe('a spent vessel is topped up at a stop that already exists', () => {
  /**
   * The flask's gel runs from 50 to 100 and the bottle's refill puts a stop at 100 anyway, so the
   * flask rides on as a second bottle for free. It must never be the reason a stop exists, and what
   * goes into it is whatever its own `allowed` list permits — water for preference, izo at a pinch.
   */
  const route = makeRoute();
  const state = makeState(route, [
    vessel('a', 750, ['izo', 'water']),
    vessel('flask', 250, ['gel', 'water']),
  ]);
  const assignment: VesselAssignment[] = [
    { gid: 'a', content: 'izo', loads: 2 },
    { gid: 'flask', content: 'gel', loads: 1 },
  ];

  test('it does, when the plan already stops where the vessel is empty', () => {
    const { fills, stops } = layout(state, assignment, []);
    expect(stops).toEqual([{ at: 100 }]);
    const topUp = fills.filter((f) => f.gid === 'flask' && f.content === 'water');
    expect(topUp).toHaveLength(1);
    expect(topUp[0].from).toBe(100);
    expect(topUp[0].to).toBeCloseTo(100 + waterSpan(route, 250), 9);
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

  test('nor into a vessel that may hold neither water nor izo', () => {
    // `allowed` binds. A flask declared `['gel']` takes nothing here — which costs it nothing, now
    // that the relay itself may hand it another load of gel.
    const dry = makeState(route, [
      vessel('a', 750, ['izo', 'water']),
      vessel('flask', 250, ['gel']),
    ]);
    const { fills } = layout(dry, assignment, []);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
  });

  test('one that may not hold water takes izo instead — at a pinch', () => {
    // *"nawet od biedy izo"*. The flask's 250 ml of the 20 g/100 ml mix is 50 g, which is 16.7 km
    // of a 75 g/h ride, and the relay stops 50 km short of the line — so there is a shortfall for
    // it to close, which is the only thing that makes carrying a sachet for it worth anything.
    const noWater = makeState(route, [
      vessel('a', 750, ['izo']),
      vessel('flask', 250, ['gel', 'izo']),
    ]);
    const { fills, stops } = layout(noWater, assignment, []);
    const own = fills.filter((f) => f.gid === 'flask');
    expect(own).toHaveLength(2);
    expect(own[0]).toEqual({ gid: 'flask', content: 'gel', from: 50, to: 100 });
    expect(carbsIn(noWater, 'flask', 'izo')).toBe(50);
    expect(own[1].content).toBe('izo');
    expect(own[1].from).toBe(100);
    expect(own[1].to).toBeCloseTo(100 + carbSpan(route, 50), 9);
    // And it bought no stop of its own.
    expect(stops).toEqual([{ at: 100 }]);
    expectStopsMatchRefills(fills, stops);
  });

  test('water wins where the vessel may hold both', () => {
    // Water is free and needs no sachet carried from home, so izo is the escalation and never the
    // first answer.
    const both = makeState(route, [
      vessel('a', 750, ['izo']),
      vessel('flask', 250, ['gel', 'water', 'izo']),
    ]);
    const { fills } = layout(both, assignment, []);
    const own = fills.filter((f) => f.gid === 'flask');
    expect(own).toHaveLength(2);
    expect(own[1].content).toBe('water');
    expect(own[1].to).toBeCloseTo(100 + waterSpan(route, 250), 9);
  });

  test('and no izo at all once the relay already reaches the finish', () => {
    // Three izo loads plus the flask's gel tile the whole 200 km, so nothing is short and a fourth
    // load would be carbs the ride never asked for — the double-counting this module exists to
    // avoid, arriving by the back door.
    const noWater = makeState(route, [
      vessel('a', 750, ['izo']),
      vessel('flask', 250, ['gel', 'izo']),
    ]);
    const { fills, stops } = layout(
      noWater,
      [
        { gid: 'a', content: 'izo', loads: 3 },
        { gid: 'flask', content: 'gel', loads: 1 },
      ],
      [],
    );
    expect(carbStreamOf(fills).at(-1)?.to).toBe(dist(route));
    expect(stopXs(stops)).toEqual([100, 150]);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
    expect(carbsPlanned(noWater, fills)).toBeCloseTo(carbsRequired(route), 9);
  });

  test('nor at a stop it reaches while still carrying carbs', () => {
    // The flask's 500 ml of gel is 300 g — 100 km — so at the cola stop at 50 it is still full.
    const FOOD_LIB: FoodLibEntry[] = [
      { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
    ];
    const big = makeState(route, [vessel('flask', 500, ['gel', 'water'])], FOOD_LIB);
    const { fills, stops } = layout(
      big,
      [{ gid: 'flask', content: 'gel', loads: 1 }],
      [{ key: 'cola', carbs: 35, from: 50, to: 50 }],
    );
    expect(stops).toEqual([{ at: 50 }]);
    expect(of(fills, 'gel')).toEqual([{ gid: 'flask', content: 'gel', from: 0, to: 100 }]);
    expect(fills.filter((f) => f.gid === 'flask')).toHaveLength(1);
    expectStopsMatchRefills(fills, stops, [50]);
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

  test('a zero-distance route asks for no fluid either, so a water load reaches the finish', () => {
    // `sweat × totalHours` is 0, so there is no residual to speak of and `spans.ts`'s own answer
    // stands: a fill against a line that demands nothing reaches the end of it.
    const route = makeRoute({ distance: 0 });
    const state = makeState(route, [vessel('w', 750, ['water'])]);
    expect(fluidNeed(route)).toBe(0);
    const { fills, stops } = layout(state, [{ gid: 'w', content: 'water', loads: 3 }], []);
    expect(fills).toEqual([{ gid: 'w', content: 'water', from: 0, to: 1 }]);
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
