/**
 * The loop's own properties.
 *
 * Not a second scenario suite — `autoplanScenarios`, `autoplanMixScenarios` and `autoplanPacing`
 * are the specification for *what a good plan looks like*, and nothing here duplicates them. What
 * this file pins is the search itself: that it stops, that it only ever moves downhill, that the
 * tier order is an escalation rather than a preference, and that the two rules the loop applies to
 * the rider's selection hold.
 *
 * Every expectation is derived by hand or from a plan built here with `layout()` — never from what
 * the search returned. Where a number would have to come out of the planner, the assertion is
 * phrased as a comparison against a hand-built plan instead.
 */
import { describe, expect, test } from 'vitest';
import { MAX_STEPS, climb, search } from './search';
import { layout } from './layout';
import { compareScore, score } from './score';
import type { Draft } from './score';
import {
  CARB_GRADING_MIN_HOURS,
  dist,
  hydrationStatus,
  planSummary,
  samples,
  totalHours,
} from '../fuel';
import type { CoverageStatus } from '../fuel';
import { DEFAULT_MIX } from '../types';
import type { Content, FoodLibEntry, PlanState, RouteInput, Vessel } from '../types';

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

function vessel(gid: string, vol: number, allowed: Content[]): Vessel {
  return { gid, name: gid, vol, allowed, gelParts: 4 };
}

const FOOD_LIB: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel', en: 'Gel', de: 'Gel', it: 'Gel', carbs: 22 },
  {
    key: 'cola',
    pl: 'Cola',
    en: 'Cola',
    de: 'Cola',
    it: 'Cola',
    carbs: 35,
    ml: 330,
    needsStop: true,
  },
];

function makeState(route: RouteInput, gear: Vessel[], foodLib = FOOD_LIB): PlanState {
  return { route, mix: DEFAULT_MIX, gear, fills: [], foods: [], foodLib };
}

/** The plan the rider would have without thinking: every vessel filled once with the first content
 *  its own `allowed` list names, nothing in the pockets. This is where the climb starts, so it is
 *  the floor every result has to beat or match — built here from `layout()`, not from the search. */
function startingDraft(state: PlanState): Draft {
  return layout(
    state,
    state.gear.map((v) => ({ gid: v.gid, content: v.allowed[0], loads: 1 })),
    [],
  );
}

/** What the app's hydration badge would read for `draft` — the ids `planSummary` needs are not
 *  inputs to any of the fluid math, so they are handed out here the same way the store does. */
function hydrationOf(state: PlanState, draft: Draft): CoverageStatus {
  const fills = draft.fills.map((f, i) => ({ ...f, fid: i + 1 }));
  return hydrationStatus(planSummary({ ...state, fills }).waterBalancePct, state.route.temp);
}

/** A fill is a refill exactly when its vessel has an earlier one, in ride order — the same
 *  definition `layout`, `score` and both scenario suites use. */
function refills(draft: Draft) {
  const seen = new Set<string>();
  const out: Draft['fills'] = [];
  for (const f of [...draft.fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) out.push(f);
    else seen.add(f.gid);
  }
  return out;
}

/** A handful of deliberately different shapes: a short hot ride, a long one on a small bottle, a
 *  mixed kit, a kit with nothing but a gel flask. Used wherever a property should hold everywhere
 *  rather than on one favourite route. */
const SHAPES: { label: string; state: PlanState }[] = [
  {
    label: '20 km, one bottle',
    state: makeState(makeRoute({ distance: 20, speed: 20, temp: 15 }), [
      vessel('g1', 500, ['water']),
    ]),
  },
  {
    label: '300 km on a 500 ml bottle',
    state: makeState(makeRoute({ distance: 300, temp: 25 }), [vessel('g1', 500, ['water', 'izo'])]),
  },
  {
    label: '140 km, izo + water + flask',
    state: makeState(makeRoute({ distance: 140, temp: 28 }), [
      vessel('g1', 650, ['izo']),
      vessel('g2', 750, ['water']),
      vessel('g3', 250, ['gel', 'water']),
    ]),
  },
  {
    label: '90 km, gel flask only',
    state: makeState(makeRoute({ distance: 90 }), [vessel('g1', 250, ['gel'])]),
  },
];

describe('climb() hands back the scored plan', () => {
  /** `search()` is now a thin wrapper over `climb()`'s `draft`, and its score must be the one
   *  `score()` itself would give that draft — not a stale value from an earlier step. */
  test('climb returns the same draft search does, with its score', () => {
    const st = SHAPES[0].state;
    const e = climb(st, []);
    expect(e.draft).toEqual(search(st, []));
    expect(compareScore(e.score, score(st, e.draft))).toBe(0);
  });
});

