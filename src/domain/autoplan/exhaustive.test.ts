/**
 * The bounds `improve()`'s cuts rely on, and its own behaviour: every plan it yields is strictly
 * better than the one before, and once it is done nothing on the whole board beats its answer.
 *
 * The "bounds" tests are not about `improve()` itself — they pin the facts cut 3 assumes about
 * `evaluate()`/`score()` on the search's *own* space, independent of any pruning. Two other cuts
 * from the original design (twin dedup, a stop-count cut) turned out to rely on assumptions that
 * do *not* hold — see the counterexample tests below, and the comment at the top of
 * `exhaustive.ts` (ruling R3, 2026-09-24) for why neither cut is implemented.
 */
import { describe, expect, test } from 'vitest';
import { planSummary } from '../fuel';
import { DEFAULT_MIX } from '../types';
import type { Content, FoodLibEntry, PlanState, RouteInput, Vessel } from '../types';
import { improve, packedCaps } from './exhaustive';
import { oracle } from './oracle';
import { compareScore } from './score';
import { climb, decisionAt, evaluate, space } from './search';
import type { Decision, Evaluated } from './search';
import type { FoodSelectionEntry } from './types';

function makeRoute(o: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 70,
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

/** Every fixture offers the same selection: two gels and a bought cola. */
const SELECTION: FoodSelectionEntry[] = [
  { key: 'gel', count: 2 },
  { key: 'cola', count: 1 },
];

/**
 * Three small kits, all inside 60–90 km / 20–28 °C — as in `oracle.test.ts` — and none over ~1200
 * points, so `npm test` stays fast. `twins` is the only one with a matched vessel pair.
 */
const twins = makeState(makeRoute({ distance: 60, temp: 22 }), [
  vessel('g1', 700, ['water', 'izo']),
  vessel('g2', 700, ['water', 'izo']),
  vessel('g3', 250, ['gel'], 6),
]);

const waterIzo = makeState(makeRoute({ distance: 80, temp: 20 }), [
  vessel('g1', 700, ['izo']),
  vessel('g2', 600, ['water']),
  vessel('g3', 300, ['gel'], 6),
]);

const bladderFlask = makeState(makeRoute({ distance: 90, temp: 28 }), [
  vessel('g1', 1200, ['water']),
  vessel('g2', 250, ['gel'], 6),
]);

const FIXTURES = [
  ['twins kit', twins, SELECTION] as const,
  ['water+izo kit', waterIzo, SELECTION] as const,
  ['bladder+flask kit', bladderFlask, SELECTION] as const,
];

describe('the bounds the cuts rely on', () => {
  test.each(FIXTURES)(
    '%s: credited carbs and planned fluid never exceed what was packed',
    (_, st, sel) => {
      const s = space(st, sel);
      for (let n = 0; n < s.size; n++) {
        const d = decisionAt(s, n);
        const e = evaluate(st, s.offers, d);
        const sum = planSummary({
          ...st,
          fills: e.draft.fills.map((f, i) => ({ ...f, fid: i + 1 })),
          foods: e.draft.foods.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
        });
        expect(sum.coveredCarbs).toBeLessThanOrEqual(sum.totalCarbs + 1e-6);
        const { fluidCap, carbCap } = packedCaps(st, s, d);
        expect(sum.fluidPlanned).toBeLessThanOrEqual(fluidCap + 1e-6);
        expect(sum.totalCarbs).toBeLessThanOrEqual(carbCap + 1e-6);
      }
    },
    20000,
  );

  /**
   * Pins the counterexample that ruled out building the top-up bound from a vessel's *own*
   * `loadCap` (R3 review, round 3): three 400 ml water-only bottles, refilled 10, 10 and 14 times
   * respectively, buy 16 stops between them, and the 150 ml water/gel flask — one gel load, no
   * loads of its own after that — gets topped up with water at all but one: 15 real top-ups (read
   * off `evaluate()`'s own draft, not asserted by hand), one *more* than the flask's own water
   * `loadCap`, which `space()` caps at `MAX_LOADS` (14) regardless of how many stops the rest of
   * the plan actually buys. `packedCaps()` — the real formula `unreachable()` calls, not a copy of
   * it — has to cover the flask's real `fluidPlanned` here without leaning on that cap.
   */
  test("a vessel can be topped up more times than its own loadCap allows, so packedCaps() can't be built from it", () => {
    const state = makeState(makeRoute({ distance: 250, temp: 32, speed: 22 }), [
      vessel('g1', 400, ['water']),
      vessel('g2', 400, ['water']),
      vessel('g3', 400, ['water']),
      vessel('g4', 150, ['gel', 'water'], 6),
    ]);
    const s = space(state, []);
    const decision: Decision = {
      assignment: [
        { gid: 'g1', content: 'water', loads: 10 },
        { gid: 'g2', content: 'water', loads: 10 },
        { gid: 'g3', content: 'water', loads: 14 },
        { gid: 'g4', content: 'gel', loads: 1 },
      ],
      counts: [],
    };
    const e = evaluate(state, s.offers, decision);
    const topUps = e.draft.fills.filter((f) => f.gid === 'g4' && f.content === 'water').length;
    const ownWaterLoadCap = Math.max(
      0,
      ...s.vessels[3].filter((o) => o.content === 'water').map((o) => o.loads),
    );
    expect(topUps).toBeGreaterThan(ownWaterLoadCap);

    const sum = planSummary({
      ...state,
      fills: e.draft.fills.map((f, i) => ({ ...f, fid: i + 1 })),
      foods: [],
    });
    const { fluidCap } = packedCaps(state, s, decision);
    expect(sum.fluidPlanned).toBeLessThanOrEqual(fluidCap + 1e-6);
  }, 20000);

  /**
   * Pins the counterexample that ruled out a stop-count cut (R3): `space()`'s `loadCap` deliberately
   * over-provisions a vessel's top load ("+1" beyond what covers the ride), and `layout.ts`'s
   * `relay()` stops the instant the route ends, so that top load can go unpoured. `g1` here is
   * assigned 4 water loads but the 60 km route is over after 3 are ever poured — 2 refills, 2
   * stops, not the `4 − 1 = 3` a stop-count cut would have assumed as a floor.
   */
  test("a vessel's top load can go unpoured, so stops can be below maxLoads − 1 (why there is no stop-count cut)", () => {
    const [, st, sel] = FIXTURES[0]; // twins kit
    const s = space(st, sel);
    const d = decisionAt(s, 4);
    const e = evaluate(st, s.offers, d);
    const maxLoads = Math.max(0, ...d.assignment.map((a) => a.loads));
    expect(maxLoads).toBe(4);
    expect(e.score.stops).toBeLessThan(maxLoads - 1);
  });

  /**
   * Pins the counterexample that ruled out twin dedup (R3): `layout.ts`'s relay is order-sensitive
   * — vessel array order *is* the handover order — so two identical vessels (`g1`, `g2`: same
   * `vol`/`gelParts`/`allowed`) with *different* load counts are not interchangeable. Swapping
   * which one comes first changes how wide the resulting refill's mergeable "empty window" is, and
   * so changes `stops` even though every other score field stays put.
   */
  test('swapping twin vessels can change the plan (why twins are not deduplicated)', () => {
    const [, st, sel] = FIXTURES[0]; // twins kit
    const s = space(st, sel);
    const d = decisionAt(s, 586);
    const swapped: Decision = {
      assignment: [d.assignment[1], d.assignment[0], ...d.assignment.slice(2)],
      counts: d.counts,
    };
    const e = evaluate(st, s.offers, d);
    const eSwapped = evaluate(st, s.offers, swapped);
    expect(compareScore(e.score, eSwapped.score)).not.toBe(0);
  });
});

describe('improve', () => {
  test.each(FIXTURES)(
    '%s: its last plan is the oracle’s best',
    (_, st, sel) => {
      const start = climb(st, sel);
      let best = start;
      for (const e of improve(st, sel, start)) best = e;
      expect(compareScore(best.score, oracle(st, sel, 1e6)!.best.score)).toBe(0);
    },
    20000,
  );

  test.each(FIXTURES)(
    '%s: every plan it yields is strictly better than the one before',
    (_, st, sel) => {
      let prev = climb(st, sel);
      for (const e of improve(st, sel, prev)) {
        expect(compareScore(e.score, prev.score)).toBeLessThan(0);
        prev = e;
      }
    },
    20000,
  );

  /**
   * `climb()` itself exhaustively scans any space at or under `EXHAUSTIVE_LIMIT` (search.ts) — the
   * bladder+flask kit's space (108 points) and the two ad hoc one-vessel fixtures below are all
   * under that limit, so starting `improve()` from `climb()`'s own answer there leaves it nothing
   * to do (it's already the oracle's best). Starting from `decisionAt(s, 0)` instead — every
   * vessel left home, nothing bought, the worst point in the space — forces `improve()` to do the
   * climbing itself, on the twins kit too (where `climb()`'s tiers can and do get stuck on a
   * ridge — see `search()`'s own doc comment).
   */
  test.each([FIXTURES[0], FIXTURES[2]])(
    '%s: from the worst possible start, still climbs to the oracle’s best, yielding several plans on the way',
    (_, st, sel) => {
      const s = space(st, sel);
      const start = evaluate(st, s.offers, decisionAt(s, 0));
      let prev = start;
      let yielded = 0;
      for (const e of improve(st, sel, start)) {
        expect(compareScore(e.score, prev.score)).toBeLessThan(0);
        prev = e;
        yielded += 1;
      }
      expect(yielded).toBeGreaterThan(1);
      expect(compareScore(prev.score, oracle(st, sel, 1e6)!.best.score)).toBe(0);
    },
    20000,
  );

  test('cut 3 actually prunes once the search has settled (twins kit)', () => {
    // Starting from the worst point again (see above), so `settled(best)` only turns true
    // partway through the traversal and there's a real "before" (unpruned) and "after" (pruned)
    // to compare — proof that cut 3 does something, not just that it never misfires (the other
    // tests here).
    const [, st, sel] = FIXTURES[0];
    const s = space(st, sel);
    const start = evaluate(st, s.offers, decisionAt(s, 0));
    const seen = { n: 0 };
    for (const _e of improve(st, sel, start, seen)) {
      /* draining for seen.n */
    }
    expect(seen.n).toBeLessThan(s.size);
  }, 20000);

  test('with no green plan anywhere, cut 3 never fires', () => {
    // 200 km at 30 °C on a single 500 ml bottle: even at its largest load the bottle cannot close
    // the fluid deficit, so no Decision in this space is ever green and `settled()` never turns
    // true. Cut 3 is gated on `settled(best)`, and with no twin dedup (R3) there is no other
    // pruning left, so `improve()` must visit every Decision in the space exactly once.
    const state = makeState(makeRoute({ distance: 200, temp: 30 }), [
      vessel('g1', 500, ['water', 'izo']),
    ]);
    const start = climb(state, SELECTION);
    expect(start.score.toGreen).toBeGreaterThan(0);

    const seen = { n: 0 };
    for (const _e of improve(state, SELECTION, start, seen)) {
      expect(_e.score.toGreen).toBeGreaterThan(0);
    }
    expect(seen.n).toBe(space(state, SELECTION).size);
  }, 20000);

  test('yields nothing when the climb already found the best', () => {
    // The one-bottle izo kit from oracle.test.ts, where the climb is already known (by that file's
    // own test) to land on the oracle's best Decision — so there is nothing left for improve() to
    // offer.
    const state = makeState(makeRoute({ distance: 60, temp: 20 }), [vessel('g1', 650, ['izo'])]);
    const start = climb(state, []);
    expect([...improve(state, [], start)]).toEqual([]);
  });

  test('on a ride that needs nothing, leaving every vessel home is the oracle’s best', () => {
    // 20 km at 10 °C: the deficit from carrying nothing at all is already inside the (cool-weather)
    // hydration allowance, and any load big enough to matter overshoots the gut's carb ceiling
    // instead (the ride is too short to grade carbs at all, but not too short for the overshoot
    // check — see score.ts). M = 0, "every vessel left home", is where the search starts and
    // where it should end.
    const state = makeState(makeRoute({ distance: 20, temp: 10 }), [
      vessel('g1', 2000, ['water']),
      vessel('g2', 250, ['gel'], 6),
    ]);
    const start = climb(state, SELECTION);
    let best: Evaluated = start;
    for (const e of improve(state, SELECTION, start)) best = e;
    expect(compareScore(best.score, oracle(state, SELECTION, 1e6)!.best.score)).toBe(0);
    expect(best.decision.assignment.every((a) => a.loads === 0)).toBe(true);
  });
});
