/**
 * Every expectation here is derived by hand — from `cph()`, `sweat()` and `carbsFill()` on a
 * hand-built kit, never from something `layout()` produced. The routes are all flat (no GPX), so
 * `eff` is linear and a span reduces to the schoolbook arithmetic `spans.test.ts` pins:
 * `carbs / cph × speed` km, `ml / sweat × speed` km.
 *
 * The numbers are chosen so the arithmetic is round. At 25 km/h a ride over 2.5 h is `cph` 75, and
 * a 750 ml bottle of a 20 g/100 ml mix holds 150 g, so one load reaches exactly 50 km — which makes
 * a 200 km route exactly four loads long and every boundary a whole number.
 *
 * **Which stage each test asks.** `layout` is `place` followed by `stretch`, and the owner's reason
 * for that split is that the stretch must not be able to cover for a placement bug — it closes holes,
 * and a placement bug opens them. So every test about *where* something is put calls `place`: the
 * relay, the merge, the stop list, the top-ups, the gut gate, the gel finish gap. Only the tests
 * about the stretch itself — `where a stream ends`, and the block at the bottom of the file — call
 * `layout` or `stretch` and assert on the finished plan.
 */
import { describe, expect, test } from 'vitest';
import {
  absCap,
  carbsFill,
  cph,
  dist,
  planSummary,
  preRideGut,
  samples,
  sweat,
  totalHours,
} from '../fuel';
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
import { layout, mergeWindowKm, place, stretch } from './layout';
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
 * The correspondence both directions, asserted here on `layout`'s own output: every refill (a fill
 * whose vessel has an earlier one, in ride order) is served by a stop, and every stop is either a
 * refill's or a `needsStop` product's.
 *
 * **Served, not started at.** A bottle is filled at a tap and opened later, so a refill only has to
 * be *doable* at a stop the plan has: one anywhere on the stretch its vessel is empty, from where
 * its previous load ran out to where this one starts being drunk. The stop it is charged to is the
 * latest in that window — the shortest distance a full bottle is hauled — which is the same choice
 * `carryStop` makes, restated here rather than imported so that this stays an assertion about the
 * plan rather than a re-run of the code that built it.
 */