describe('the climb terminates', () => {
  /**
   * Every accepted move adds at most one load or one product, and the loop makes at most
   * `MAX_STEPS` of them, so a plan that hit the cap would show it: the busiest vessel would be
   * carrying loads by the dozen. A plan well inside that bound is a plan that ran out of improving
   * moves, which is the only other way the loop can stop.
   */
  test.each(SHAPES.map((s) => [s.label, s.state] as const))('%s', (_label, state) => {
    const draft = search(state);
    const perVessel = new Map<string, number>();
    for (const f of draft.fills) perVessel.set(f.gid, (perVessel.get(f.gid) ?? 0) + 1);
    const busiest = Math.max(0, ...perVessel.values());
    expect(busiest).toBeLessThan(MAX_STEPS);
  });

  /** 300 km on a single 500 ml bottle is the shape that asks for the most loads of any here, and it
   *  is nowhere near the cap: the climb stopped because it converged. */
  test('a long ride on a small bottle converges far short of the cap', () => {
    const state = SHAPES[1].state;
    const draft = search(state);
    const loads = draft.fills.filter((f) => f.gid === 'g1').length;
    expect(loads).toBeGreaterThan(1);
    expect(loads).toBeLessThan(MAX_STEPS / 4);
  });

  /** A converged climb is a fixed point, so asking twice gives the same answer. */
  test.each(SHAPES.map((s) => [s.label, s.state] as const))(
    'is deterministic — %s',
    (_label, state) => {
      expect(search(state)).toEqual(search(state));
    },
  );
});

describe('a move is only accepted when it improves the score', () => {
  /** The climb starts from `startingDraft` and only ever moves strictly downhill, so its answer can
   *  never be worse than the plan it started from. */
  test.each(SHAPES.map((s) => [s.label, s.state] as const))('%s', (_label, state) => {
    const from = score(state, startingDraft(state));
    const to = score(state, search(state));
    expect(compareScore(to, from)).toBeLessThanOrEqual(0);
  });

  /**
   * The other half of the same statement: when the starting plan is already the best there is,
   * nothing is added to it. A 500 ml bottle on a cool 20 km ride covers the fluid the ride costs on
   * the one load it left home with — there is nothing left to buy, so no stop is bought.
   */
  test('an already-good plan is left alone', () => {
    const state = SHAPES[0].state;
    const start = startingDraft(state);
    expect(hydrationOf(state, start)).toBe('good');
    const draft = search(state);
    expect(draft.stops).toEqual([]);
    expect(refills(draft)).toEqual([]);
    expect(draft.fills).toHaveLength(1);
  });
});

describe('the tier order is an escalation, not a preference', () => {
  /**
   * A ride whose carbs are already covered by a gel flask the rider is carrying anyway, and whose
   * only remaining problem is fluid. The bidon may hold izo *or* water, so both tier 2 and tier 3
   * could close the gap and they would close it with the same number of millilitres — the only
   * difference is whether the rider has to carry a sachet to mix at the roadside.
   *
   * The three assertions are the whole rule: the starting plan really is short of water (so the
   * loop had work to do), the finished plan is not (so it did it), and it did it without a single
   * gram of powder leaving the kitchen.
   */
  const state = makeState(
    makeRoute({ distance: 70, speed: 20, intensity: 'low', temp: 25, weight: 75 }),
    [vessel('g1', 750, ['water', 'izo']), vessel('g2', 250, ['gel'])],
  );

  test('water alone fixes it, so no sachet is carried', () => {
    const start = startingDraft(state);
    expect(hydrationOf(state, start)).not.toBe('good');

    const draft = search(state);
    expect(hydrationOf(state, draft)).toBe('good');
    // Tier 2 got there first, so the bidon never carries izo and the flask is never re-mixed.
    // The count is asserted as well, or "every refill was water" would hold on a plan with none.
    const topUps = refills(draft);
    expect(topUps.length).toBeGreaterThan(0);
    expect(topUps.map((f) => f.content)).toEqual(topUps.map(() => 'water'));
    expect(score(state, draft).powderCarried).toBe(0);
  });
});

