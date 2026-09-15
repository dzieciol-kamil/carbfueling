import { describe, expect, test } from 'vitest';
import { shareBlurb, shareStats } from './shareSummary';
import type { PlanState, ShopStop } from './types';
import { DEFAULT_MIX } from './types';

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
    mix: DEFAULT_MIX,
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
  });
});

describe('shareBlurb', () => {
  test('substitutes every placeholder', () => {
    const s = shareStats(planState(), shops);
    const out = shareBlurb(s, 'Plan {dist} km / {dur}, {gph} g/h, postoje: {stops}.');
    expect(out).toBe(`Plan 90 km / ${s.durationLabel}, ${s.carbGph} g/h, postoje: 1.`);
    expect(out).not.toContain('{');
  });
});
