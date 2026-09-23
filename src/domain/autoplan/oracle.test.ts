import { describe, expect, test } from 'vitest';
import type { MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { oracle } from './oracle';
import { compareScore, score } from './score';
import { search, space } from './search';

const route: RouteInput = {
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
  temp: 20,
  useGpx: false,
  gpxTrack: null,
  gpxName: null,
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
const bottle = (gid: string, allowed: Vessel['allowed']): Vessel => ({
  gid,
  name: 'Bidon',
  vol: 650,
  allowed,
  gelParts: 1,
});
const state = (gear: Vessel[]): PlanState => ({
  route,
  mix,
  gear,
  fills: [],
  foods: [],
  foodLib: [{ key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 }],
});

describe('oracle', () => {
  test('the space is every allowed content × loads 1..cap, times every product count', () => {
    const s = space(state([bottle('g1', ['izo', 'water'])]), [{ key: 'gel', count: 2 }]);
    expect(s.vessels).toHaveLength(1);
    expect(s.vessels[0].every((a) => a.loads >= 1)).toBe(true);
    expect(new Set(s.vessels[0].map((a) => a.content))).toEqual(new Set(['izo', 'water']));
    expect(s.size).toBe(s.vessels[0].length * 3);
  });

  test('gives up rather than enumerate past the limit', () => {
    expect(oracle(state([bottle('g1', ['izo', 'water'])]), [], 1)).toBeNull();
  });

  test('on a one-bottle ride the climb already finds the best Decision', () => {
    const st = state([bottle('g1', ['izo'])]);
    const r = oracle(st, [], 1000);
    expect(r).not.toBeNull();
    expect(compareScore(score(st, search(st)), r!.best.score)).toBe(0);
  });
});