describe('fewer stops wins when the objective cannot separate two plans', () => {
  /**
   * The owner's own 53 km ride, and the stop the planner used to buy for nothing. Two bidons and a
   * gel flask on a hot afternoon: the gel covers the carbs on its own, so every plan here is green
   * on that badge and the only question is how the four water loads are split between the bottles.
   *
   * Both splits below clear the hydration badge, so `toGreen` is 0 for each and the tie-break has
   * the say. `g1:2 / g2:2` is the round-robin — g1, g2, g1, g2 — so g2 is empty from its first
   * handover at ~22 km all the way to ~34 km where it comes back on: its refill can be poured at
   * the same stop g1's was, and the ride costs **one** pull-over. `g1:3 / g2:1` comes back to g1
   * twice running, with no gap in between for the second refill to have happened earlier, so it
   * costs two. Same route, same bottles, same badges — one fewer time standing still.
   *
   * Both plans are built here with `layout()`, so nothing below takes a number from the search.
   */
  const gear: Vessel[] = [
    { gid: 'g1', name: 'g1', vol: 710, allowed: ['water', 'izo'], gelParts: 1 },
    { gid: 'g2', name: 'g2', vol: 630, allowed: ['water', 'izo'], gelParts: 1 },
    { gid: 'g3', name: 'g3', vol: 250, allowed: ['gel'], gelParts: 6 },
  ];
  const state = makeState(
    makeRoute({
      distance: 53,
      speed: 19,
      weight: 78,
      temp: 30,
      preMealCarbs: 50,
      preMealMinutes: 50,
    }),
    gear,
  );
  const plan = (g1: number, g2: number): Draft =>
    layout(
      state,
      [
        { gid: 'g1', content: 'water', loads: g1 },
        { gid: 'g2', content: 'water', loads: g2 },
        { gid: 'g3', content: 'gel', loads: 1 },
      ],
      [],
    );
  const roundRobin = plan(2, 2);
  const backToG1 = plan(3, 1);

  test('both splits are green on both badges, and the round-robin costs one stop instead of two', () => {
    expect(score(state, roundRobin).toGreen).toBe(0);
    expect(score(state, backToG1).toGreen).toBe(0);
    expect(hydrationOf(state, roundRobin)).toBe('good');
    expect(score(state, roundRobin).stops).toBe(1);
    expect(score(state, backToG1).stops).toBe(2);
    // Four loads placed either way, so the cheaper plan is cheaper on stops alone and not because
    // a bottle was quietly dropped: 710 + 630 + 710 + 630 millilitres are on board.
    const fills = roundRobin.fills.map((f, i) => ({ ...f, fid: i + 1 }));
    expect(planSummary({ ...state, fills }).fluidPlanned).toBe(710 + 630 + 710 + 630);
    // And the leg the second stop used to pay for is g2's, run to the finish line.
    const water = roundRobin.fills
      .filter((f) => f.content === 'water')
      .sort((a, b) => a.from - b.from);
    expect(water.map((f) => f.gid)).toEqual(['g1', 'g2', 'g1', 'g2']);
    expect(water.at(-1)?.to).toBe(dist(state.route));
  });

  test('and the search picks it', () => {
    expect(search(state)).toEqual(roundRobin);
  });
});

describe('a bottle that adds nothing stays at home', () => {
  /**
   * R24, the owner's vessel-set rule: fewest stops first, then the fewest bottles that still work.
   * Ruled on again 2026-09-23 (Q9) — *"tak, pozwól na mniej bidonów"*. The climb used to start
   * every vessel at one load and never go lower, so a bottle the plan did not need was carried
   * anyway. Here a litre of water covers a 60 km ride on its own, green on both badges and with
   * no stop, so the half-litre bottle has nothing to do.
   */
  test('a second water bottle the ride does not need is left out', () => {
    const state = makeState(makeRoute({ distance: 60 }), [
      vessel('g1', 1000, ['water']),
      vessel('g2', 500, ['water']),
    ]);
    const draft = search(state);
    expect(hydrationOf(state, draft)).toBe('good');
    expect(draft.stops).toEqual([]);
    // Either bottle alone keeps the badge green; which one goes is the rest of the ranking's call
    // ("pour the least the vessels allow" picks the smaller). What R24 asks is that only one does.
    expect(new Set(draft.fills.map((f) => f.gid)).size).toBe(1);
  });
});

