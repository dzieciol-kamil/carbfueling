/**
 * Every plan in this file is built by hand — no planner produced any of it — and every expectation
 * is derived from `fuel.ts` applied to that hand-built plan. The one property under test above all
 * the others is that `toGreen === 0` and "the app paints both badges green" are the same statement.
 */
import { describe, expect, test } from 'vitest';
import { compareScore, score } from './score';
import type { Draft, Score } from './score';
import type { DraftFill, DraftFood } from './types';
import {
  CARB_PLATEAU_GPH,
  SURPLUS_WARN_PCT,
  allowedDeficitPct,
  coverageStatus,
  cph,
  dist,
  hydrationStatus,
  planSummary,
  totalHours,
  waterBalancePct,
} from '../fuel';
import { DEFAULT_MIX } from '../types';
import type { PlanState, RouteInput, Vessel } from '../types';

/** 90 km at 25 km/h is 3.6 h, so the carb badge is graded rather than 'unneeded'; 30 C is where
 *  `allowedDeficitPct` bottoms out, which makes the hydration terms easy to reason about. */
const route: RouteInput = {
  sport: 'cycling',
  mode: 'route',
  distance: 90,
  speed: 25,
  hours: 0,
  minutes: 0,
  weight: 75,
  preMealCarbs: 0,
  preMealMinutes: 0,
  intensity: 'mid',
  temp: 30,
  useGpx: false,
  gpxTrack: null,
  gpxName: null,
  gpxError: null,
};

/** One bidon that can hold water or izo, one flask that holds gel. At `gelConc` 60 the 250 ml
 *  flask is 150 g of carbs; at `conc` 8.4 the 650 ml bidon is 54.6 g when it holds izo. */
