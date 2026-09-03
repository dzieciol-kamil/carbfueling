/**
 * The pacing spec: what a plan for the rider's Kielce–Marki 194km has to look like.
 *
 * **These tests are a target, not a description.** Several of them fail against the current
 * `autoplan()`, deliberately — they were written from a plan the rider built by hand and confirmed
 * he would ride, and they mark the line the rewrite has to reach. Do not relax them to match what
 * the code does; that is backwards.
 *
 * The ride that produced them: 194km, 22km/h, 78kg, 28°C, mid intensity, on the GPX profile in
 * `__fixtures__/kielceMarkiEle` — climbing through the first half, finishing on a long descent.
 * Kit: two 710ml izo-or-water bidons, a 630ml water bidon, a 1500ml bladder, and two gel-only
 * flasks (250ml/6 portions, 150ml/5). Selection: a cola, two bananas, a 60g meal.
 *
 * What the rider's own plan does, and what the generated one has to match:
 *
 *   izo   g1 0→48, g3 48→101, g1 101→150, g3 150→194   — a carb drink on board the whole ride,
 *                                                        the two bidons handing over at stops
 *   gel   g2 0→88 in six doses, g4 132→183             — flasks spread and staggered, never stacked
 *   water bladder refilled at those same three stops
 *   food  banana 28, banana 50, meal + cola at 102
 *
 * Three stops. 620g of carbs against a 661g requirement, and a gut that never holds more than the
 * 95g his own meal-plus-cola puts there in one go.
 */
import { describe, expect, test } from 'vitest';
import { autoplan } from './autoplan';
import type { AutoplanResult } from './autoplan/types';
import { coverageStatus, planExtras, planSummary, totalHours } from './fuel';
import { KIELCE_MARKI_ELE } from './__fixtures__/kielceMarkiEle';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, ShopStop, Vessel } from './types';

/**
 * The stop shape and the plan-plus-stops shape this spec works in.
 *
 * `feat/autoplan` had renamed `ShopStop` to `Stop` with an `autoCreated` flag and threaded a `stops`
 * array through `PlanState`; neither exists on this branch. The rider places no stop by hand here
 * and nothing asserts on the materialized array, so the spec carries the extra fields locally rather
 * than reshaping the app's own types — `planSummary` reads only route/mix/gear/fills/foods, so a
 * `PacingState` is a valid `PlanState`. (`needsStop` is a real `FoodLibEntry` field again, so it
 * needs no shim.)
 */
type Stop = ShopStop & { autoCreated?: boolean };
type PacingState = PlanState & { stops: Stop[] };

const route: RouteInput = {
  sport: 'cycling',
  mode: 'route',
  distance: 194,
  speed: 22,
  hours: 0,
  minutes: 0,
  weight: 78,
  preMealCarbs: 50,
  preMealMinutes: 45,
  intensity: 'mid',
  temp: 28,
  useGpx: true,
  gpxTrack: { id: 1, ele: KIELCE_MARKI_ELE },
  gpxName: 'kielce___marki.gpx',
  gpxError: null,
};

const mix: MixSettings = {
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

const gear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g3', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g6', name: 'Mały Bidon', vol: 630, allowed: ['water'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 6 },
  { gid: 'g4', name: 'Flask', vol: 150, allowed: ['gel'], gelParts: 5 },
  { gid: 'g5', name: 'Bukłak', vol: 1500, allowed: ['water'], gelParts: 4 },
];

const foodLib: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330, needsStop: true },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
  { key: 'u1', pl: 'Obiad', en: 'Obiad', carbs: 60, cont: false, span: 18 },
];

const state: PacingState = { route, mix, gear, fills: [], foods: [], foodLib, stops: [] };

const selection = [
  { key: 'cola', count: 1 },
  { key: 'banana', count: 2 },
  { key: 'u1', count: 1 },
];

const result = autoplan(state, selection);

/** Materializes an autoplan() result into the PlanState the app would hold once applied (mirrors
 *  `applyAutoplan`), so `fuel.ts` can be asked what the plan actually does. */
function materialize(base: PacingState, r: AutoplanResult): PacingState {
  let stopId = 1;
  const stops: Stop[] = [
    ...base.stops,
    ...r.newStops.map((sh) => ({ ...sh, id: stopId++, name: 'Sklep', autoCreated: true })),
  ];
  return {
    ...base,
    fills: r.fills.map((f, i) => ({ ...f, fid: i + 1 })),
    foods: r.foods.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
    stops,
  };
}

/** The plan as the app would hold it once applied, so `fuel.ts` can be asked what it does. */
const applied: PacingState = materialize(state, result);