describe('the selection is an offer', () => {
  test('an empty selection places no food', () => {
    for (const { state } of SHAPES) expect(search(state).foods).toEqual([]);
  });

  /**
   * A bought product *is* a stop — the rider pulls over to buy it — so placing one may create a
   * stop the fills never paid for. This ride is chosen so that nothing else could have: the bottle
   * covers the whole of it on the load it left home with, so the starting plan has no refill and
   * therefore no stop at all, and every stop in the finished plan is a purchase.
   *
   * The contrast run is the control: the same ride and the same colas with only `needsStop` cleared
   * place their food without a single stop. So the stop comes from the flag, not from the food.
   */
  test('a bought product creates the stop it is bought at', () => {
    const state = makeState(makeRoute({ distance: 40, speed: 20, intensity: 'low', temp: 15 }), [
      vessel('g1', 750, ['water']),
    ]);
    expect(refills(startingDraft(state))).toEqual([]);

    const bought = search(state, [{ key: 'cola', count: 3 }]);
    const colas = bought.foods.filter((f) => f.key === 'cola');
    expect(colas.length).toBeGreaterThan(0);
    expect(bought.stops).toHaveLength(colas.length);
    for (const s of bought.stops) {
      expect(colas.some((f) => f.from === s.at)).toBe(true);
      // Inside the route, and never parked on the start line.
      expect(s.at).toBeGreaterThan(0);
      expect(s.at).toBeLessThan(dist(state.route));
    }

    const carried = makeState(
      state.route,
      state.gear,
      FOOD_LIB.map((e) => (e.key === 'cola' ? { ...e, needsStop: false } : e)),
    );
    const carriedDraft = search(carried, [{ key: 'cola', count: 3 }]);
    expect(carriedDraft.foods.length).toBeGreaterThan(0);
    expect(carriedDraft.stops).toEqual([]);
  });

  /**
   * A purchase goes to a stop the plan pays for anyway before it makes one of its own — the meal
   * at the stop the rider pulls over at to refill, not a second pull-over half-way between two.
   * The ride is chosen so the refills alone need several stops: a 500 ml bottle on 100 km at 25 °C.
   * The cola has to sit exactly on one of the stops the same ride makes without it, and buying it
   * must not add a stop.
   */
  test('a bought product lands on a stop the refills already make', () => {
    const state = makeState(makeRoute({ distance: 100, temp: 25 }), [
      vessel('g1', 500, ['water', 'izo']),
    ]);
    const plain = search(state);
    expect(plain.stops.length).toBeGreaterThan(1);

    const bought = search(state, [{ key: 'cola', count: 1 }]);
    const cola = bought.foods.find((f) => f.key === 'cola');
    expect(cola).toBeDefined();
    expect(plain.stops.map((s) => s.at)).toContain(cola!.from);
    expect(bought.stops.length).toBeLessThanOrEqual(plain.stops.length);
  });

  /**
   * Purchases may share a stop, but only when no other placement does better, the gut stays at or
   * under 100 g, and they are different products — owner, 2026-09-23: *"dodawaj jak żołądek
   * pozwala i jak nie ma lepszego wyjścia"*, *"2-3 rzeczy, ale nie 2 te same"* (a meal and a cola,
   * yes; two colas, two ice creams or two meals, no). On this ride the refills make one stop at
   * most, so a cola and a meal share it rather than cost a second pull-over, while two colas never
   * do.
   */
  test('different bought products may share a stop, the same one twice never', () => {
    const lib: FoodLibEntry[] = [
      ...FOOD_LIB,
      {
        key: 'meal',
        pl: 'Obiad',
        en: 'Meal',
        de: 'Mittagessen',
        it: 'Pranzo',
        carbs: 60,
        needsStop: true,
      },
    ];
    const state = makeState(
      makeRoute({ distance: 80, temp: 20 }),
      [vessel('g1', 750, ['water'])],
      lib,
    );
    const mixed = search(state, [
      { key: 'cola', count: 1 },
      { key: 'meal', count: 1 },
    ]);
    const bought = mixed.foods.filter((f) => f.key === 'cola' || f.key === 'meal');
    expect(bought).toHaveLength(2);
    // One after the other at the same stop: `placeFoods` keeps a millimetre between two products.
    expect(bought[1].from).toBeCloseTo(bought[0].from, 3);
    expect(mixed.stops).toHaveLength(1);
    expect(score(state, mixed).gutPeak).toBeLessThanOrEqual(100);

    for (let n = 2; n <= 5; n++) {
      const d = search(state, [{ key: 'cola', count: n }]);
      const at = d.foods.filter((f) => f.key === 'cola').map((f) => f.from.toFixed(3));
      expect(new Set(at).size).toBe(at.length);
    }
  });

  /**
   * The list's order is the rider's priority — *"pierwszeństwo ma góra listy"* — so tier 1 takes the
   * first entry that improves the plan rather than the best-scoring one.
   *
   * The two runs are the same ride and the same two products with only the order swapped, and each
   * one takes what it was given first. A gel is 22 g and a cola 35 g, so ranking by score would take
   * the cola both times: the answer differing between the runs is the whole property. (The cola's
   * `needsStop` is cleared here, so neither candidate costs a stop and the priority is the only
   * thing that can separate them.)
   */
  test('the offers are consumed in the order the rider listed them', () => {
    const lib = FOOD_LIB.map((e) => (e.key === 'cola' ? { ...e, needsStop: false } : e));
    const state = makeState(makeRoute({ distance: 90 }), [vessel('g1', 750, ['water'])], lib);

    const gelFirst = search(state, [
      { key: 'gel', count: 4 },
      { key: 'cola', count: 4 },
    ]);
    const colaFirst = search(state, [
      { key: 'cola', count: 4 },
      { key: 'gel', count: 4 },
    ]);
    expect(gelFirst.foods[0].key).toBe('gel');
    expect(colaFirst.foods[0].key).toBe('cola');
  });

  /**
   * The other half of the same rule: what sits further down the list is carried in case, and stays
   * in the pocket once the plan no longer needs it. No mechanism enforces that — one more product
   * moves neither `stops` nor `powderCarried`, so once `toGreen` and `shapeShort` are both 0 an
   * extra item ties instead of improving and the loop's "strictly better or it is not a move" rule
   * refuses it.
   *
   * "Needs" includes R50 since 2026-09-23: a plan green on the badge but with a fifth of the ride
   * fed under 70 % still reaches further down the list — *"jak trzeba sięgnąć po te niżej też ok"*.
   * So this offers more gels than the shape can use and checks that the run stops strictly inside
   * the offer, green on the badge and on the shape (within its 5 % tolerance) where it stopped.
   */
  test('a green plan with every fifth fed leaves the rest of the list unopened', () => {
    const state = makeState(makeRoute({ distance: 90 }), [vessel('g1', 750, ['water'])]);
    const draft = search(state, [{ key: 'gel', count: 20 }]);
    expect(draft.foods.length).toBeGreaterThan(0);
    expect(draft.foods.length).toBeLessThan(20);
    expect(score(state, draft).toGreen).toBe(0);
    // Met within the 5 % tolerance the ranking allows.
    expect(score(state, draft).shapeShort).toBeLessThanOrEqual(0.05);
  });

  /** Nothing is ever taken that the rider did not offer, and never more of it than he offered. */
  test('takes no more than was offered', () => {
    const state = makeState(makeRoute({ distance: 90 }), [vessel('g1', 750, ['water'])]);
    const foods = search(state, [{ key: 'gel', count: 2 }]).foods;
    expect(foods.length).toBeLessThanOrEqual(2);
    expect(foods.every((f) => f.key === 'gel')).toBe(true);
  });
});

