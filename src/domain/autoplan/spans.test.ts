/**
 * Every expectation here is derived by hand from `fuel.ts` — from `cph()`, `sweat()`, `eff()` and
 * `samples()` applied to a hand-built plan. Nothing in this file takes a number produced by the
 * planner as the thing to expect.
 */
import { describe, expect, test } from 'vitest';
import { carbSpanEndKm, waterSpanEndKm } from './spans';
import { cph, dist, eff, samples, sweat, totalHours, valueAt } from '../fuel';
import { KIELCE_MARKI_ELE } from '../__fixtures__/kielceMarkiEle';
import { DEFAULT_MIX } from '../types';
import type { PlanState, RouteInput } from '../types';

function makeRoute(o: Partial<RouteInput> = {}): RouteInput {
  return {
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
    temp: 20,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...o,
  };
}

/** The rider's Kielce-Marki ride — the one GPX fixture in the repo, and the only route here whose
 *  `eff` is not a straight line. */
function gpxRoute(): RouteInput {
  return makeRoute({
    distance: 194,
    speed: 22,
    weight: 78,
    temp: 28,
    useGpx: true,
    gpxTrack: { id: 1, ele: KIELCE_MARKI_ELE },
    gpxName: 'kielce___marki.gpx',
  });
}

/** An empty plan on `route` — enough for `samples()`, whose two need lines do not depend on what
 *  the rider is carrying. */
function emptyPlan(route: RouteInput): PlanState {
  return { route, mix: DEFAULT_MIX, gear: [], fills: [], foods: [], foodLib: [] };
}

/** What the route demands between two km marks, computed straight from `eff` the way `samples()`
 *  shapes both need lines: `rideTotal × (eff(b) − eff(a)) / eff(finish)`. */
function demandBetween(route: RouteInput, a: number, b: number, rideTotal: number): number {
  const tot = eff(route, dist(route));
  return (rideTotal * (eff(route, b) - eff(route, a))) / tot;
}

const carbTotal = (r: RouteInput) => totalHours(r) * cph(r);
/** Matches `samples()`, which uses the raw product — `planSummary` rounds it, the need curve does not. */
const waterTotal = (r: RouteInput) => sweat(r) * totalHours(r);

describe('carbSpanEndKm — a flat route reduces to plain arithmetic', () => {
  /**
   * With no GPX, every profile point's effort is a flat 1 (`buildProf`: `route.useGpx ? gradEffort
   * (...) : 1`), so `eff` is linear in distance and the `eff` factors cancel out of the inversion
   * completely. What is left is the schoolbook answer: a fill holding `c` grams, against a
   * requirement of `cph` grams an hour, lasts `c / cph` hours, which at `speed` km/h is
   * `c / cph × speed` km.
   *
   * Measured to be bit-exact, not merely close, on every case below — so `toBe`, not `toBeCloseTo`.
   * If a future rewrite of the inversion loses that, this is the test that should say so.
   */
  const cases: [label: string, route: RouteInput, carbs: number, startKm: number][] = [
    ['90 km @ 25 km/h, mid (cph 75)', makeRoute(), 150, 0],
    ['the same, started 10 km in', makeRoute(), 150, 10],
    [
      '60 km @ 30 km/h, high (cph 60)',
      makeRoute({ distance: 60, speed: 30, intensity: 'high' }),
      45,
      0,
    ],
    [
      'running 20 km @ 10 km/h, low (cph 30)',
      makeRoute({ sport: 'running', distance: 20, speed: 10, intensity: 'low' }),
      15,
      0,
    ],
  ];

  test.each(cases)('%s', (_label, route, carbs, startKm) => {
    const expected = startKm + (carbs / cph(route)) * route.speed;
    // Guards the test itself: an expectation past the finish would be testing the clamp instead.
    expect(expected).toBeLessThan(dist(route));
    expect(carbSpanEndKm(route, startKm, carbs)).toBe(expected);
  });
});

