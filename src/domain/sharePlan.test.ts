import { describe, expect, test } from 'vitest';
import {
  buildSharedPlan,
  decodeSharedPlan,
  encodeSharedPlan,
  sharedPlanToSettingsData,
  type SharedPlan,
} from './sharePlan';
import type { SettingsExportData } from './settingsExport';

function baseData(overrides: Partial<SettingsExportData> = {}): SettingsExportData {
  return {
    route: {
      sport: 'cycling',
      mode: 'route',
      distance: 92.5,
      speed: 27.4,
      hours: 0,
      minutes: 0,
      weight: 78,
      preMealCarbs: 50,
      preMealMinutes: 45,
      intensity: 'mid',
      temp: 24,
      useGpx: true,
      gpxTrack: { id: 7, ele: [100, 120, 90] },
      gpxName: 'kielce.gpx',
      gpxError: null,
    },
    mix: {
      conc: 8.4,
      gelConc: 60,
      ratio: 2,
      gelRatio: 1.5,
      ratioPreset: 'iso',
      gelRatioPreset: 'ratio15',
      salt: 0.16,
      citric: 0.2,
      gelSalt: 0.4,
      gelCitric: 0.4,
      citricSource: 'citric',
      gelCitricSource: 'lemonJuice',
    },
    gear: [
      { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
      { gid: 'g2', name: 'Flask ż', vol: 250, allowed: ['izo', 'water', 'gel'], gelParts: 3 },
    ],
    fills: [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 45.5 },
      { fid: 2, gid: 'g2', content: 'gel', from: 10, to: 80, pos: [12.5, 40, 66.25] },
    ],
    foods: [
      { id: 101, key: 'gel', name: 'Żel', carbs: 22, from: 30, to: 30 },
      { id: 102, key: 'chew', name: 'Żelki', carbs: 30, ml: 50, cont: true, from: 50, to: 68 },
    ],
    shops: [{ id: 1, at: 45, name: 'Żabka' }],
    foodLib: [
      { key: 'gel', pl: 'Żel', en: 'Gel', de: 'Gel', it: 'Gel', carbs: 22 },
      {
        key: 'chew',
        pl: 'Żelki',
        en: 'Chews',
        de: 'Kau',
        it: 'Cara',
        carbs: 30,
        cont: true,
        span: 18,
      },
    ],
    ui: { lang: 'pl', viewMode: 'auto', themeMode: 'auto', xUnit: 'km', yMode: 'rate' },
    nextGid: 3,
    nextFid: 3,
    nextFoodId: 103,
    nextFoodKey: 1,
    nextShopId: 2,
    ...overrides,
  };
}

function roundTrip(plan: SharedPlan): SharedPlan {
  const decoded = decodeSharedPlan(encodeSharedPlan(plan));
  expect(decoded).not.toBeNull();
  return decoded as SharedPlan;
}

describe('buildSharedPlan', () => {
  test('drops the gpx track, name, error and useGpx flag', () => {
    const plan = buildSharedPlan(baseData(), false);
    expect(plan.route).not.toHaveProperty('gpxTrack');
    expect(plan.route).not.toHaveProperty('gpxName');
    expect(plan.route).not.toHaveProperty('gpxError');
    expect(plan.route).not.toHaveProperty('useGpx');
    expect(plan.route.distance).toBe(92.5);
  });

  test('omits weight unless includeWeight is set', () => {
    expect(buildSharedPlan(baseData(), false).weight).toBeNull();
    expect(buildSharedPlan(baseData(), true).weight).toBe(78);
  });
});

