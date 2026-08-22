import { describe, expect, test } from 'vitest';
import {
  buildSettingsExport,
  parseSettingsImport,
  serializeSettingsExport,
  SETTINGS_EXPORT_APP_ID,
  SETTINGS_EXPORT_SCHEMA_VERSION,
  settingsExportFileName,
  type SettingsExportData,
} from './settingsExport';

function makeData(overrides: Partial<SettingsExportData> = {}): SettingsExportData {
  return {
    route: {
      mode: 'route',
      distance: 90,
      speed: 28,
      hours: 0,
      minutes: 0,
      weight: 78,
      preMealCarbs: 50,
      preMealMinutes: 45,
      intensity: 'mid',
      temp: 24,
      useGpx: true,
      gpxTrack: null,
      gpxName: null,
      gpxError: null,
    },
    mix: {
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
    },
    gear: [{ gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 }],
    fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 50 }],
    foods: [{ id: 101, key: 'gel', name: 'Energy gel', carbs: 22, from: 10, to: 10 }],
    shops: [{ id: 1, at: 40, name: 'Shop' }],
    foodLib: [{ key: 'gel', pl: 'Żel', en: 'Gel', carbs: 22 }],
    ui: { lang: 'en', viewMode: 'auto', xUnit: 'km', yMode: 'rate' },
    nextGid: 2,
    nextFid: 2,
    nextFoodId: 102,
    nextFoodKey: 1,
    nextShopId: 2,
    ...overrides,
  };
}

describe('settingsExport', () => {
  test('round-trips data through build -> serialize -> parse', () => {
    const data = makeData();
    const file = buildSettingsExport(data, new Date('2026-08-06T12:00:00Z'));
    expect(file.app).toBe(SETTINGS_EXPORT_APP_ID);
    expect(file.schemaVersion).toBe(SETTINGS_EXPORT_SCHEMA_VERSION);
    const json = serializeSettingsExport(file);
    const result = parseSettingsImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(data);
  });

  test('filename includes an ISO date', () => {
    expect(settingsExportFileName(new Date('2026-08-06T12:00:00Z'))).toBe(
      'carb-fueling-settings-2026-08-06.json',
    );
  });

  test('rejects invalid JSON', () => {
    const result = parseSettingsImport('{not json');
    expect(result).toEqual({ ok: false, reason: 'invalid-json' });
  });

  test('rejects JSON from a different app', () => {
    const result = parseSettingsImport(
      JSON.stringify({ app: 'some-other-app', schemaVersion: 1, data: {} }),
    );
    expect(result).toEqual({ ok: false, reason: 'wrong-shape' });
  });

  test('rejects a schema version newer than supported', () => {
    const file = buildSettingsExport(makeData());
    const result = parseSettingsImport(JSON.stringify({ ...file, schemaVersion: 99 }));
    expect(result).toEqual({ ok: false, reason: 'unsupported-version' });
  });

  test('rejects malformed data payloads', () => {
    const file = buildSettingsExport(makeData());
    const badFiles = [
      { ...file, data: { ...file.data, route: undefined } },
      { ...file, data: { ...file.data, gear: [{ gid: 'g1' }] } },
      { ...file, data: { ...file.data, ui: { ...file.data.ui, lang: 'de' } } },
      {
        ...file,
        data: { ...file.data, fills: [{ fid: 1, gid: 'g1', content: 'soda', from: 0, to: 1 }] },
      },
      { ...file, data: 'not-an-object' },
    ];
    for (const bad of badFiles) {
      const result = parseSettingsImport(JSON.stringify(bad));
      expect(result.ok).toBe(false);
    }
  });

  test('rejects a route with out-of-range numeric fields', () => {
    const file = buildSettingsExport(makeData());
    const badRoutes = [
      { ...file.data.route, distance: -1 },
      { ...file.data.route, distance: 2001 },
      { ...file.data.route, speed: -1 },
      { ...file.data.route, speed: 101 },
      { ...file.data.route, weight: 19 },
      { ...file.data.route, weight: 301 },
      { ...file.data.route, hours: -1 },
      { ...file.data.route, hours: 1000 },
      { ...file.data.route, preMealCarbs: -1 },
      { ...file.data.route, preMealCarbs: 501 },
      { ...file.data.route, preMealMinutes: -1 },
      { ...file.data.route, preMealMinutes: 1441 },
    ];
    for (const route of badRoutes) {
      const result = parseSettingsImport(
        JSON.stringify({ ...file, data: { ...file.data, route } }),
      );
      expect(result.ok).toBe(false);
    }
  });

  test('rejects a gpx track elevation array beyond the sane length limit', () => {
    const file = buildSettingsExport(
      makeData({
        route: {
          ...makeData().route,
          gpxTrack: { id: 1, ele: Array.from({ length: 501 }, () => 10) },
        },
      }),
    );
    const result = parseSettingsImport(serializeSettingsExport(file));
    expect(result.ok).toBe(false);
  });

  test('rejects an empty gpx track elevation array (prof() would index out of bounds into NaN)', () => {
    const file = buildSettingsExport(
      makeData({ route: { ...makeData().route, gpxTrack: { id: 1, ele: [] } } }),
    );
    const result = parseSettingsImport(serializeSettingsExport(file));
    expect(result.ok).toBe(false);
  });

  test('accepts a single-point gpx track elevation array (a valid flat profile, not degenerate)', () => {
    const file = buildSettingsExport(
      makeData({ route: { ...makeData().route, gpxTrack: { id: 1, ele: [10] } } }),
    );
    const result = parseSettingsImport(serializeSettingsExport(file));
    expect(result.ok).toBe(true);
  });

  test('rejects an import array beyond the sane length limit', () => {
    const file = buildSettingsExport(makeData());
    const fills = Array.from({ length: 501 }, (_, i) => ({
      fid: i,
      gid: 'g1',
      content: 'izo' as const,
      from: 0,
      to: 1,
    }));
    const result = parseSettingsImport(JSON.stringify({ ...file, data: { ...file.data, fills } }));
    expect(result).toEqual({ ok: false, reason: 'wrong-shape' });
  });

  test('normalizes a legacy "sum" y-mode from an older export to "rate"', () => {
    const file = buildSettingsExport(makeData());
    const json = JSON.stringify({
      ...file,
      data: { ...file.data, ui: { ...file.data.ui, yMode: 'sum' } },
    });
    const result = parseSettingsImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.ui.yMode).toBe('rate');
  });

  test('accepts an optional gpx track and nullable route strings', () => {
    const data = makeData({
      route: {
        ...makeData().route,
        gpxTrack: { id: 1, ele: [10, 20, 15] },
        gpxName: 'track.gpx',
        gpxError: null,
      },
    });
    const file = buildSettingsExport(data);
    const result = parseSettingsImport(serializeSettingsExport(file));
    expect(result.ok).toBe(true);
  });
});
