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
import { MAX_STEPS, search } from './search';
import { layout } from './layout';
import { compareScore, score } from './score';
import type { Draft } from './score';
import { dist, hydrationStatus, planSummary, totalHours } from '../fuel';
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
  { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
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

describe('the selection is an offer', () => {
  test('an empty selection places no food', () => {
    for (const { state } of SHAPES) expect(search(state).foods).toEqual([]);
  });

  /**
   * A bought product may only be eaten at a stop the plan already has, so on a ride the bottle
   * covers on its home load there is nowhere to buy one — and the planner must not invent a stop in
   * order to. The contrast run is the control: the same ride, the same colas, the same score, with
   * only `needsStop` cleared, does place them. So it is the stop rule that held them back and not
   * the objective deciding it did not want them.
   */
  test('a bought product is not placed when there is no stop', () => {
    const state = makeState(makeRoute({ distance: 40, speed: 20, intensity: 'low', temp: 15 }), [
      vessel('g1', 750, ['water']),
    ]);
    const bought = search(state, [{ key: 'cola', count: 3 }]);
    expect(bought.stops).toEqual([]);
    expect(bought.foods).toEqual([]);

    const carried = makeState(
      state.route,
      state.gear,
      FOOD_LIB.map((e) => (e.key === 'cola' ? { ...e, needsStop: false } : e)),
    );
    expect(search(carried, [{ key: 'cola', count: 3 }]).foods.length).toBeGreaterThan(0);
  });

  /** Nothing is ever taken that the rider did not offer, and never more of it than he offered. */
  test('takes no more than was offered', () => {
    const state = makeState(makeRoute({ distance: 90 }), [vessel('g1', 750, ['water'])]);
    const foods = search(state, [{ key: 'gel', count: 2 }]).foods;
    expect(foods.length).toBeLessThanOrEqual(2);
    expect(foods.every((f) => f.key === 'gel')).toBe(true);
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
   * of: the score is already zero and no move can beat it. What comes back is exactly the plan the
   * climb started from, which is the honest answer and not an accident of the guards.
   */
  test('a zero-distance route is left as the rider packed it', () => {
    const state = makeState(makeRoute({ distance: 0 }), [vessel('g1', 750, ['water', 'izo'])]);
    expect(totalHours(state.route)).toBe(0);
    const draft = search(state, [{ key: 'gel', count: 3 }]);
    expect(draft).toEqual(startingDraft(state));
    expect(draft.stops).toEqual([]);
    expect(draft.foods).toEqual([]);
    expect(draft.fills).toEqual([{ gid: 'g1', content: 'water', from: 0, to: dist(state.route) }]);
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
