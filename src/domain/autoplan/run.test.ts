/**
 * `runAutoplan()` is the whole of what the worker does: post the climb, then every strictly
 * better plan `improve()` finds, then `done` — no matter how the engine ends. The worker
 * boundary itself (`autoplan.worker.ts`) is just a `postMessage` wrapper around this and is not
 * tested here for the same reason nothing else in `src/domain/` imports `jsdom`'s worker shims.
 */
import { describe, expect, test, vi } from 'vitest';
import { LEGACY_TEST_MIX } from '../__fixtures__/legacyMix';
import type { Content, FoodLibEntry, PlanState, RouteInput, Vessel } from '../types';
import { compareScore, score } from './score';
import type { Draft, Score } from './score';
import type { AutoplanMessage } from './run';
import { CLIMB_ORDER, replaces, runAutoplan } from './run';
import type { AutoplanResult, FoodSelectionEntry } from './types';

function makeRoute(o: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 60,
    speed: 25,
    hours: 0,
    minutes: 0,
    weight: 75,
    preMealCarbs: 0,
    preMealMinutes: 0,
    intensity: 'mid',
    temp: 22,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...o,
  };
}

function vessel(gid: string, vol: number, allowed: Content[], gelParts = 1): Vessel {
  return { gid, name: gid, vol, allowed, gelParts };
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

function makeState(route: RouteInput, gear: Vessel[]): PlanState {
  return { route, mix: LEGACY_TEST_MIX, gear, fills: [], foods: [], foodLib: FOOD_LIB };
}

// Small enough to run fast, big enough that `improve()` still has at least one strictly-better
// plan to find past the climb's own answer (see exhaustive.test.ts's "twins kit").
const state = makeState(makeRoute(), [
  vessel('g1', 700, ['water', 'izo']),
  vessel('g2', 700, ['water', 'izo']),
  vessel('g3', 250, ['gel'], 6),
]);
const sel: FoodSelectionEntry[] = [
  { key: 'gel', count: 2 },
  { key: 'cola', count: 1 },
];

/** Recomputed from the plan itself rather than read off the message's own `score`, so the test
 *  does not take the worker's word for the thing it checks — from the same state the message was
 *  built from, the same way `score()` grades any other draft. `newStops` and `Draft.stops` are the
 *  same shape under different names (types.ts), so no cast is needed. */
function scoreOf(result: AutoplanResult) {
  const draft: Draft = { fills: result.fills, foods: result.foods, stops: result.newStops };
  return score(state, draft);
}

describe('runAutoplan', () => {
  test('posts the climb first, then only strictly better plans, then done', () => {
    const msgs: AutoplanMessage[] = [];
    runAutoplan(state, sel, (m) => msgs.push(m));

    expect(msgs.length).toBeGreaterThan(2); // at least one plan past the climb's own, plus done
    expect(msgs[0].type).toBe('plan');
    expect(msgs.at(-1)).toEqual({ type: 'done' });

    const plans = msgs.filter(
      (m): m is Extract<AutoplanMessage, { type: 'plan' }> => m.type === 'plan',
    );
    for (let i = 1; i < plans.length; i++) {
      expect(compareScore(scoreOf(plans[i].result), scoreOf(plans[i - 1].result))).toBeLessThan(0);
    }
  }, 20000); // 20s: under the full suite's parallel load, this real climb()+improve() run can
  // outrun the default 5s timeout on CPU contention alone — see exhaustive.test.ts's fixtures.

  // vol: NaN doesn't actually make the engine throw — the NaN just propagates through the
  // arithmetic — so this only pins the ordinary no-throw path; the catch/log path below is what
  // exercises the actual error handling, via the injected `deps.improve` seam.
  test('a malformed vessel still ends with done', () => {
    const msgs: AutoplanMessage[] = [];
    runAutoplan(
      { ...state, gear: [{ gid: 'x', name: 'x', vol: NaN, allowed: ['water'], gelParts: 1 }] },
      [],
      (m) => msgs.push(m),
    );

    expect(msgs.at(-1)).toEqual({ type: 'done' });
  });

  test('an injected engine error still ends with done and is logged (test-only seam)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const msgs: AutoplanMessage[] = [];
      runAutoplan(state, sel, (m) => msgs.push(m), {
        improve: () => {
          throw new Error('x');
        },
      });

      expect(msgs.at(-1)).toEqual({ type: 'done' });
      expect(msgs[0].type).toBe('plan'); // the climb was posted before the engine blew up
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe('runAutoplan, one share of several', () => {
  test('posts the climb first, then only plans from its own share, then done', () => {
    const msgs: AutoplanMessage[] = [];
    runAutoplan(state, sel, (m) => msgs.push(m), undefined, undefined, { index: 1, count: 2 });

    expect(msgs[0]).toMatchObject({ type: 'plan', order: CLIMB_ORDER });
    expect(msgs.at(-1)).toEqual({ type: 'done' });
    for (const m of msgs.slice(1, -1)) {
      expect(m.type === 'plan' && m.order % 2).toBe(1);
    }
  }, 20000);
});

describe('replaces', () => {
  const at = (toGreen: number, order: number) => ({
    score: {
      toGreen,
      shapeShort: 0,
      stops: 0,
      bottles: 1,
      powderCarried: 0,
      gutPeak: 0,
    } satisfies Score,
    order,
  });

  test('the first plan to arrive is shown', () => {
    expect(replaces(at(0.5, 7), null)).toBe(true);
  });

  test('a better plan replaces a worse one, wherever it sits in the order', () => {
    expect(replaces(at(0.1, 9), at(0.5, 2))).toBe(true);
    expect(replaces(at(0.5, 2), at(0.1, 9))).toBe(false);
  });

  test('on a tie the earlier plan stays — the one a single search would have kept', () => {
    expect(replaces(at(0.1, 3), at(0.1, 9))).toBe(true);
    expect(replaces(at(0.1, 9), at(0.1, 3))).toBe(false);
    expect(replaces(at(0.1, 4), at(0.1, CLIMB_ORDER))).toBe(false);
  });
});