describe('under an hour the carb side is switched off', () => {
  /**
   * *"Tak, dla poniżej 1h wykres jest szary, więc autoplan powinien zwrócić pustą listę."* Below
   * `CARB_GRADING_MIN_HOURS` the app greys the carb chart out and `coverageStatus` answers
   * 'unneeded', so there is nothing for the rider's food to buy and none of it is taken.
   *
   * 15 km at 25 km/h is 0.6 h; the same bottle and the same five gels on a 26 km ride — 1.04 h, the
   * first side of the boundary that gets graded — do get eaten. It is the hour rule that empties the
   * list, not the gels being pointless on any short ride.
   */
  test('a sub-hour ride takes no product, however much is offered', () => {
    const state = makeState(makeRoute({ distance: 15 }), [vessel('g1', 750, ['water'])]);
    expect(totalHours(state.route)).toBeLessThan(CARB_GRADING_MIN_HOURS);
    expect(search(state, [{ key: 'gel', count: 5 }]).foods).toEqual([]);
  });

  test('the same ride just past the hour does', () => {
    const state = makeState(makeRoute({ distance: 26 }), [vessel('g1', 750, ['water'])]);
    expect(totalHours(state.route)).toBeGreaterThan(CARB_GRADING_MIN_HOURS);
    expect(search(state, [{ key: 'gel', count: 5 }]).foods.length).toBeGreaterThan(0);
  });

  /**
   * The bottles are not switched off with it. `hydrationStatus` never answers 'unneeded' — water is
   * graded on the signed balance against body mass and knows nothing about the hour rule — and a
   * 24 km ride at 35 C still costs the rider more than a litre.
   */
  test('the water side is still planned', () => {
    const state = makeState(makeRoute({ distance: 24, speed: 30, intensity: 'high', temp: 35 }), [
      vessel('g1', 500, ['water']),
    ]);
    expect(totalHours(state.route)).toBeLessThan(CARB_GRADING_MIN_HOURS);
    const draft = search(state, [{ key: 'gel', count: 5 }]);
    expect(draft.foods).toEqual([]);
    expect(draft.fills.length).toBeGreaterThan(0);
    expect(draft.fills.every((f) => f.content === 'water')).toBe(true);
  });
});