describe('waterSpanEndKm — the same on a flat route, against sweat rate', () => {
  /**
   * `samples()` builds `fluidNeed` from the full, undiscounted `sweat(route) × hours` spread by the
   * same `eff(x) / tot` factor the carb line uses, so on a flat route the water span is the same
   * arithmetic with `sweat()` in place of `cph()`: `ml / sweat × speed` km.
   *
   * `toBeCloseTo` rather than `toBe` here only because the reference expression on the right-hand
   * side rounds differently in its last bit on some of these numbers — the two agree to ~1e-15 km,
   * which is well under a nanometre.
   */
  const cases: [label: string, route: RouteInput, ml: number][] = [
    ['90 km @ 25 km/h, 20 C', makeRoute(), 650],
    [
      '60 km @ 30 km/h, high, 30 C',
      makeRoute({ distance: 60, speed: 30, intensity: 'high', temp: 30 }),
      900,
    ],
    [
      'running 20 km @ 10 km/h, low',
      makeRoute({ sport: 'running', distance: 20, speed: 10, intensity: 'low' }),
      500,
    ],
  ];

  test.each(cases)('%s', (_label, route, ml) => {
    const expected = (ml / sweat(route)) * route.speed;
    expect(expected).toBeLessThan(dist(route));
    expect(waterSpanEndKm(route, 0, ml)).toBeCloseTo(expected, 10);
  });
});

describe('the span is the inverse of the curve samples() actually draws', () => {
  /**
   * The point of the whole module: read the need line back rather than keep a second model of it.
   * So ask `samples()` itself. `need` and `fluidNeed` are cumulative, so the difference between the
   * two ends of the returned span is what the route demanded over it, and it has to come back as
   * exactly what the fill was holding.
   */
  const routes: [string, RouteInput][] = [
    ['flat', makeRoute()],
    ['GPX', gpxRoute()],
  ];

  test.each(routes)('%s route: carbs consumed over the span == carbs in the fill', (_l, route) => {
    const S = samples(emptyPlan(route));
    const D = dist(route);
    for (const [start, carbs] of [
      [0, 90],
      [25, 60],
      [50, 45],
    ]) {
      const end = carbSpanEndKm(route, start, carbs);
      expect(end).toBeLessThan(D);
      const consumed = valueAt(S, D, end, 'need') - valueAt(S, D, start, 'need');
      expect(consumed).toBeCloseTo(carbs, 9);
    }
  });

  test.each(routes)('%s route: fluid consumed over the span == ml in the fill', (_l, route) => {
    const S = samples(emptyPlan(route));
    const D = dist(route);
    for (const [start, ml] of [
      [0, 650],
      [25, 500],
      [50, 750],
    ]) {
      const end = waterSpanEndKm(route, start, ml);
      expect(end).toBeLessThan(D);
      const consumed = valueAt(S, D, end, 'fluidNeed') - valueAt(S, D, start, 'fluidNeed');
      expect(consumed).toBeCloseTo(ml, 9);
    }
  });
});

describe('spans tile', () => {
  /**
   * Chaining spans — each one starting where the last ended — must partition the route with no gap
   * and no overlap. Which is the same statement as: the need is additive over adjacent stretches,
   * so `k` chained fills of `c` grams must end exactly where one fill of `k × c` grams would.
   */
  test.each([
    ['flat', makeRoute()],
    ['GPX', gpxRoute()],
  ])('%s route: k chained fills end where one k-times-bigger fill ends', (_l, route) => {
    const c = 60;
    let x = 0;
    for (let k = 1; k <= 4; k++) {
      x = carbSpanEndKm(route, x, c);
      expect(x).toBeCloseTo(carbSpanEndKm(route, 0, k * c), 9);
    }
  });

  test('each tile consumes exactly its own fill, and the tiles leave no gap', () => {
    const route = gpxRoute();
    const total = carbTotal(route);
    const c = 60;
    const edges = [0];
    for (let k = 0; k < 4; k++) edges.push(carbSpanEndKm(route, edges[k], c));

    for (let k = 0; k < 4; k++) {
      expect(demandBetween(route, edges[k], edges[k + 1], total)).toBeCloseTo(c, 9);
    }
    // No gap and no overlap: the four tiles together demand exactly four fills' worth.
    expect(demandBetween(route, edges[0], edges[4], total)).toBeCloseTo(4 * c, 9);
    expect(edges).toEqual([...edges].sort((a, b) => a - b));
  });
});