const gear: Vessel[] = [
  { gid: 'b1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'f1', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 4 },
];

const state: PlanState = { route, mix: DEFAULT_MIX, gear, fills: [], foods: [], foodLib: [] };

const D = dist(route);
const HRS = totalHours(route);
const GEL_CARBS = (250 / 100) * DEFAULT_MIX.gelConc;

/**
 * The span over which the gel's 150 g exactly matches the route's requirement. Written out by hand
 * from `cph()` and the route's speed rather than taken from `spans.ts`, so this file's expectations
 * do not lean on the other primitive: the route is flat, so the requirement is `cph` g/h and the
 * gel lasts `GEL_CARBS / cph` hours, i.e. that many hours of riding at `route.speed`.
 */
const GEL_TO = (GEL_CARBS / cph(route)) * route.speed;

const gelOverWholeRide: DraftFill = { gid: 'f1', content: 'gel', from: 0, to: D };
const gelMatched: DraftFill = { gid: 'f1', content: 'gel', from: 0, to: GEL_TO };

/** `n` bidon-loads of water, laid end to end across the route. */
function waterLoads(n: number): DraftFill[] {
  return Array.from({ length: n }, (_, i) => ({
    gid: 'b1',
    content: 'water' as const,
    from: (D * i) / n,
    to: (D * (i + 1)) / n,
  }));
}

function draft(fills: DraftFill[], foods: DraftFood[] = [], stops: number[] = []): Draft {
  return { fills, foods, stops: stops.map((at) => ({ at })) };
}

/** The plan as `fuel.ts` sees it, reached independently of `score()` — the ids and names it adds
 *  are not inputs to any of the fuel math. */
function summaryOf(d: Draft) {
  return planSummary({
    ...state,
    fills: d.fills.map((f, i) => ({ ...f, fid: i + 1 })),
    foods: d.foods.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
  });
}

function badges(d: Draft): { carbs: string; hydration: string } {
  const s = summaryOf(d);
  return {
    carbs: coverageStatus(
      s.carbRateGph,
      HRS,
      s.carbPlannedRateGph,
      s.carbAbsCapGph,
      s.carbTargetGph,
    ),
    hydration: hydrationStatus(s.waterBalancePct, route.temp),
  };
}

/* The six hand-built plans the assertions below refer to. Each was chosen so that exactly one thing
 * is wrong with it (or, for `green`, nothing at all). */
const EMPTY = draft([]);
/** The gel stretched over the whole ride: it never keeps up with the need, so the carb badge falls
 *  short even though every gram of it is on board. Water is fine. */
const CARB_SHORT = draft([gelOverWholeRide, ...waterLoads(5)]);
/** The same gel, narrowed to the span where its delivery matches the requirement. */
const GREEN = draft([gelMatched, ...waterLoads(5)]);
/** One bidon-load less. */
const TOO_DRY = draft([gelMatched, ...waterLoads(4)]);
/** Two bidon-loads more than sweat loss asks for — the EAH side. */
const TOO_WET = draft([gelMatched, ...waterLoads(7)]);
/** A preposterous amount of solid food on top of a green plan, purely to push the *planned* carb
 *  rate past the gut's ceiling. No `ml`, so it leaves the water side alone. */
const OVER_CAP = draft(
  [gelMatched, ...waterLoads(5)],
  [{ key: 'x', carbs: 200, from: 40, to: 40 }],
);

describe('toGreen is zero exactly when the app paints both badges green', () => {
  /** The agreement is the property. `score()` never calls `coverageStatus`/`hydrationStatus`; it
   *  reproduces their green conditions from `planSummary` and the same constants, and if the two
   *  ever drift apart the planner is optimising something the app does not display. */
  test.each([
    ['an empty plan', EMPTY],
    ['carbs short', CARB_SHORT],
    ['green on both', GREEN],
    ['too dry', TOO_DRY],
    ['too wet', TOO_WET],
    ['past the gut cap', OVER_CAP],
  ])('%s', (_label, d) => {
    const b = badges(d);
    const bothGreen = b.carbs === 'good' && b.hydration === 'good';
    expect(score(state, d).toGreen === 0).toBe(bothGreen);
  });
});

describe('score', () => {
  test('an empty draft on a ride that needs carbs is far from green', () => {
    const s = score(state, EMPTY);
    expect(summaryOf(EMPTY).target).toBeGreaterThan(0);
    expect(s.toGreen).toBeGreaterThan(0);
    expect(badges(EMPTY)).toEqual({ carbs: 'short', hydration: 'short' });
  });

  test('a plan that is green on both badges scores zero', () => {
    expect(badges(GREEN)).toEqual({ carbs: 'good', hydration: 'good' });
    expect(score(state, GREEN).toGreen).toBe(0);
  });

  describe('each term fires on its own', () => {
    /**
     * Each case asserts the *whole* of `toGreen` against the one term that should be firing,
     * recomputed here from `planSummary` and `fuel.ts`'s own constants. Pinning the total, not just
     * that term, is what makes these isolation tests: it says the other three are exactly zero.
     */
    test('short of the carb floor', () => {
      const s = summaryOf(CARB_SHORT);
      const floor = Math.min(s.carbTargetGph, CARB_PLATEAU_GPH);
      expect(badges(CARB_SHORT)).toEqual({ carbs: 'partial', hydration: 'good' });
      expect(s.carbRateGph).toBeLessThan(floor);
      expect(score(state, CARB_SHORT).toGreen).toBeCloseTo((floor - s.carbRateGph) / floor, 12);
    });

    test('past the gut ceiling', () => {
      const s = summaryOf(OVER_CAP);
      expect(badges(OVER_CAP)).toEqual({ carbs: 'over', hydration: 'good' });
      expect(s.carbPlannedRateGph).toBeGreaterThan(s.carbAbsCapGph);
      expect(score(state, OVER_CAP).toGreen).toBeCloseTo(
        (s.carbPlannedRateGph - s.carbAbsCapGph) / s.carbAbsCapGph,
        12,
      );
    });

    test('too dry', () => {
      const s = summaryOf(TOO_DRY);
      const allowed = allowedDeficitPct(route.temp);
      // The far end of the term's scale: what this rider's balance reads having drunk nothing.
      // Asked of `fuel.ts` rather than restated, the same way every other expectation here is.
      const worst = -waterBalancePct({
        sweatLoss: s.sweatLoss,
        fluidPlanned: 0,
        weight: route.weight,
      });
      expect(badges(TOO_DRY)).toEqual({ carbs: 'good', hydration: 'partial' });
      expect(-s.waterBalancePct).toBeGreaterThan(allowed);
      expect(score(state, TOO_DRY).toGreen).toBeCloseTo(
        (-s.waterBalancePct - allowed) / (worst - allowed),
        12,
      );
    });

    test('too wet', () => {
      const s = summaryOf(TOO_WET);
      expect(badges(TOO_WET)).toEqual({ carbs: 'good', hydration: 'over' });
      expect(s.waterBalancePct).toBeGreaterThan(SURPLUS_WARN_PCT);
      expect(score(state, TOO_WET).toGreen).toBeCloseTo(
        (s.waterBalancePct - SURPLUS_WARN_PCT) / SURPLUS_WARN_PCT,
        12,
      );
    });

    /**
     * The two shortfall terms are on one scale, and this is the sentence that says so: an empty
     * plan misses the whole of both, so each reads exactly 1 and the total is exactly 2. Without
     * it nothing stops the dryness term from being renormalised back to something unbounded, which
     * is what let the loop trade away carbs — the thing autoplan exists to deliver — to buy water.
     * The two *overshoot* terms have no worst case to divide by and are deliberately not on it.
     */
    test('the two shortfall terms share one scale: an empty plan misses all of both', () => {
      const s = summaryOf(EMPTY);
      expect(s.carbRateGph).toBe(0);
      expect(s.fluidPlanned).toBe(0);
      expect(score(state, EMPTY).toGreen).toBeCloseTo(2, 12);
    });
  });

  test("stops is the draft's own stop count — stops are not an input to the fuel math", () => {
    const withStops = draft(GREEN.fills, [], [30, 60]);
    expect(score(state, withStops).stops).toBe(2);
    // Adding stops changed nothing about how much was drunk or eaten, so the objective is untouched.
    expect(score(state, withStops).toGreen).toBe(score(state, GREEN).toGreen);
  });

  describe('powderCarried', () => {
    /** Two bidons, so one can hand over to the *other* — the shared `gear` has a single one, and a
     *  handover needs a second vessel to hand over to. No expectation below reads a vessel's
     *  volume: `powderCarried` is a question about the draft's fills alone. */
    const twoBidons: PlanState = {
      ...state,
      gear: [
        { gid: 'b1', name: 'Bidon 1', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
        { gid: 'b2', name: 'Bidon 2', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
      ],
    };

    test('a handover to a second bottle carried no powder', () => {
      const d = draft([
        { gid: 'b1', content: 'izo', from: 0, to: 45 },
        { gid: 'b2', content: 'izo', from: 45, to: 90 },
      ]);
      // Both bottles were mixed in the kitchen and left home full; the second one merely comes out
      // of the jersey at km 45. Its `from` is mid-route, but no sachet travelled anywhere.
      expect(score(twoBidons, d).powderCarried).toBe(0);
    });

    test('filling a bottle that has already been used means a sachet was carried', () => {
      const d = draft([
        { gid: 'b1', content: 'izo', from: 0, to: 45 },
        { gid: 'b2', content: 'izo', from: 45, to: 65 },
        { gid: 'b1', content: 'izo', from: 65, to: 90 },
      ]);
      // Three izo fills, two of them home loads. Only b1's second turn is a refill, and a refill is
      // the only way izo can appear in a bottle out on the road: shops sell water, not powder.
      expect(score(twoBidons, d).powderCarried).toBe(1);
    });

    test('refilling a gel flask carried a sachet just the same', () => {
      const d = draft([
        { gid: 'f1', content: 'gel', from: 0, to: 30 },
        { gid: 'b1', content: 'izo', from: 30, to: 60 },
        { gid: 'f1', content: 'gel', from: 60, to: 90 },
      ]);
      // The flask's second load is gel concentrate mixed in the kitchen and carried in a pocket —
      // the izo case exactly. A roadside tap sells neither.
      expect(score(state, d).powderCarried).toBe(1);
    });

    test('an izo refill and a gel refill weigh the same', () => {
      // Same shape twice, once in the bidon and once in the flask. If only izo were counted the
      // tie-break would quietly prefer the flask, on a difference the rider never experiences.
      const izoRefill = draft([
        { gid: 'b1', content: 'izo', from: 0, to: 45 },
        { gid: 'f1', content: 'gel', from: 45, to: 60 },
        { gid: 'b1', content: 'izo', from: 60, to: 90 },
      ]);
      const gelRefill = draft([
        { gid: 'f1', content: 'gel', from: 0, to: 45 },
        { gid: 'b1', content: 'izo', from: 45, to: 60 },
        { gid: 'f1', content: 'gel', from: 60, to: 90 },
      ]);
      expect(score(state, izoRefill).powderCarried).toBe(1);
      expect(score(state, gelRefill).powderCarried).toBe(1);
    });

    test('ignores a water fill that starts mid-route', () => {
      const d = draft([
        { gid: 'b1', content: 'water', from: 0, to: 45 },
        { gid: 'b1', content: 'water', from: 45, to: 90 },
      ]);
      expect(score(state, d).powderCarried).toBe(0);
    });

    test("a vessel's first use is first in ride order, not first in the array", () => {
      const rideOrder: DraftFill[] = [
        { gid: 'b1', content: 'water', from: 0, to: 45 },
        { gid: 'b1', content: 'izo', from: 45, to: 90 },
      ];
      // The bidon left home with water, so the izo poured into it at km 45 came out of a pocket.
      expect(score(twoBidons, draft(rideOrder)).powderCarried).toBe(1);
      // The same plan, listed back to front. Without the sort the km-0 water fill would be read as
      // the refill and the izo one as the home load, and the carried sachet would go uncounted.
      expect(score(twoBidons, draft([...rideOrder].reverse())).powderCarried).toBe(1);
    });

    test('a plan that only refills with water carries no powder', () => {
      expect(score(state, GREEN).powderCarried).toBe(0);
    });
  });

  describe('the divisions are guarded', () => {
    /**
     * `carbTargetGph` is 0 on a route with no hours in it, which makes the graded floor 0. A ride
     * that asks for nothing cannot fall short of it, so the term must contribute 0 — not `NaN`, and
     * not `Infinity`. (`carbAbsCapGph` floors at 45 in `absCap()` and `allowedDeficitPct` never
     * leaves the 1.2-2.5 band, so those two denominators cannot currently reach zero; the guard is
     * uniform so that nothing here can start producing `NaN` if they ever do.)
     */
    test('a zero-distance route scores a finite zero', () => {
      const degenerate: PlanState = { ...state, route: { ...route, distance: 0 } };
      const s = score(degenerate, EMPTY);
      expect(planSummary(degenerate).carbTargetGph).toBe(0);
      expect(Number.isFinite(s.toGreen)).toBe(true);
      expect(s.toGreen).toBe(0);
    });

    test('a rider with no weight entered scores a finite number', () => {
      const degenerate: PlanState = { ...state, route: { ...route, weight: 0 } };
      const s = score(degenerate, EMPTY);
      expect(Number.isFinite(s.toGreen)).toBe(true);
    });
  });
});

describe('compareScore', () => {
  const s = (toGreen: number, stops: number, powderCarried: number): Score => ({
    toGreen,
    stops,
    powderCarried,
  });

  test('toGreen decides first, whatever the tie-breaks say', () => {
    expect(compareScore(s(0, 9, 9), s(0.1, 0, 0))).toBeLessThan(0);
    expect(compareScore(s(0.1, 0, 0), s(0, 9, 9))).toBeGreaterThan(0);
  });

  test('equal toGreen falls through to stops', () => {
    expect(compareScore(s(0.2, 1, 9), s(0.2, 2, 0))).toBeLessThan(0);
    expect(compareScore(s(0.2, 2, 0), s(0.2, 1, 9))).toBeGreaterThan(0);
  });

  test('equal toGreen and stops falls through to carried powder', () => {
    expect(compareScore(s(0.2, 2, 0), s(0.2, 2, 1))).toBeLessThan(0);
    expect(compareScore(s(0.2, 2, 1), s(0.2, 2, 0))).toBeGreaterThan(0);
  });

  test('identical scores compare equal', () => {
    expect(compareScore(s(0.2, 2, 1), s(0.2, 2, 1))).toBe(0);
  });

  test('float noise in toGreen does not rob the tie-breaks of their say', () => {
    // Two plans that are equally green to any meaningful precision: the stop count must decide.
    expect(compareScore(s(0.5, 3, 0), s(0.5 + 1e-12, 2, 0))).toBeGreaterThan(0);
  });

  test('a real difference in toGreen is not swallowed by the epsilon', () => {
    expect(compareScore(s(0.5, 0, 0), s(0.5 + 1e-6, 0, 0))).toBeLessThan(0);
  });
});
