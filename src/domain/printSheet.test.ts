import { describe, expect, test } from 'vitest';
import { printStrip, type PrintStripInput } from './printSheet';
import type { Fill, FoodItem, FoodLibEntry, RouteInput, ShopStop, Vessel } from './types';

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

function vessel(overrides: Partial<Vessel> = {}): Vessel {
  return {
    gid: 'v1',
    name: 'Bidon',
    vol: 750,
    allowed: ['water', 'izo'],
    gelParts: 1,
    ...overrides,
  };
}

function fill(overrides: Partial<Fill> = {}): Fill {
  return { fid: 1, gid: 'v1', content: 'izo', from: 0, to: 50, ...overrides };
}

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return { id: 1, key: 'bar', name: 'Bar', carbs: 25, from: 30, to: 30, ...overrides };
}

function input(overrides: Partial<PrintStripInput> = {}): PrintStripInput {
  return {
    route: makeRoute(),
    gear: [vessel()],
    fills: [],
    foods: [],
    foodLib: [],
    shops: [],
    xUnit: 'km',
    lang: 'pl',
    ...overrides,
  };
}

describe('printStrip — bottles', () => {
  test('a vessel says its name once, with its legs stacked underneath in ride order', () => {
    const strip = printStrip(
      input({
        gear: [vessel({ gid: 'a', name: 'Bidon A' }), vessel({ gid: 'b', name: 'Bidon B' })],
        fills: [
          fill({ fid: 3, gid: 'b', from: 0, to: 40 }),
          fill({ fid: 2, gid: 'a', from: 60, to: 100 }),
          fill({ fid: 1, gid: 'a', from: 0, to: 60 }),
        ],
      }),
    );
    expect(strip.fills.map((g) => [g.vessel, g.ranges])).toEqual([
      ['Bidon A', ['0–60', '60–100']],
      ['Bidon B', ['0–40']],
    ]);
  });

  test('vessels sharing a name get ordinals so the strip can tell them apart', () => {
    const strip = printStrip(
      input({
        gear: [vessel({ gid: 'a' }), vessel({ gid: 'b' })],
        fills: [fill({ fid: 1, gid: 'a' }), fill({ fid: 2, gid: 'b' })],
      }),
    );
    expect(strip.fills.map((g) => g.vessel)).toEqual(['Bidon 1', 'Bidon 2']);
  });

  test('a name held by only one vessel is left alone', () => {
    const strip = printStrip(
      input({
        gear: [vessel({ gid: 'a', name: 'Bidon' }), vessel({ gid: 'b', name: 'Bukłak' })],
        fills: [fill({ fid: 1, gid: 'a' }), fill({ fid: 2, gid: 'b' })],
      }),
    );
    expect(strip.fills.map((g) => g.vessel)).toEqual(['Bidon', 'Bukłak']);
  });

  test('ordinals count only the duplicated name, not every vessel', () => {
    const strip = printStrip(
      input({
        gear: [
          vessel({ gid: 'a', name: 'Bukłak' }),
          vessel({ gid: 'b', name: 'Bidon' }),
          vessel({ gid: 'c', name: 'Bidon' }),
        ],
        fills: [fill({ fid: 1, gid: 'a' }), fill({ fid: 2, gid: 'b' }), fill({ fid: 3, gid: 'c' })],
      }),
    );
    expect(strip.fills.map((g) => g.vessel)).toEqual(['Bukłak', 'Bidon 1', 'Bidon 2']);
  });

  test('a range reads from–to, with no unit to eat into the 30 mm strip', () => {
    const strip = printStrip(input({ fills: [fill({ from: 0, to: 84 })] }));
    expect(strip.fills[0].ranges).toEqual(['0–84']);
  });

  test('a gel fill carries its portion count; izo and water carry one', () => {
    const strip = printStrip(
      input({
        gear: [vessel({ gid: 'g', name: 'Flask', allowed: ['gel'], gelParts: 3 })],
        fills: [
          fill({ fid: 1, gid: 'g', content: 'gel' }),
          fill({ fid: 2, gid: 'g', content: 'water', from: 60, to: 100 }),
        ],
      }),
    );
    expect(strip.fills.map((g) => g.parts)).toEqual([3, 1]);
  });

  test('a switch of content starts a new heading, so the label never lies about a leg', () => {
    const strip = printStrip(
      input({
        gear: [vessel({ gid: 'a', name: 'Bidon' })],
        fills: [
          fill({ fid: 1, gid: 'a', content: 'izo', from: 0, to: 40 }),
          fill({ fid: 2, gid: 'a', content: 'water', from: 40, to: 70 }),
          fill({ fid: 3, gid: 'a', content: 'izo', from: 70, to: 100 }),
        ],
      }),
    );
    expect(strip.fills.map((g) => [g.content, g.ranges])).toEqual([
      ['izo', ['0–40']],
      ['water', ['40–70']],
      ['izo', ['70–100']],
    ]);
  });

  test('a fill on a vessel that no longer exists is dropped rather than printed nameless', () => {
    const strip = printStrip(
      input({ gear: [vessel({ gid: 'a' })], fills: [fill({ gid: 'gone' })] }),
    );
    expect(strip.fills).toEqual([]);
  });
});