describe('a fill bigger than the route needs stops at the finish', () => {
  test.each([
    ['flat', makeRoute()],
    ['GPX', gpxRoute()],
  ])('%s route', (_l, route) => {
    // Ten times the whole ride's requirement, from the start line and from halfway.
    expect(carbSpanEndKm(route, 0, carbTotal(route) * 10)).toBe(dist(route));
    expect(carbSpanEndKm(route, dist(route) / 2, carbTotal(route) * 10)).toBe(dist(route));
    expect(waterSpanEndKm(route, 0, waterTotal(route) * 10)).toBe(dist(route));
  });

  test('exactly the whole requirement reaches exactly the finish', () => {
    const route = makeRoute();
    expect(carbSpanEndKm(route, 0, carbTotal(route))).toBe(dist(route));
  });
});

describe('terrain changes the span, in the direction the need curve says', () => {
  /**
   * The whole reason this is not just `c / cph × speed`. On a climb the route demands more per km,
   * so the same fill covers fewer of them; on a descent, more.
   *
   * Both stretches are identified from `eff` itself — effort density over the span against the
   * route's average — rather than asserted to be a climb by eye, so the direction claim cannot go
   * stale if the fixture is ever re-sampled.
   */
  const route = gpxRoute();
  const D = dist(route);
  const avgDensity = eff(route, D) / D;
  const flatLength = (60 / cph(route)) * route.speed;

  test('a climbing stretch gives a shorter span than the flat formula', () => {
    const start = 15;
    const end = carbSpanEndKm(route, start, 60);
    expect((eff(route, end) - eff(route, start)) / (end - start)).toBeGreaterThan(avgDensity);
    expect(end - start).toBeLessThan(flatLength);
  });

  test('a descending stretch gives a longer one', () => {
    const start = 40;
    const end = carbSpanEndKm(route, start, 60);
    expect((eff(route, end) - eff(route, start)) / (end - start)).toBeLessThan(avgDensity);
    expect(end - start).toBeGreaterThan(flatLength);
  });

  test.each([15, 40])('and either way the need consumed from %s km is the fill itself', (start) => {
    const end = carbSpanEndKm(route, start, 60);
    expect(demandBetween(route, start, end, carbTotal(route))).toBeCloseTo(60, 9);
  });
});

describe('degenerate inputs', () => {
  test('a fill holding nothing spans nothing', () => {
    const route = makeRoute();
    expect(carbSpanEndKm(route, 30, 0)).toBe(30);
    expect(carbSpanEndKm(route, 0, 0)).toBe(0);
    expect(waterSpanEndKm(route, 30, 0)).toBe(30);
  });

  test('a zero-distance route demands nothing, so any fill reaches the finish', () => {
    // `dist()` floors at 1 km, and `totalHours` is 0, so the carb and fluid targets are both 0.
    const route = makeRoute({ distance: 0 });
    expect(totalHours(route)).toBe(0);
    expect(carbSpanEndKm(route, 0, 50)).toBe(dist(route));
    expect(waterSpanEndKm(route, 0, 500)).toBe(dist(route));
  });

  test('a start past the finish is clamped to it', () => {
    const route = makeRoute();
    expect(carbSpanEndKm(route, 500, 0)).toBe(dist(route));
    expect(carbSpanEndKm(route, 500, 30)).toBe(dist(route));
  });
});
