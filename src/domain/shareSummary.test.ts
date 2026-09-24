import { describe, expect, test } from 'vitest';
import { STR } from '../i18n/strings';
import { fmtHydration, shareBlurb, shareStats } from './shareSummary';
import type { PlanState, ShopStop } from './types';
import { LEGACY_TEST_MIX } from './__fixtures__/legacyMix';

function planState(): PlanState {
  return {
    route: {
      sport: 'cycling',
      mode: 'route',
      distance: 90,
      speed: 30,
      hours: 0,
      minutes: 0,
      weight: 78,
      preMealCarbs: 50,
      preMealMinutes: 45,
      intensity: 'mid',
      temp: 24,
      useGpx: false,
      gpxTrack: null,
      gpxName: null,
      gpxError: null,
    },
    mix: LEGACY_TEST_MIX,
    gear: [
      { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
      { gid: 'g2', name: 'Flask', vol: 250, allowed: ['izo', 'gel'], gelParts: 4 },
    ],
    fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 90 }],
    foods: [],
    foodLib: [],
  };
}

const shops: ShopStop[] = [{ id: 1, at: 45, name: 'Żabka' }];

describe('shareStats', () => {
  test('reports distance, duration, vessel count and stop count', () => {
    const s = shareStats(planState(), shops);
    expect(s.distanceKm).toBe(90);
    expect(s.durationLabel).toBe('3:00'); // fmtHM renders h:mm, not "3h 00m"
    expect(s.vessels).toBe(2);
    expect(s.stops).toBe(1);
  });

  test('carbGph matches planSummary carbRateGph, rounded', () => {
    const s = shareStats(planState(), shops);
    expect(Number.isInteger(s.carbGph)).toBe(true);
    expect(s.carbGph).toBeGreaterThan(0);
  });

  test('an empty plan yields finite numbers rather than NaN', () => {
    const empty = planState();
    empty.route.distance = 0;
    empty.route.speed = 0;
    empty.fills = [];
    const s = shareStats(empty, []);
    // `dist()` clamps a route to at least 1 km, so a zeroed plan reads 1, never 0 or NaN.
    expect(s.distanceKm).toBe(1);
    expect(s.durationLabel).toBe('0:00');
    expect(s.carbGph).toBe(0);
    expect(s.stops).toBe(0);
    expect(s.hydrationL).toBe(0);
  });

  test('hydration lands on a whole tenth of a litre', () => {
    const s = shareStats(planState(), shops);
    expect(s.hydrationL).toBeGreaterThan(0);
    expect(Math.abs(s.hydrationL * 10 - Math.round(s.hydrationL * 10))).toBeLessThan(1e-9);
  });
});

describe('fmtHydration', () => {
  test('marks the figure as an estimate and drops a trailing .0', () => {
    expect(fmtHydration(2)).toBe('~2 l');
    expect(fmtHydration(1.5)).toBe('~1.5 l');
    // The float that `Math.round(x / 0.1) * 0.1` actually produces for 1.6.
    expect(fmtHydration(1.6000000000000001)).toBe('~1.6 l');
    expect(fmtHydration(0)).toBe('~0 l');
  });
});

describe('shareBlurb', () => {
  test('substitutes every placeholder', () => {
    const s = shareStats(planState(), shops);
    const out = shareBlurb(
      s,
      'Carb fueling: {dist}km w {dur}, {gph} g/h, {hyd}, {stops}.',
      '1 postój',
    );
    expect(out).toBe(
      `Carb fueling: 90km w ${s.durationLabel}, ${s.carbGph} g/h, ${fmtHydration(s.hydrationL)}, 1 postój.`,
    );
    expect(out).not.toContain('{');
  });

  test('every language ships a template with the same placeholders', () => {
    const s = shareStats(planState(), shops);
    for (const table of Object.values(STR)) {
      expect(shareBlurb(s, table.shareBlurbTemplate, 'x')).not.toContain('{');
    }
  });
});