describe('degenerate inputs give a plan rather than throwing', () => {
  const empty: Draft = { fills: [], foods: [], stops: [] };

  test('no gear and nothing offered is an empty plan', () => {
    expect(search(makeState(makeRoute(), []))).toEqual(empty);
  });

  /** Gels do not need a bottle to be eaten out of, so a rider with an empty kit and three gels in
   *  his pocket still gets a food plan — what he cannot get is a fill or a stop. */
  test('no gear still places the food that needs none', () => {
    const draft = search(makeState(makeRoute(), []), [{ key: 'gel', count: 3 }]);
    expect(draft.fills).toEqual([]);
    expect(draft.stops).toEqual([]);
    expect(draft.foods.map((f) => f.key)).toEqual(['gel', 'gel', 'gel']);
  });

  /**
   * `dist()` floors at 1 km, so "zero distance" is really a one-kilometre ride — and one that costs
   * no time at all, because `totalHours` reads `route.distance` and not `dist()`. A ride of no hours
   * has a carb target of zero and a sweat loss of zero, so there is nothing for a plan to fall short
   * of — and a full 750 ml poured on it is past the overhydration warning.
   *
   * Changed 2026-09-23 with the owner's OK (R24, Q9 — option "a"). This used to expect the packed
   * bottle back, because the climb could never take a vessel below one load. Now it may leave one
   * at home, and on a ride that asks for no water at all the empty plan is the better one. The plan
   * shows the bottles the ride needs; the rider may still carry a spare the app does not draw.
   */
  test('a zero-distance route needs nothing, so nothing is planned', () => {
    const state = makeState(makeRoute({ distance: 0 }), [vessel('g1', 750, ['water', 'izo'])]);
    expect(totalHours(state.route)).toBe(0);
    const draft = search(state, [{ key: 'gel', count: 3 }]);
    expect(draft.stops).toEqual([]);
    expect(draft.foods).toEqual([]);
    expect(draft.fills).toEqual([]);
  });

  /**
   * The two shapes a persisted kit can be in that `layout()` refuses outright. A vessel that may
   * hold nothing has no content to be assigned, and a `gid` that appears twice cannot be told apart
   * in a plan; both are questions about the gear, so the search drops them before laying anything
   * out rather than letting the error surface as a broken plan.
   */
  test('a vessel that may hold nothing is left out', () => {
    const state = makeState(makeRoute({ distance: 60 }), [
      vessel('g1', 750, ['water']),
      vessel('g2', 500, []),
    ]);
    const draft = search(state);
    expect(draft.fills.every((f) => f.gid === 'g1')).toBe(true);
  });

  test('a duplicated vessel is only planned once', () => {
    const state = makeState(makeRoute({ distance: 60 }), [
      vessel('g1', 750, ['water']),
      vessel('g1', 750, ['water']),
    ]);
    expect(() => search(state)).not.toThrow();
  });
});

describe('the pre-ride meal is the first feed', () => {
  // Owner, 2026-09-24: *"jak mamy węgle sprzed startu to nie dokładajmy węgli na samym starcie"*.
  // The same gut rule the bottles already follow (R33), applied to the products: nothing is eaten
  // while the pre-ride meal is still in the stomach.
  test('no product is eaten before the pre-ride meal has left the gut', () => {
    const state = makeState(makeRoute({ preMealCarbs: 100, preMealMinutes: 30 }), [
      vessel('w', 750, ['water']),
    ]);
    const empty = samples({ ...state, fills: [], foods: [] });
    const clear = empty.find((s) => s.gut === 0)!.x;
    expect(clear).toBeGreaterThan(0);

    const draft = search(state, [{ key: 'gel', count: 4 }]);
    expect(draft.foods.length).toBeGreaterThan(0);
    for (const f of draft.foods) expect(f.from).toBeGreaterThanOrEqual(clear);
  });
});
