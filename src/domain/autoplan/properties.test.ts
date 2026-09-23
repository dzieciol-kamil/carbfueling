/**
 * Property-based checks: rules from `docs/autoplan-rules.md` (R*) that must hold for *any* route,
 * kit and selection, not only the hand-written scenarios.
 *
 * **Deterministic on purpose.** Every property runs with the same fixed `SEED`, so the generated
 * routes are identical on every run and CI cannot go red by luck. When a property fails, fast-check
 * shrinks the input to the smallest one that still breaks the rule and prints it together with the
 * seed and path, so the failure replays exactly. To explore new inputs, change `SEED` locally (or
 * set `FC_SEED`), never in CI.
 */
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { dist, totalHours, CARB_GRADING_MIN_HOURS } from '../fuel';
import type { Content, FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { autoplan } from './index';
import { mergeWindowKm } from './layout';
import type { AutoplanResult, FoodSelectionEntry } from './types';

// The app's tsconfig carries no Node types, so the environment is read without them.
const env =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const SEED = Number(env.FC_SEED ?? 20260923);
const RUNS = 60;
const FINISH_GAP_FRACTION = 0.02;
const EPS = 1e-6;

const FOOD_LIB: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

const routeArb: fc.Arbitrary<RouteInput> = fc
  .record({
    distance: fc.integer({ min: 10, max: 200 }),
    speed: fc.integer({ min: 15, max: 35 }),
    temp: fc.integer({ min: 5, max: 35 }),
    weight: fc.integer({ min: 55, max: 95 }),
    intensity: fc.constantFrom('low', 'mid', 'high' as const),
  })
  .map((r) => ({
    sport: 'cycling',
    mode: 'route',
    hours: 0,
    minutes: 0,
    preMealCarbs: 0,
    preMealMinutes: 0,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...r,
  }));

const allowedArb: fc.Arbitrary<Content[]> = fc.subarray(['water', 'izo', 'gel'] as Content[], {
  minLength: 1,
});

const gearArb: fc.Arbitrary<Vessel[]> = fc
  .array(
    fc.record({
      vol: fc.constantFrom(150, 250, 500, 650, 750, 1000),
      allowed: allowedArb,
    }),
    { minLength: 1, maxLength: 3 },
  )
  .map((vs) => vs.map((v, i) => ({ gid: `g${i + 1}`, name: 'Bidon', gelParts: 4, ...v })));

const mixArb: fc.Arbitrary<MixSettings> = fc.integer({ min: 6, max: 18 }).map((conc) => ({
  conc,
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
}));

const selectionArb: fc.Arbitrary<FoodSelectionEntry[]> = fc
  .subarray(FOOD_LIB.map((e) => e.key))
  .chain((keys) =>
    fc.tuple(...keys.map((key) => fc.integer({ min: 1, max: 4 }).map((count) => ({ key, count })))),
  );

type Case = { state: PlanState; selection: FoodSelectionEntry[] };

const caseArb: fc.Arbitrary<Case> = fc
  .record({ route: routeArb, gear: gearArb, mix: mixArb, selection: selectionArb })
  .map(({ route, gear, mix, selection }) => ({
    state: { route, gear, mix, fills: [], foods: [], foodLib: FOOD_LIB },
    selection,
  }));

// Same seed → same inputs for every property, so each plan is computed once and shared.
const memo = new Map<string, AutoplanResult>();
function plan(c: Case): AutoplanResult {
  const k = JSON.stringify(c);
  let r = memo.get(k);
  if (!r) {
    r = autoplan(c.state, c.selection);
    memo.set(k, r);
  }
  return r;
}

function check(name: string, rule: string, body: (c: Case, r: AutoplanResult, D: number) => void) {
  test(`${rule}: ${name}`, () => {
    fc.assert(
      fc.property(caseArb, (c) => {
        body(c, plan(c), dist(c.state.route));
      }),
      { seed: SEED, numRuns: RUNS },
    );
    // Sixty full plans, up to ~2.4 s each, on the first property that sees them (P1 builds every
    // one twice) — the limit is for a slow CI machine, not a target.
  }, 120_000);
}

describe('autoplan properties', () => {
  check('the same input gives the same plan', 'P1', (c, r) => {
    expect(autoplan(c.state, c.selection)).toEqual(r);
  });

  check('every fill lies inside the route and has length', 'P2 / R42', (_c, r, D) => {
    for (const f of r.fills) {
      expect(f.from).toBeGreaterThanOrEqual(0);
      expect(f.to).toBeGreaterThan(f.from);
      expect(f.to).toBeLessThanOrEqual(D + EPS);
    }
  });

  check('a vessel only carries what its allowed list permits', 'P3 / R29', (c, r) => {
    for (const f of r.fills) {
      const v = c.state.gear.find((g) => g.gid === f.gid);
      expect(v?.allowed).toContain(f.content);
    }
  });

  check('one vessel never holds two fills at once', 'P4 / R22', (_c, r) => {
    const byGid = new Map<string, { from: number; to: number }[]>();
    for (const f of r.fills) byGid.set(f.gid, [...(byGid.get(f.gid) ?? []), f]);
    for (const own of byGid.values()) {
      own.sort((a, b) => a.from - b.from);
      for (let i = 1; i < own.length; i++) {
        expect(own[i].from).toBeGreaterThanOrEqual(own[i - 1].to - EPS);
      }
    }
  });

  check(
    'every refill has a stop in its window, every stop serves something',
    'P5 P6 / R20 R21 R26',
    (_c, r) => {
      const xs = r.newStops.map((s) => s.at);
      const served = new Set<number>(
        r.foods.filter((f) => FOOD_LIB.find((e) => e.key === f.key)?.needsStop).map((f) => f.from),
      );
      const emptyFrom = new Map<string, number>();
      for (const f of [...r.fills].sort((a, b) => a.from - b.from)) {
        const prev = emptyFrom.get(f.gid);
        emptyFrom.set(f.gid, prev === undefined ? f.to : Math.max(prev, f.to));
        if (prev === undefined) continue;
        const window = xs.filter((x) => x >= prev - EPS && x <= f.from + EPS);
        expect(
          window,
          `refill @${f.from} of ${f.gid} has no stop in [${prev}, ${f.from}]`,
        ).not.toHaveLength(0);
        for (const x of window) served.add(x);
      }
      for (const x of xs) expect(served.has(x), `stop @${x} serves nothing`).toBe(true);
    },
  );

  check('no two stops closer than the merge window', 'P7 / R25', (_c, r, D) => {
    const xs = r.newStops.map((s) => s.at).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(mergeWindowKm(D) - EPS);
    }
  });

  check('no stop on the start or the finish line', 'P8 / R30', (_c, r, D) => {
    for (const s of r.newStops) {
      expect(s.at).toBeGreaterThan(0);
      expect(s.at).toBeLessThan(D);
    }
  });

  check('no gel and no product in the last 2% of the route', 'P9 / R45', (_c, r, D) => {
    const cap = D * (1 - FINISH_GAP_FRACTION) + EPS;
    for (const f of r.fills) if (f.content === 'gel') expect(f.to).toBeLessThanOrEqual(cap);
    for (const f of r.foods) expect(f.to).toBeLessThanOrEqual(cap);
  });

  check('never two products open at once or at the same km', 'P10 / R38', (_c, r) => {
    const fs = [...r.foods].sort((a, b) => a.from - b.from);
    for (let i = 1; i < fs.length; i++) {
      expect(fs[i].from).toBeGreaterThanOrEqual(fs[i - 1].to);
      expect(fs[i].from).toBeGreaterThan(fs[i - 1].from);
    }
  });

  check('under an hour there are no products', 'P14 / R9', (c, r) => {
    if (totalHours(c.state.route) < CARB_GRADING_MIN_HOURS) expect(r.foods).toEqual([]);
  });

  check('never more of a product than the rider offered', 'P15 / R15', (c, r) => {
    for (const s of c.selection) {
      expect(r.foods.filter((f) => f.key === s.key).length).toBeLessThanOrEqual(s.count);
    }
  });
});