describe('printStrip — food', () => {
  const lib: FoodLibEntry[] = [{ key: 'bar', pl: 'Baton', en: 'Bar', carbs: 25 }];

  test('the name comes from the library in the active language', () => {
    const strip = printStrip(input({ foods: [food()], foodLib: lib, lang: 'pl' }));
    expect(strip.foods[0].name).toBe('Baton');
  });

  test('a language the library entry lacks falls back to English', () => {
    const strip = printStrip(
      input({
        foods: [food()],
        foodLib: [{ key: 'bar', pl: '', en: 'Bar', carbs: 25 }],
        lang: 'pl',
      }),
    );
    expect(strip.foods[0].name).toBe('Bar');
  });

  test('an item with no library entry keeps its own name', () => {
    const strip = printStrip(
      input({ foods: [food({ key: 'custom', name: 'Domowa kanapka' })], foodLib: lib }),
    );
    expect(strip.foods[0].name).toBe('Domowa kanapka');
  });

  test('a one-shot item prints a single point, a sipped one prints a range', () => {
    const strip = printStrip(
      input({
        foods: [food({ id: 1, from: 30, to: 30 }), food({ id: 2, cont: true, from: 40, to: 80 })],
      }),
    );
    expect(strip.foods[0].at).toBe('30');
    expect(strip.foods[1].at).toBe('40–80');
  });

  test('items run in ride order whatever order they were added in', () => {
    const strip = printStrip(
      input({ foods: [food({ id: 1, from: 70 }), food({ id: 2, from: 20 })] }),
    );
    expect(strip.foods.map((f) => f.id)).toEqual([2, 1]);
  });
});

describe('printStrip — stops', () => {
  const shop = (overrides: Partial<ShopStop> = {}): ShopStop => ({
    id: 1,
    at: 50,
    name: 'Sklep',
    ...overrides,
  });

  test('stops run in ride order and carry their position', () => {
    const strip = printStrip(
      input({ shops: [shop({ id: 1, at: 84 }), shop({ id: 2, at: 30, name: 'Stacja' })] }),
    );
    expect(strip.stops).toEqual([
      { id: 2, name: 'Stacja', ats: ['30'] },
      { id: 1, name: 'Sklep', ats: ['84'] },
    ]);
  });

  test('stops sharing a name are said once, with their kilometres listed under it', () => {
    const strip = printStrip(
      input({ shops: [shop({ id: 1, at: 150 }), shop({ id: 2, at: 225 })] }),
    );
    expect(strip.stops).toEqual([{ id: 1, name: 'Sklep', ats: ['150', '225'] }]);
  });

  test('a differently named stop in between keeps the kilometres in ride order', () => {
    const strip = printStrip(
      input({
        shops: [
          shop({ id: 1, at: 40 }),
          shop({ id: 2, at: 90, name: 'Stacja' }),
          shop({ id: 3, at: 140 }),
        ],
      }),
    );
    expect(strip.stops).toEqual([
      { id: 1, name: 'Sklep', ats: ['40'] },
      { id: 2, name: 'Stacja', ats: ['90'] },
      { id: 3, name: 'Sklep', ats: ['140'] },
    ]);
  });
});

describe('printStrip — units', () => {
  test('a time-mode route prints hours instead of kilometres', () => {
    // In time mode the distance axis is virtual: dist() = 4 h × 28 km/h (cycling, mid effort)
    // = 112 km, so a fill spanning the whole ride is 0:00–4:00 and its midpoint is 2:00.
    const strip = printStrip(
      input({
        route: makeRoute({ mode: 'time', hours: 4, minutes: 0 }),
        fills: [fill({ from: 0, to: 112 })],
        shops: [{ id: 1, at: 56, name: 'Sklep' }],
      }),
    );
    expect(strip.fills[0].ranges).toEqual(['0:00–4:00']);
    expect(strip.stops[0].ats).toEqual(['2:00']);
  });

  test('the km/h toggle is honoured on a distance route', () => {
    const strip = printStrip(input({ fills: [fill({ from: 0, to: 50 })], xUnit: 'h' }));
    expect(strip.fills[0].ranges).toEqual(['0:00–2:00']);
  });
});

describe('printStrip — empty plan', () => {
  test('every section comes back empty rather than undefined', () => {
    expect(printStrip(input())).toEqual({ fills: [], foods: [], stops: [] });
  });
});