describe('buildSharedPlan bounds what it emits so the link is never dead on arrival', () => {
  const long = 'x'.repeat(200);

  test('truncates a vessel name no maxLength stops the user typing', () => {
    const data = baseData();
    data.gear[0].name = long;
    const decoded = roundTrip(buildSharedPlan(data, true));
    expect(decoded.gear[0].name).toBe('x'.repeat(60));
  });

  test('truncates an over-long food name and food key', () => {
    const data = baseData();
    data.foods[0].name = long;
    data.foods[0].key = 'k'.repeat(80);
    const decoded = roundTrip(buildSharedPlan(data, true));
    expect(decoded.foods[0].name).toBe('x'.repeat(60));
    expect(decoded.foods[0].key).toBe('k'.repeat(40));
  });

  test('clamps a temp an imported backup can carry past the slider', () => {
    const data = baseData();
    data.route.temp = 999;
    const decoded = roundTrip(buildSharedPlan(data, true));
    expect(decoded.route.temp).toBe(60);
  });

  test('clamps a weight outside the decoder range instead of emitting a dead link', () => {
    const data = baseData();
    data.route.weight = 5;
    expect(roundTrip(buildSharedPlan(data, true)).weight).toBe(20);
  });

  test('keeps gel doses inside their fill after clamping', () => {
    const data = baseData();
    data.fills[1].from = -30;
    data.fills[1].pos = [-10, 40, 5000];
    const decoded = roundTrip(buildSharedPlan(data, true));
    expect(decoded.fills[1].pos).toEqual([0, 40, 80]);
  });
});