function expectStopsMatchRefills(
  fills: DraftFill[],
  stops: { at: number }[],
  productStops: number[] = [],
): void {
  const xs = stopXs(stops);
  const served = new Set<number>(productStops);
  const emptyFrom = new Map<string, number>();
  for (const f of [...fills].sort((a, b) => a.from - b.from)) {
    const prev = emptyFrom.get(f.gid);
    emptyFrom.set(f.gid, prev === undefined ? f.to : Math.max(prev, f.to));
    if (prev === undefined) continue;
    const window = xs.filter((x) => x >= prev && x <= f.from);
    expect(
      window,
      `refill @${f.from} of ${f.gid} has no stop between ${prev} and ${f.from}`,
    ).not.toHaveLength(0);
    served.add(Math.max(...window));
  }
  for (const s of xs) {
    expect(served.has(s), `stop @${s} serves nothing`).toBe(true);
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
    expect(place(state, assignment, []).stops).toEqual([]);
  });

  test('the izo bottles hand over contiguously from 0 to the finish', () => {
    const izo = of(place(state, assignment, []).fills, 'izo');
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
    const { fills } = place(state, assignment, []);
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    expect(of(fills, 'gel')).toEqual([]);
    expect(carbsRequired(route)).toBe(300);
    expect(carbsPlanned(state, fills)).toBeCloseTo(carbsRequired(route), 9);
  });

  test('and the bladder is laid out against the fluid the izo does not supply', () => {
    // 700 ml/h over 4 h is 2800 ml lost, of which the two bottles pour 1500 — so 1300 ml is
    // water's to cover, and a 2000 ml bladder more than sees the ride out. Matched against the
    // whole 2800 it was rate-matched down to 2000/700 × 25 = 71.4 km and poured on top of the izo.
    const { fills } = place(state, assignment, []);
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
    const { fills, stops } = place(state, assignment, []);
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
    const { fills, stops } = place(state, assignment, []);
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
    const { stops } = place(state, assignment, []);
    expect(stopXs(stops)).not.toContain(50);
  });

  test('and b, empty from km 100, is topped up with water at that same stop', () => {
    // Rule 2: one stop tops up every bottle at once. `a` is refilled with izo, `b` with water.
    const { fills } = place(state, assignment, []);
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
    const { fills, stops } = place(state, assignment, []);
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
    const { fills, stops } = place(state, [{ gid: 'a', content: 'izo', loads: 5 }], []);
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
    const { fills } = place(state, assignment, []);
    expect(carbsPlanned(state, fills)).toBeCloseTo(carbsRequired(route), 9);
    // And explicitly not the two-streams answer: this assertion is the one that used to fail.
    expect(carbsPlanned(state, fills)).toBeLessThan(1.5 * carbsRequired(route));
  });

  test('the relay interleaves izo and gel in rotation order', () => {
    const { fills } = place(state, assignment, []);
    const stream = carbStreamOf(fills);
    expect(stream.map((f) => f.gid)).toEqual(['b1', 'flask1', 'b2']);
    expect(stream.map((f) => f.content)).toEqual(['izo', 'gel', 'izo']);
    // 150 g reaches 50 km, 300 g reaches 100: the bottle hands over to the flask, the flask to the
    // other bottle, and that last 150 g lands exactly on the line.
    expect(froms(stream)).toEqual([0, 50, 150]);
    expect(stream[2].to).toBe(dist(route));
  });

  test('the carb stream is one contiguous chain, and it costs no stop', () => {
    const { fills, stops } = place(state, assignment, []);
    expectTiled(carbStreamOf(fills), dist(route));
    // Three vessels, one load each: the whole relay is its first pass, and a first pass is all
    // handovers.
    expect(stops).toEqual([]);
  });

  test('the vessels the relay never reaches are not planned', () => {
    const { fills } = place(state, assignment, []);
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

  test('a second load of gel is a refill, and both refills of the round share one stop', () => {
    const { fills, stops } = place(
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
    // The wrap onto `a` at 100 and the wrap onto the flask at 150 are both refills; the handover at
    // 50 is the flask's home load and is free.
    //
    // They cost **one** stop between them, not two, and that is the point of the round-robin. The
    // flask ran dry at 100 and does not pour again until 150, so the rider standing at the 100 km
    // stop refilling the bottle mixes the flask's next dose there too and carries it — *"one stop
    // tops up every bottle at once"*. This used to expect `[100, 150]`, which said the opposite:
    // that a bottle is filled at the exact kilometre it is opened, so every refill in a round buys
    // its own pull-over. Nothing about the plan changed — same four loads, same boundaries, same
    // grams — only the count of times the rider has to stand still.
    expect(stopXs(stops)).toEqual([100]);
    expect(stopXs(stops)).not.toContain(50);
    expectTiled(stream, dist(route));
    expectStopsMatchRefills(fills, stops);
  });

  test('and it is still one requirement covered once between the two sources', () => {
    const { fills } = place(
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
    const { fills, stops } = place(
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
    const alone = place(dry, [{ gid: 'w', content: 'water', loads: 2 }], []);

    const wet = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 900, ['water'])]);
    const withIzo = place(
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
    const { fills } = place(
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
    const { fills } = place(
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

    expect(() => place(state, assignment, [])).not.toThrow();
    const { fills } = place(state, assignment, []);
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
   *
   * This used to be `place`'s own doing, as a `lastWater.to = D` written into the water stream. It is
   * `stretch`'s now — the general rule says the same thing about every sipped fill — so the test asks
   * `layout`, and asks `place` alongside it to pin which stage does what. The behaviour it was
   * written to prove is unchanged and still asserted exactly: the last load reaches the finish, and
   * the handover before it stays where the need line put it.
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

    // Placement on its own leaves the single load where the need line put it — 32.14 of 200 km — so
    // the finish is the stretch's doing and nothing in `place` is quietly doing it twice.
    const placedOne = place(state, [{ gid: 'w', content: 'water', loads: 1 }], []);
    expectFillsClose(placedOne.fills, [
      { gid: 'w', content: 'water', from: 0, to: waterSpan(route, 900) },
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

    const { fills } = place(state, [{ gid: 'f', content: 'gel', loads: 1 }], []);
    expectFillsClose(fills, [{ gid: 'f', content: 'gel', from: 0, to: 196 }]);
    expect(196).toBe(D * 0.98);
  });

  /** A gel load that already stops short of the gap is left exactly where the tiling put it. */
  test('a gel load that ends well short is not moved', () => {
    const state = makeState(route, [vessel('f', 250, ['gel'])]);
    expect(carbSpan(route, carbsIn(state, 'f', 'gel'))).toBe(50);
    const { fills } = place(state, [{ gid: 'f', content: 'gel', loads: 1 }], []);
    expectFillsClose(fills, [{ gid: 'f', content: 'gel', from: 0, to: 50 }]);
  });

  /** izo has no finish gap of its own: four loads of 50 km tile this route exactly, and the last of
   *  them ends on the line rather than being pulled back the way the gel one is. */
  test('an izo load is left where the tiling put it', () => {
    const state = makeState(route, [vessel('a', 750, ['izo'])]);
    const { fills } = place(state, [{ gid: 'a', content: 'izo', loads: 4 }], []);
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

    const { fills, stops } = place(
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
    // Placement puts the second water load where its own 902 ml is rate-matched to: 44 km more, so
    // 88. Running it out to the finish is `stretch`'s job and is asserted below, not here — this
    // test is about the merge moving a boundary, and it must be able to fail on that alone.
    expectFillsClose(of(fills, 'water'), [
      { gid: 'w', content: 'water', from: 0, to: 44 },
      { gid: 'w', content: 'water', from: 44, to: 2 * 44 },
    ]);
    for (const c of ['izo', 'water'] as Content[]) expectTiled(of(fills, c), D);
    expectStopsMatchRefills(fills, stops);

    // The merged boundary survives the stretch — only the last load's `to` moves, out to the line.
    const stretched = layout(
      state,
      [
        { gid: 'a', content: 'izo', loads: 2 },
        { gid: 'w', content: 'water', loads: 2 },
      ],
      [],
    );
    expectFillsClose(of(stretched.fills, 'water'), [
      { gid: 'w', content: 'water', from: 0, to: 44 },
      { gid: 'w', content: 'water', from: 44, to: D },
    ]);
  });

  test('two refills further apart than the window stay two stops', () => {
    // 615 ml against the same 4100 ml residual is 30 km, which is 20 km short of the izo refill.
    const gear = [vessel('a', 750, ['izo']), vessel('w', 615, ['water'])];
    const state = makeState(route, gear);
    expect(waterSpanResidual(route, 615, 2 * 750)).toBe(30);
    expect(50 - waterSpanResidual(route, 615, 2 * 750)).toBeGreaterThan(mergeWindowKm(D));

    const { fills, stops } = place(
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

    const { fills, stops } = place(state, [{ gid: 'a', content: 'izo', loads: 3 }], []);
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

    const { fills, stops } = place(state, [{ gid: 'a', content: 'izo', loads: 1 }], []);
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

    const { fills, stops } = place(state, [{ gid: 'a', content: 'izo', loads: 2 }], []);
    // The hole between the two is the rule itself: placement puts the second load at 53.75, not at
    // the 50 the need line asked for. `stretch` later draws the first load across that hole — which
    // is the owner's other rule and does *not* undo this one, because it pours the same grams over
    // more kilometres and so arrives slower than the gut could take them anyway. That is pinned in
    // `a drink is stretched to the end of the room it has`, on this very fixture.
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
    // seam from km 0: no deferral anywhere in the stream, which is the whole of what this pins.
    const route = makeRoute({ preMealCarbs: 60, preMealMinutes: 30 });
    const D = dist(route);
    const state = makeState(route, [vessel('a', 750, ['izo']), vessel('w', 750, ['water'])]);
    const assignment: VesselAssignment[] = [
      { gid: 'a', content: 'izo', loads: 1 },
      { gid: 'w', content: 'water', loads: 2 },
    ];
    const { fills } = place(state, assignment, []);

    const seam = waterSpanResidual(route, 750, 750);
    expectFillsClose(of(fills, 'water'), [
      { gid: 'w', content: 'water', from: 0, to: seam },
      { gid: 'w', content: 'water', from: seam, to: 2 * seam },
    ]);
    // Un-gated at both ends: the second load starts at the seam, and once stretched it runs to the
    // line — the gate never touches the water stream at either stage.
    expectFillsClose(of(layout(state, assignment, []).fills, 'water'), [
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
    const carried = place(state, [], [food('banana', 47)]);
    expect(carried.stops).toEqual([]);
    const bought = place(state, [], [food('cola', 47)]);
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
    const { fills, stops } = place(state, assignment, foods);
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

    const { fills, stops } = place(state, assignment, [food('cola', 47)]);
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
    const { fills, stops } = place(state, assignment, [food('cola', 65)]);
    expect(stopXs(stops)).toEqual([50, 65]);
    expect(froms(of(fills, 'izo'))).toEqual([0, 50]);
    expectStopsMatchRefills(fills, stops, [65]);
  });

  test('foods come back out exactly as they went in', () => {
    const foods = [food('cola', 47), food('banana', 120)];
    expect(place(state, assignment, foods).foods).toBe(foods);
  });
});

describe('a refill is done at a stop the plan already has', () => {
  /**
   * Filling a bottle and drinking from it are two different kilometres. A refill needs a tap, so it
   * needs a stop — but it needs one *somewhere on the stretch its vessel is empty*, not one at the
   * exact kilometre the bottle is opened. The rider fills at a shop and rides on with it.
   *
   * The kit is chosen so that nothing else can be doing the work. 140 km at 25 km/h is 5.6 h, so
   * `cph` is 75; the 750 ml bottle of the 20 g/100 ml mix and the 250 ml flask of the 60 g/100 ml
   * gel both hold 150 g, which is 50 km each. The relay therefore runs `a` 0→50, flask 50→100,
   * `a` 100→140 — so `a` is empty over the whole of [50, 100]. Neither vessel may hold water and
   * the carb stream already reaches the line, so the top-up pass pours nothing and cannot quietly
   * refill the bottle behind this test's back.
   */
  const route = makeRoute({ distance: 140 });
  // Carbs 0, so the shop is a stop and nothing else: it cannot move the gut gate and re-tile the
  // relay underneath the assertions.
  const FOOD_LIB: FoodLibEntry[] = [
    { key: 'tap', pl: 'Woda ze sklepu', en: 'Shop water', carbs: 0, ml: 500, needsStop: true },
  ];
  const state = makeState(
    route,
    [vessel('a', 750, ['izo']), vessel('flask', 250, ['gel'])],
    FOOD_LIB,
  );
  const assignment: VesselAssignment[] = [
    { gid: 'a', content: 'izo', loads: 2 },
    { gid: 'flask', content: 'gel', loads: 1 },
  ];
  const shop = (at: number): DraftFood => ({ key: 'tap', carbs: 0, ml: 500, from: at, to: at });
  const relay: DraftFill[] = [
    { gid: 'a', content: 'izo', from: 0, to: 50 },
    { gid: 'flask', content: 'gel', from: 50, to: 100 },
    { gid: 'a', content: 'izo', from: 100, to: 140 },
  ];

  test('the fixture: two 150 g loads with a gel between them, and no top-up anywhere', () => {
    expect(dist(route)).toBe(140);
    expect(carbsIn(state, 'a', 'izo')).toBe(150);
    expect(carbsIn(state, 'flask', 'gel')).toBe(150);
    expect(carbSpan(route, 150)).toBe(50);
    const { fills } = place(state, assignment, []);
    expectFillsClose(fills, relay);
    // The last carb load runs onto the line, which is what switches the izo top-up off; and neither
    // vessel allows water, so there is no water top-up to switch off in the first place.
    expect(carbStreamOf(fills).at(-1)?.to).toBe(dist(route));
  });

  test('with no stop in the window, the refill buys one where the bottle is opened', () => {
    const { fills, stops } = place(state, assignment, []);
    expect(stopXs(stops)).toEqual([100]);
    expectStopsMatchRefills(fills, stops);
  });

  test('a shop inside the window takes it over, and the plan costs no second stop', () => {
    // km 60 is 10 km past where the bottle ran dry and 40 km before it is opened — well outside the
    // merge window at either end, so nothing is being dragged onto anything here. The rider mixes
    // at the shop and carries the bottle to 100.
    expect(60 - 50).toBeGreaterThan(0);
    expect(100 - 60).toBeGreaterThan(mergeWindowKm(dist(route)));
    const { fills, stops } = place(state, assignment, [shop(60)]);
    // Not one fill moved: same three loads, same boundaries, same grams as with no shop at all.
    expectFillsClose(fills, relay);
    expect(stopXs(stops)).toEqual([60]);
    expectStopsMatchRefills(fills, stops, [60]);
  });

  test('a shop before the bottle ran dry does not, so the refill keeps its own stop', () => {
    // At km 40 the bottle is still being drunk from, so it cannot be refilled there. The window is
    // closed at both ends and 40 is outside it.
    const { fills, stops } = place(state, assignment, [shop(40)]);
    expectFillsClose(fills, relay);
    expect(stopXs(stops)).toEqual([40, 100]);
    expectStopsMatchRefills(fills, stops, [40]);
  });

  test('with two shops in the window the refill is charged to the later one', () => {
    // Both are legal, so the choice is free and it is made for the rider: filling at 90 rather than
    // 60 hauls the full bottle 30 km less far. `stretch` is where that choice becomes visible —
    // the izo already in the bottle is drunk right up to the moment it is poured out.
    const foods = [shop(60), shop(90)];
    expect(stopXs(place(state, assignment, foods).stops)).toEqual([60, 90]);
    expect(of(layout(state, assignment, foods).fills, 'izo')[0].to).toBe(90);
  });

  test('and the load before a carried refill is drunk only up to the stop it was filled at', () => {
    // The hazard the carry rule opens, and the reason `stretch`'s vessel clause asks where the
    // refill was *done* rather than reading its `from`. The izo has room to be sipped as far as
    // km 100 — the flask's gel is a different lane and does not end its claim — but the bottle
    // holding it was emptied and refilled at the shop at 60. Reading `from` drew it 0→100, which is
    // the rider still drinking from a bottle somebody poured out 40 km earlier.
    const { fills, stops } = layout(state, assignment, [shop(60)]);
    expect(stopXs(stops)).toEqual([60]);
    expect(of(fills, 'izo')[0]).toEqual({ gid: 'a', content: 'izo', from: 0, to: 60 });
    // And with no shop the same load does stretch all the way to 100, because 100 is then where the
    // bottle is actually filled. So the cap is the refill's stop, not a blanket shortening.
    expect(of(layout(state, assignment, []).fills, 'izo')[0].to).toBe(100);
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
    const { fills, stops } = place(state, assignment, []);
    expect(stops).toEqual([{ at: 100 }]);
    const topUp = fills.filter((f) => f.gid === 'flask' && f.content === 'water');
    expect(topUp).toHaveLength(1);
    expect(topUp[0].from).toBe(100);
    expect(topUp[0].to).toBeCloseTo(100 + waterSpan(route, 250), 9);
    // And it bought nothing: the only stop is the izo refill it happened to coincide with.
    expectStopsMatchRefills(fills, stops);
  });

  test('it does not, when the plan has no stop at all', () => {
    const { fills, stops } = place(
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
    const { fills } = place(dry, assignment, []);
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
    const { fills, stops } = place(noWater, assignment, []);
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
    const { fills } = place(both, assignment, []);
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
    const { fills, stops } = place(
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
    const { fills, stops } = place(
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
    expect(() => place(state, [{ gid: 'bladder', content: 'izo', loads: 1 }], [])).toThrow(
      /may not carry izo/,
    );
  });

  test('a vessel that is not in the gear', () => {
    expect(() => place(state, [{ gid: 'ghost', content: 'water', loads: 1 }], [])).toThrow(
      /not in the gear/,
    );
  });

  test('the same vessel assigned twice', () => {
    expect(() =>
      place(
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
      place(
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
    expect(place(state, [], [])).toEqual({ fills: [], foods: [], stops: [] });
  });

  test('loads: 0 leaves the vessel at home', () => {
    const state = makeState(makeRoute(), [vessel('a', 750, ['izo']), vessel('b', 750, ['izo'])]);
    const { fills, stops } = place(
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
    expect(place(state, [{ gid: 'a', content: 'izo', loads: 0 }], [])).toEqual({
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
    const { fills, stops } = place(state, [{ gid: 'a', content: 'izo', loads: 3 }], []);
    expect(fills).toEqual([{ gid: 'a', content: 'izo', from: 0, to: 1 }]);
    expect(stops).toEqual([]);
  });

  test('a zero-distance route asks for no fluid either, so a water load reaches the finish', () => {
    // `sweat × totalHours` is 0, so there is no residual to speak of and `spans.ts`'s own answer
    // stands: a fill against a line that demands nothing reaches the end of it.
    const route = makeRoute({ distance: 0 });
    const state = makeState(route, [vessel('w', 750, ['water'])]);
    expect(fluidNeed(route)).toBe(0);
    const { fills, stops } = place(state, [{ gid: 'w', content: 'water', loads: 3 }], []);
    expect(fills).toEqual([{ gid: 'w', content: 'water', from: 0, to: 1 }]);
    expect(stops).toEqual([]);
  });

  test('a vessel that holds nothing is skipped without stalling the relay', () => {
    const route = makeRoute();
    const state = makeState(route, [vessel('empty', 0, ['izo']), vessel('b', 750, ['izo'])]);
    const { fills } = place(
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

/**
 * The stretch, on its own and through `layout`.
 *
 * The pass is pure geometry over the other fills' `from`s — no need line, no vessel volume, no
 * arithmetic from `fuel.ts` at all — so most of it is pinned on hand-built fill lists where the caps
 * are visible by eye. The two tests that go through `layout` are the ones where the interaction with
 * real placement is the point, and their spans are derived from `carbsFill`/`cph` like everything
 * else in this file.
 */
describe('a drink is stretched to the end of the room it has', () => {
  const D = 200;

  test('a fill runs to its own vessel’s next fill — and a gel fill is that next fill', () => {
    // Three clauses at once: the water is cut off where the bottle is refilled with something else,
    // a gel fill counts for that because one bottle cannot hold two things, and the gel itself is
    // not stretched — it is doses, not a lane.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 20 },
      { gid: 'a', content: 'gel', from: 60, to: 100 },
    ];
    expect(stretch(fills, D)).toEqual([
      { gid: 'a', content: 'water', from: 0, to: 60 },
      { gid: 'a', content: 'gel', from: 60, to: 100 },
    ]);
  });

  test('a fill runs to the next fill of the same content in any vessel', () => {
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 20 },
      { gid: 'b', content: 'water', from: 60, to: 80 },
    ];
    // The lane is taken over at 60, and `b`'s load is the last of it, so it runs to the line.
    expect(stretch(fills, D)).toEqual([
      { gid: 'a', content: 'water', from: 0, to: 60 },
      { gid: 'b', content: 'water', from: 60, to: D },
    ]);
  });

  test('the last fill of a lane runs to the finish', () => {
    const fills: DraftFill[] = [{ gid: 'a', content: 'water', from: 40, to: 50 }];
    expect(stretch(fills, D)).toEqual([{ gid: 'a', content: 'water', from: 40, to: D }]);
  });

  test('the earliest of the three caps is the one that binds', () => {
    // Same content at 120, the vessel's own next fill at 80, the finish at 200: 80 wins.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 10 },
      { gid: 'a', content: 'izo', from: 80, to: 100 },
      { gid: 'b', content: 'water', from: 120, to: 140 },
    ];
    expect(stretch(fills, D)[0]).toEqual({ gid: 'a', content: 'water', from: 0, to: 80 });
  });

  test('the vessel cap is where the bottle was filled, which a stop list can move earlier', () => {
    // The bottle runs dry at 10 and holds izo again from 80. With no stop list to ask there is
    // nowhere earlier the izo could have been poured in, so the cap is 80 — the two-argument call
    // means exactly what it always did.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 10 },
      { gid: 'a', content: 'izo', from: 80, to: 100 },
    ];
    expect(stretch(fills, D)[0].to).toBe(80);
    // Told that the rider stopped at 40 — inside [10, 80], the stretch over which the bottle is
    // empty — the izo went in there and the water can only have been drunk that far.
    expect(stretch(fills, D, [{ at: 40 }])[0].to).toBe(40);
    // The latest such stop is the one the bottle was filled at, so an earlier one alongside it
    // changes nothing.
    expect(stretch(fills, D, [{ at: 20 }, { at: 40 }])[0].to).toBe(40);
    // A stop before the bottle ran dry is not one it could have been filled at.
    expect(stretch(fills, D, [{ at: 5 }])[0].to).toBe(80);
  });

  test('a lane is taken over when the other bottle is drunk from, not when it is filled', () => {
    // The same-content clause keeps reading `from`, and this is why the two clauses ask different
    // questions of the same fill. `b`'s water may well have been poured at the stop at 40, but the
    // rider does not start drinking it until 80 — so `a`'s lane is his until then.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 10 },
      { gid: 'b', content: 'water', from: 80, to: 100 },
    ];
    expect(stretch(fills, D, [{ at: 40 }])[0].to).toBe(80);
  });

  test('water and izo are separate lanes, so neither caps the other', () => {
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 20 },
      { gid: 'b', content: 'izo', from: 60, to: 80 },
    ];
    // Both run to the line, straight past each other: the rider sips from both bottles at once,
    // which is the whole point of laying fluid and carbs out as two independent needs.
    expect(stretch(fills, D)).toEqual([
      { gid: 'a', content: 'water', from: 0, to: D },
      { gid: 'b', content: 'izo', from: 60, to: D },
    ]);
  });

  test('a fill is never shortened, so a lane another vessel already covers is left alone', () => {
    // `b`'s water starts inside `a`'s span, so the cap it puts on `a` sits behind where `a` already
    // ends. The rule only ever moves a `to` later, so `a` keeps its 150.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'water', from: 0, to: 150 },
      { gid: 'b', content: 'water', from: 40, to: 60 },
    ];
    expect(stretch(fills, D)).toEqual([
      { gid: 'a', content: 'water', from: 0, to: 150 },
      { gid: 'b', content: 'water', from: 40, to: D },
    ]);
  });

  test('izo stretches under a running gel stream — the lanes are independent', () => {
    // The owner's explicit ruling, asked as a direct question: a gel running over the same
    // kilometres does *not* count as "there is already something on that lane" for izo. Only
    // another izo fill does, and this list has none.
    const fills: DraftFill[] = [
      { gid: 'a', content: 'izo', from: 0, to: 20 },
      { gid: 'f', content: 'gel', from: 20, to: 180 },
    ];
    expect(stretch(fills, D)).toEqual([
      { gid: 'a', content: 'izo', from: 0, to: D },
      { gid: 'f', content: 'gel', from: 20, to: 180 },
    ]);
  });

  /**
   * **The stretch must not undo the gut gate.** `place` defers a carb load until `Sample.gut` has
   * drained to zero; the stretch then pours an earlier load over more kilometres, and over the
   * stretched tail the gut receives carbs where it previously received none. That is a real reason
   * to check rather than to assume.
   *
   * It holds, and the reason it holds is the direction of the change: stretching a fill lowers its
   * delivery rate, and a backlog only forms while delivery runs above `absCap`. The fixture is the
   * one from `the gut gate` above — a 1.2 ratio puts `absCap` at 70 g/h under a 75 g/h need, so the
   * first load is poured in faster than it can be taken and the second waits 3.75 km for the 10 g
   * left over. After the stretch the first load covers the whole 53.75 km instead of 50, and the
   * expectation below is not a number `layout` produced: it is the gate's own contract, zero, read
   * off `fuel.ts`'s curve built from the *stretched* spans.
   */
  test('and it does not undo the gut gate', () => {
    const route = makeRoute();
    const state = makeState(route, [vessel('a', 750, ['izo'])], [], makeMix({ ratio: 1.2 }));
    const assignment: VesselAssignment[] = [{ gid: 'a', content: 'izo', loads: 2 }];

    const placed = place(state, assignment, []).fills;
    const stretched = layout(state, assignment, []).fills;
    // The gate did bite, and the stretch did close the hole it left — so neither half of this test
    // is vacuous.
    expect(placed[1].from).toBeGreaterThan(placed[0].to);
    expect(stretched[0].to).toBeCloseTo(stretched[1].from, 9);

    // For every carb load, the curve of the loads that precede it — at their final, stretched spans —
    // must read an empty gut where that load begins. That is exactly what `carbGate` promised while
    // it was placing them, re-asked after the spans moved.
    stretched.forEach((f, i) => {
      const curve = samples({
        ...state,
        fills: stretched.slice(0, i).map((g, j) => ({ ...g, fid: j + 1 })),
      });
      const at = curve.find((p) => p.x >= f.from);
      expect(at?.gut).toBe(0);
    });
  });

  describe('through `layout`, on a plan `place` actually builds', () => {
    const route = makeRoute();
    const RD = dist(route);
    // 250 ml of the 20 g/100 ml mix is 50 g, which this 75 g/h ride burns in 16⅔ km. The flask's
    // 1000 ml of 60 g/100 ml gel is 600 g — the whole ride — so it is rate-matched onto the line and
    // pulled back to 196 by the gel finish gap.
    const gear = [vessel('a', 250, ['izo', 'water']), vessel('f', 1000, ['gel'])];
    const state = makeState(route, gear);
    const assignment: VesselAssignment[] = [
      { gid: 'a', content: 'izo', loads: 1 },
      { gid: 'f', content: 'gel', loads: 1 },
    ];

    test('the izo runs the whole route underneath the gel', () => {
      const izoSpan = carbSpan(route, carbsIn(state, 'a', 'izo'));
      expect(izoSpan).toBeCloseTo(50 / 3, 9);
      expect(carbSpan(route, carbsIn(state, 'f', 'gel'))).toBe(RD);

      // Placement leaves the izo where the need line put it, with 183 km of empty bidon after it.
      expectFillsClose(place(state, assignment, []).fills, [
        { gid: 'a', content: 'izo', from: 0, to: izoSpan },
        { gid: 'f', content: 'gel', from: izoSpan, to: RD * 0.98 },
      ]);
      // The stretch draws it out to the line: no other izo anywhere, no other fill in `a`, and the
      // gel is neither.
      expectFillsClose(layout(state, assignment, []).fills, [
        { gid: 'a', content: 'izo', from: 0, to: RD },
        { gid: 'f', content: 'gel', from: izoSpan, to: RD * 0.98 },
      ]);
    });

    test('and it changes no total, no `from`, and no stop', () => {
      const before = place(state, assignment, []);
      const after = layout(state, assignment, []);
      expect(after.fills.map((f) => f.from)).toEqual(before.fills.map((f) => f.from));
      expect(after.stops).toEqual(before.stops);
      expect(after.foods).toEqual(before.foods);

      // `planSummary` reads volume through `volOf` and grams through `carbsFill`, and neither knows
      // what a span is — so the plan the rider drinks is the same plan, poured more slowly.
      const summarize = (d: typeof before) =>
        planSummary({ ...state, fills: d.fills.map((f, i) => ({ ...f, fid: i + 1 })) });
      const b = summarize(before);
      const a = summarize(after);
      expect(a.izoCarbs).toBe(b.izoCarbs);
      expect(a.gelCarbs).toBe(b.gelCarbs);
      expect(a.totalCarbs).toBe(b.totalCarbs);
      expect(a.fluidPlanned).toBe(b.fluidPlanned);
      expect(a.waterBalancePct).toBe(b.waterBalancePct);
    });
  });
});
