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
import { planExtras, planSummary } from './fuel';
import { KIELCE_MARKI_ELE } from './__fixtures__/kielceMarkiEle';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from './types';

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

const state: PlanState = { route, mix, gear, fills: [], foods: [], foodLib, stops: [] };

const result = autoplan(state, [
  { key: 'cola', count: 1 },
  { key: 'banana', count: 2 },
  { key: 'u1', count: 1 },
]);

/** The plan as the app would hold it once applied, so `fuel.ts` can be asked what it does. */
const applied: PlanState = {
  ...state,
  fills: result.fills.map((f, i) => ({ ...f, fid: i + 1 })),
  foods: result.foods.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
  stops: result.newStops,
};

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

  /** 90% is the rider's stated floor for carb coverage. His hand-built plan clears it at 92%. */
  test('covers the carb requirement', () => {
    expect(planSummary(applied).coverage).toBeGreaterThanOrEqual(90);
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
   * No bottle is carried empty for the rest of the day.
   *
   * A bidon the plan drains at 25km and never fills again is 710ml of dead weight for 170km — and
   * worse, it is 710ml the plan could have used and decided not to. Either it goes back into
   * service or the rider should have left it at home; the plan may not have it both ways.
   */
  test('no vessel is drained early and then carried empty', () => {
    for (const v of gear) {
      const mine = result.fills.filter((f) => f.gid === v.gid).sort((a, b) => a.to - b.to);
      if (mine.length === 0) continue;
      const last = mine[mine.length - 1].to;
      expect(last, `${v.name} (${v.gid}) runs dry at ${last.toFixed(0)}km`).toBeGreaterThan(
        194 * 0.8,
      );
    }
  });

  /** Few, sensible stops. His own plan makes three; the generated one may not need more than four. */
  test('does not turn the ride into a shopping trip', () => {
    expect(result.newStops.length).toBeLessThanOrEqual(4);
  });
});
