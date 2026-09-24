/**
 * `runAutoplan()` is the whole of what the worker does: post the climb, then every strictly
 * better plan `improve()` finds, then `done` — no matter how the engine ends. The worker
 * boundary itself (`autoplan.worker.ts`) is just a `postMessage` wrapper around this and is not
 * tested here for the same reason nothing else in `src/domain/` imports `jsdom`'s worker shims.
 */
import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_MIX } from '../types';
import type { Content, FoodLibEntry, PlanState, RouteInput, Vessel } from '../types';
import { compareScore, score } from './score';
import type { Draft } from './score';
import type { AutoplanMessage } from './run';
import { runAutoplan } from './run';
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
  return { route, mix: DEFAULT_MIX, gear, fills: [], foods: [], foodLib: FOOD_LIB };
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

/** `AutoplanMessage` doesn't carry a score — `run.ts`'s own `toResult` throws it away — so this
 *  recomputes it from the same state the message was built from, the same way `score()` grades
 *  any other draft. `newStops` and `Draft.stops` are the same shape under different names
 *  (types.ts), so no cast is needed. */
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
      (m): m is { type: 'plan'; result: AutoplanResult } => m.type === 'plan',
    );
    for (let i = 1; i < plans.length; i++) {
      expect(compareScore(scoreOf(plans[i].result), scoreOf(plans[i - 1].result))).toBeLessThan(0);
    }
  }, 20000); // 20s: under the full suite's parallel load, this real climb()+improve() run can
  // outrun the default 5s timeout on CPU contention alone — see exhaustive.test.ts's fixtures.

  // vol: NaN doesn't actually make the engine throw — the NaN just propagates through the
  // arithmetic — so this only pins the ordinary no-throw path; the catch/log path below is what
  // exercises the actual error handling, via the injected `deps.improve` seam.
  test('an engine error still ends with done, keeping what was posted', () => {
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
    const msgs: AutoplanMessage[] = [];
    runAutoplan(state, sel, (m) => msgs.push(m), {
      improve: () => {
        throw new Error('x');
      },
    });

    expect(msgs.at(-1)).toEqual({ type: 'done' });
    expect(msgs[0].type).toBe('plan'); // the climb was posted before the engine blew up
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
