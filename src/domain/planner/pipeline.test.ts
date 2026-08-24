/**
 * Structural tests for `plan()` — the wired v2 pipeline. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4.1 for the stage order.
 *
 * **These assert only what must hold of ANY valid plan** — never coverage or hydration
 * percentages. Those are W5b's tuning targets; asserting a number here would either fail on day
 * one or freeze a number before it is calibrated. See the module doc on `plan()` for why: no
 * verify/repair pass exists yet (that's L3, W5b), so this only has to hold for the deterministic
 * path.
 */
import { describe, expect, test } from 'vitest';
import type { FoodSelectionEntry } from '../autoplan';
import { minStopX } from '../autoplan';
import { dist, totalHours } from '../fuel';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { KIELCE_MARKI_ELE } from '../__fixtures__/kielceMarkiEle';
import { assertInvariantV1 } from './assignWater';
import { legsForBoundaries } from './skeleton';
import { plan } from './index';
import type { DraftPlan } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
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
    ...overrides,
  };
}

const MIX: MixSettings = {
  conc: 8.4,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  salt: 0.16,
  citric: 0.2,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};

const FOOD_LIB: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

function water(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

function izo(vol: number, gid = 'g1'): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['izo', 'water'], gelParts: 4 };
}

function gel(vol: number, gid: string): Vessel {
  return { gid, name: 'Flaszka', vol, allowed: ['gel'], gelParts: 6 };
}

function makeState(route: RouteInput, gear: Vessel[], mix: MixSettings = MIX): PlanState {
  return { route, mix, gear, fills: [], foods: [], foodLib: FOOD_LIB, stops: [] };
}

/** Checks that must hold of ANY plan `plan()` produces, regardless of how good it is. */
function assertStructurallyValid(state: PlanState, result: DraftPlan): void {
  const D = dist(state.route);
  const xs = result.stops.map((s) => s.at).sort((a, b) => a - b);

  // V1: every vessel's combined services timeline is only ever refilled at a stop the plan makes,
  // anchored exactly at that stop's km. `result.stops` preserves `tidy()`'s own stop order/indices
  // (index.ts maps 1:1), so this reconstruction is exact, not approximate.
  assertInvariantV1(result.services, {
    stops: result.stops.map((s) => ({ km: s.at, origin: 'planned' as const })),
    legs: [],
    shortfall: null,
  });

  // S1 (spacing) + "not right after the start" (S5): no two stops closer than minStopX(D), and the
  // first stop is never parked near km 0.
  const floor = minStopX(D);
  if (xs.length > 0) expect(xs[0]).toBeGreaterThanOrEqual(floor - 1e-6);
  for (let i = 1; i < xs.length; i++) {
    expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(floor - 1e-6);
  }

  // legs.length === stops.length + 1, recomputed the same way tidy.ts itself builds legs from a
  // boundary list — `plan()`'s DraftPlan carries no legs field, so this is the only way to check
  // the invariant against what callers actually receive.
  const legs = legsForBoundaries(state.route, state.mix, [0, ...xs, D]);
  expect(legs).toHaveLength(xs.length + 1);

  // No service references a vessel that doesn't exist in gear.
  const knownVesselIds = new Set(state.gear.map((v) => v.gid));
  for (const s of result.services) {
    expect(knownVesselIds.has(s.vesselId), `service references unknown vessel ${s.vesselId}`).toBe(
      true,
    );
  }
}

interface Fixture {
  label: string;
  state: PlanState;
  selection: FoodSelectionEntry[];
}

const FIXTURES: Fixture[] = [
  {
    label: 'water only, 120km, one bottle',
    state: makeState(makeRoute({ distance: 120, temp: 25 }), [water(650)]),
    selection: [],
  },
  {
    label: 'izo relay, 150km, two bidons',
    state: makeState(makeRoute({ distance: 150, temp: 24 }), [izo(710, 'g1'), izo(710, 'g3')]),
    selection: [],
  },
  {
    label: 'full kit — izo + water + gel flask + mixed selection, 160km',
    state: makeState(makeRoute({ distance: 160, temp: 28, weight: 78 }), [
      izo(650, 'g1'),
      water(750, 'g2'),
      gel(250, 'g3'),
    ]),
    selection: [
      { key: 'gel', count: 3 },
      { key: 'banana', count: 1 },
      { key: 'chew', count: 2 },
      { key: 'cola', count: 2 },
    ],
  },
  {
    label: 'needsStop products alone force stops — 70km, 4 colas',
    state: makeState(makeRoute({ distance: 70, temp: 28 }), [water(500)]),
    selection: [{ key: 'cola', count: 4 }],
  },
  {
    label: 'genuinely hilly GPX track — Kielce–Marki 194km',
    state: makeState(
      makeRoute({
        distance: 194,
        speed: 22,
        weight: 78,
        temp: 28,
        useGpx: true,
        gpxTrack: { id: 1, ele: KIELCE_MARKI_ELE },
        gpxName: 'kielce___marki.gpx',
      }),
      [
        { gid: 'g1', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
        { gid: 'g3', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
        { gid: 'g6', name: 'Mały Bidon', vol: 630, allowed: ['water'], gelParts: 4 },
        { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 6 },
        { gid: 'g4', name: 'Flask', vol: 150, allowed: ['gel'], gelParts: 5 },
        { gid: 'g5', name: 'Bukłak', vol: 1500, allowed: ['water'], gelParts: 4 },
      ],
    ),
    selection: [
      { key: 'cola', count: 1 },
      { key: 'banana', count: 2 },
    ],
  },
];

describe('plan() — structural validity', () => {
  test.each(FIXTURES.map((f): [string, Fixture] => [f.label, f]))('%s', (_label, fixture) => {
    const result = plan(fixture.state, fixture.selection);
    assertStructurallyValid(fixture.state, result);
  });
});

describe('plan() — short-ride carb gate (C5)', () => {
  test('a ride well under an hour gets no carb services, even with a selection and izo gear', () => {
    const state = makeState(makeRoute({ distance: 10, speed: 25 }), [izo(650)]);
    expect(totalHours(state.route)).toBeLessThan(1);
    const result = plan(state, [{ key: 'gel', count: 3 }]);
    expect(result.services.some((s) => s.content === 'izo' || s.content === 'gel')).toBe(false);
  });
});

describe('plan() — determinism', () => {
  test('the same input twice produces a deep-equal plan', () => {
    const fixture = FIXTURES[2]; // the full-kit combined scenario
    const a = plan(fixture.state, fixture.selection);
    const b = plan(fixture.state, fixture.selection);
    expect(a).toEqual(b);
  });
});