describe('autoplan pacing (the rider 194km ride)', () => {
  /**
   * The rule the rider stated outright: nothing may be poured in faster than the gut takes it.
   *
   * His own plan peaks at 92g, and every gram of that is the meal and the cola he chose to eat at
   * one stop — the bottles add nothing to the queue. So the ceiling is what his own food forces,
   * not zero.
   */
  test('never pours carbs faster than the gut can take them', () => {
    expect(planExtras(applied).gutPeak.g).toBeLessThanOrEqual(100);
  });

  /**
   * The criterion is the app's own carb badge reading green — the same call `SummaryCards` and
   * `MobilePlanList` make — not a percentage.
   *
   * This used to demand `coverage >= 90`, measured on `feat/autoplan`. That number is void: the
   * pre-ride-meal model changed underneath it, and on this fixture (50 g eaten 45 min out) the
   * residual still on board at the start line moves from ~0 g to ~35 g. Every figure ever measured
   * for this ride on that branch went with it, the hand-built reference plan's 92% included, so
   * there is nothing left to port but the owner's rule: both badges green.
   */
  test('covers the carb requirement', () => {
    const summary = planSummary(applied);
    expect(
      coverageStatus(
        summary.carbRateGph,
        totalHours(route),
        summary.carbPlannedRateGph,
        summary.carbAbsCapGph,
        summary.carbTargetGph,
      ),
    ).toBe('good');
  });

  /**
   * A carb drink on board from the line to the finish, the way his own plan runs it.
   *
   * Stated as thirds because the exact handover points are his choice, not physics: what matters is
   * that no third of the ride is left with nothing but water while another gets a double dose.
   */
  test('feeds every third of the ride, not just the first', () => {
    const carbFills = result.fills.filter((f) => f.content === 'izo' || f.content === 'gel');
    for (const [from, to] of [
      [0, 194 / 3],
      [194 / 3, (2 * 194) / 3],
      [(2 * 194) / 3, 194],
    ]) {
      const fed = carbFills.some((f) => f.to > from && f.from < to);
      expect(fed, `nothing carries carbs between ${from.toFixed(0)}km and ${to.toFixed(0)}km`).toBe(
        true,
      );
    }
  });

  /**
   * A vessel whose last fill ends well before the finish is not automatically a defect. S4 says a
   * vessel need not start at km 0 and may be spent whenever its job is done — a bottle carried
   * purely to buy a stop earns its place at the start and can legitimately finish before the line.
   *
   * The real defect the rider named is narrower than "drains early": "Either it goes back into
   * service or the rider should have left it at home; the plan may not have it both ways." That is
   * dead weight — a vessel whose absence would have cost the plan nothing — and it is directly
   * testable: drop the vessel from `gear` and re-run autoplan(). If the reduced-gear plan needs no
   * more stops and scores no worse on the app's own coverage/water numbers, the vessel was never
   * earning its keep.
   *
   * The water side of that is measured on `waterBalancePct`, not on `hydrationPct` — *"tak, test
   * powinien lecieć na tym, na czym jest silnik."* `fuel.ts` documents `hydrationPct` as a
   * display-only figure capped by absorption, and on this 28 C, 8.8 h ride the plan already sits at
   * that cap: removing a 630 ml bottle does not move it by a single point, so a bottle that is worth
   * 0.81% of body mass reads as dead weight. `waterBalancePct` is the signed balance the engine
   * actually grades and the badge actually colours, and it sees the difference.
   */
  test('a vessel drained early is only legal if losing it would cost the plan something', () => {
    for (const v of gear) {
      const mine = result.fills.filter((f) => f.gid === v.gid).sort((a, b) => a.to - b.to);
      if (mine.length === 0) continue;
      const last = mine[mine.length - 1].to;
      if (last > 194 * 0.8) continue;

      const reducedState: PacingState = { ...state, gear: gear.filter((g) => g.gid !== v.gid) };
      const reducedResult = autoplan(reducedState, selection);
      const reducedApplied = materialize(reducedState, reducedResult);

      const before = planSummary(applied);
      const after = planSummary(reducedApplied);
      const carriesWater = v.allowed.includes('water');

      const costsSomething =
        reducedResult.newStops.length > result.newStops.length ||
        after.coverage < before.coverage ||
        (carriesWater && after.waterBalancePct < before.waterBalancePct);

      const bal = (s: { waterBalancePct: number }) => `${s.waterBalancePct.toFixed(2)}% balance`;
      expect(
        costsSomething,
        `${v.name} (${v.gid}) drains at ${last.toFixed(0)}km, but dropping it from gear leaves the ` +
          `plan just as good (${reducedResult.newStops.length} stops / ${after.coverage}% coverage` +
          `${carriesWater ? ` / ${bal(after)}` : ''} vs ${result.newStops.length} ` +
          `stops / ${before.coverage}% coverage` +
          `${carriesWater ? ` / ${bal(before)}` : ''}) — dead weight`,
      ).toBe(true);
    }
  });

  /** Few, sensible stops. His own plan makes three; the generated one may not need more than four. */
  test('does not turn the ride into a shopping trip', () => {
    expect(result.newStops.length).toBeLessThanOrEqual(4);
  });
});