describe('encode/decode round trip', () => {
  test('preserves the whole plan', () => {
    const plan = buildSharedPlan(baseData(), true);
    expect(roundTrip(plan)).toEqual(plan);
  });

  test('preserves non-ASCII names', () => {
    const decoded = roundTrip(buildSharedPlan(baseData(), true));
    expect(decoded.gear[1].name).toBe('Flask ż');
    expect(decoded.shops[0].name).toBe('Żabka');
    expect(decoded.foods[0].name).toBe('Żel');
  });

  test('preserves per-dose gel positions and optional food fields', () => {
    const decoded = roundTrip(buildSharedPlan(baseData(), true));
    expect(decoded.fills[1].pos).toEqual([12.5, 40, 66.25]);
    expect(decoded.fills[0].pos).toBeUndefined();
    expect(decoded.foods[1].ml).toBe(50);
    expect(decoded.foods[1].cont).toBe(true);
    expect(decoded.foods[0].ml).toBeUndefined();
  });

  test('round-trips a weight-omitted plan as null', () => {
    const decoded = roundTrip(buildSharedPlan(baseData(), false));
    expect(decoded.weight).toBeNull();
  });

  test('produces a URL-safe string', () => {
    expect(encodeSharedPlan(buildSharedPlan(baseData(), true))).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('stays comfortably inside a shareable URL length', () => {
    expect(encodeSharedPlan(buildSharedPlan(baseData(), true)).length).toBeLessThan(1200);
  });
});

describe('decodeSharedPlan rejects bad input', () => {
  test.each([
    ['empty', ''],
    ['not base64url', 'abc$%^&'],
    ['base64url but not JSON', 'YWJjZGVm'],
    ['truncated', encodeSharedPlan(buildSharedPlan(baseData(), true)).slice(0, 40)],
  ])('%s -> null', (_label, param) => {
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a future schema version', () => {
    const plan = buildSharedPlan(baseData(), true);
    const raw = JSON.parse(atob(encodeSharedPlan(plan).replace(/-/g, '+').replace(/_/g, '/')));
    raw[0] = 99;
    const bumped = btoa(JSON.stringify(raw))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeSharedPlan(bumped)).toBeNull();
  });

  test('rejects an out-of-range distance', () => {
    const plan = buildSharedPlan(baseData(), true);
    const broken = { ...plan, route: { ...plan.route, distance: 99999 } };
    expect(decodeSharedPlan(encodeSharedPlan(broken))).toBeNull();
  });

  test('rejects an unknown content enum', () => {
    const plan = buildSharedPlan(baseData(), true);
    const broken = {
      ...plan,
      fills: [{ ...plan.fills[0], content: 'lava' as unknown as 'izo' }],
    };
    expect(decodeSharedPlan(encodeSharedPlan(broken))).toBeNull();
  });

  test('rejects an over-long list', () => {
    const plan = buildSharedPlan(baseData(), true);
    const many = Array.from({ length: 300 }, (_, i) => ({ id: i, at: 1, name: 'x' }));
    expect(decodeSharedPlan(encodeSharedPlan({ ...plan, shops: many }))).toBeNull();
  });
});

describe('decodeSharedPlan rejects plans that type-check but are nonsense', () => {
  function shared(mutate: (plan: SharedPlan) => SharedPlan): string {
    return encodeSharedPlan(mutate(buildSharedPlan(baseData(), true)));
  }

  test('rejects a fill whose from is past its to', () => {
    const param = shared((p) => ({ ...p, fills: [{ ...p.fills[0], from: 2000, to: 0 }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a food whose from is past its to', () => {
    const param = shared((p) => ({ ...p, foods: [{ ...p.foods[0], from: 90, to: 10 }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a gel dose outside its own fill', () => {
    const param = shared((p) => ({
      ...p,
      fills: [{ ...p.fills[1], from: 10, to: 80, pos: [12.5, 500] }],
    }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a non-integer fill id', () => {
    const param = shared((p) => ({ ...p, fills: [{ ...p.fills[0], fid: 1.5 }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a negative food id', () => {
    const param = shared((p) => ({ ...p, foods: [{ ...p.foods[0], id: -1 }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a non-integer shop id', () => {
    const param = shared((p) => ({ ...p, shops: [{ ...p.shops[0], id: 0.5 }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects duplicate fill ids', () => {
    const param = shared((p) => ({
      ...p,
      fills: [p.fills[0], { ...p.fills[1], fid: p.fills[0].fid }],
    }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects duplicate food ids', () => {
    const param = shared((p) => ({
      ...p,
      foods: [p.foods[0], { ...p.foods[1], id: p.foods[0].id }],
    }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects duplicate shop ids', () => {
    const param = shared((p) => ({ ...p, shops: [p.shops[0], { ...p.shops[0] }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects duplicate vessel gids', () => {
    const param = shared((p) => ({
      ...p,
      gear: [p.gear[0], { ...p.gear[1], gid: p.gear[0].gid }],
    }));
    expect(decodeSharedPlan(param)).toBeNull();
  });

  test('rejects a fill pointing at a vessel the link does not carry', () => {
    const param = shared((p) => ({ ...p, fills: [{ ...p.fills[0], gid: 'g99' }] }));
    expect(decodeSharedPlan(param)).toBeNull();
  });
});

describe('sharedPlanToSettingsData', () => {
  test('keeps the recipient foodLib, ui prefs and nextFoodKey', () => {
    const recipient = baseData({
      foodLib: [{ key: 'own', pl: 'X', en: 'X', de: 'X', it: 'X', carbs: 5 }],
      ui: { lang: 'en', viewMode: 'desktop', themeMode: 'dark', xUnit: 'h', yMode: 'fluid' },
      nextFoodKey: 9,
    });
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), true), recipient);
    expect(merged.foodLib).toEqual(recipient.foodLib);
    expect(merged.ui).toEqual(recipient.ui);
    expect(merged.nextFoodKey).toBe(9);
  });

  test('falls back to the recipient weight when the link omits it', () => {
    const recipient = baseData();
    recipient.route.weight = 64;
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), false), recipient);
    expect(merged.route.weight).toBe(64);
  });

  test('uses the shared weight when the link carries it', () => {
    const recipient = baseData();
    recipient.route.weight = 64;
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), true), recipient);
    expect(merged.route.weight).toBe(78);
  });

  test('clears the recipient gpx track rather than keeping a stale one', () => {
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), true), baseData());
    expect(merged.route.gpxTrack).toBeNull();
    expect(merged.route.gpxName).toBeNull();
    expect(merged.route.gpxError).toBeNull();
    expect(merged.route.useGpx).toBe(false);
  });

  test('lifts the id counters above every incoming id', () => {
    const recipient = baseData({ nextGid: 2, nextFid: 1, nextFoodId: 1, nextShopId: 1 });
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), true), recipient);
    expect(merged.nextGid).toBe(3);
    expect(merged.nextFid).toBe(3);
    expect(merged.nextFoodId).toBe(103);
    expect(merged.nextShopId).toBe(2);
  });

  test('never lowers a counter the recipient already had', () => {
    const recipient = baseData({ nextGid: 40, nextFid: 40, nextFoodId: 400, nextShopId: 40 });
    const merged = sharedPlanToSettingsData(buildSharedPlan(baseData(), true), recipient);
    expect(merged.nextGid).toBe(40);
    expect(merged.nextFid).toBe(40);
    expect(merged.nextFoodId).toBe(400);
    expect(merged.nextShopId).toBe(40);
  });
});
