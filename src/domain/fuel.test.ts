import { describe, expect, test } from 'vitest';
import {
  absCap,
  carbsFill,
  citricAmount,
  citricGramsFromAmount,
  cph,
  dist,
  distanceAtTime,
  eff,
  fmtFruitFraction,
  fmtFruitFractionPct,
  fmtHM,
  fmtX,
  fracFill,
  fracFood,
  honeyGramsFromCarbs,
  mixSplit,
  planExtras,
  planSummary,
  preRideGut,
  presetTagFor,
  prof,
  rangeLabel,
  rateStats,
  recoveryCarbs,
  samples,
  sweat,
  timeAtDistance,
  timeWeight,
  totalHours,
} from './fuel';
import type { Fill, FoodItem, MixSettings, PlanState, RouteInput, Vessel } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
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

function makeMix(overrides: Partial<MixSettings> = {}): MixSettings {
  return {
    conc: 11,
    gelConc: 60,
    ratio: 2,
    gelRatio: 2,
    ratioPreset: 'iso',
    gelRatioPreset: 'iso',
    salt: 0.16,
    citric: 0.2,
    gelSalt: 0.4,
    gelCitric: 0.5,
    citricSource: 'citric',
    gelCitricSource: 'citric',
    ...overrides,
  };
}

function makePlan(overrides: Partial<PlanState> = {}): PlanState {
  return {
    route: makeRoute(),
    mix: makeMix(),
    gear: [],
    fills: [],
    foods: [],
    foodLib: [],
    shops: [],
    ...overrides,
  };
}

describe('timeWeight', () => {
  test('flat ground: weight 1', () => {
    expect(timeWeight(0)).toBe(1);
  });

  test('moderate uphill (5%): 50% longer per km', () => {
    expect(timeWeight(5)).toBeCloseTo(1.5, 6);
  });

  test('steep uphill (15%): scales linearly, no cap', () => {
    expect(timeWeight(15)).toBeCloseTo(2.5, 6);
  });

  test('moderate downhill (-5%): faster than flat', () => {
    expect(timeWeight(-5)).toBeCloseTo(0.65, 6);
  });

  test('steep downhill (-20%): clamped at the 0.55 floor', () => {
    expect(timeWeight(-20)).toBe(0.55);
  });
});

describe('totalHours', () => {
  test('route mode: distance / speed', () => {
    expect(totalHours(makeRoute({ mode: 'route', distance: 200, speed: 25 }))).toBe(8);
  });

  test('route mode with speed 0 avoids division by zero', () => {
    expect(totalHours(makeRoute({ mode: 'route', distance: 200, speed: 0 }))).toBe(0);
  });

  test('time mode: hours + minutes/60', () => {
    expect(totalHours(makeRoute({ mode: 'time', hours: 1, minutes: 30 }))).toBe(1.5);
  });
});

describe('dist', () => {
  test('route mode: distance clamped to at least 1', () => {
    expect(dist(makeRoute({ mode: 'route', distance: 5 }))).toBe(5);
    expect(dist(makeRoute({ mode: 'route', distance: 0 }))).toBe(1);
  });

  test('time mode: virtual km = round(totalHours * 10)', () => {
    expect(dist(makeRoute({ mode: 'time', hours: 1, minutes: 0 }))).toBe(10);
    expect(dist(makeRoute({ mode: 'time', hours: 0, minutes: 6 }))).toBe(1);
  });
});

describe('cph', () => {
  test('under 1 hour', () => {
    const h = makeRoute({ mode: 'route', distance: 10, speed: 20 }); // 0.5h
    expect(cph({ ...h, intensity: 'low' })).toBe(30);
    expect(cph({ ...h, intensity: 'mid' })).toBe(45);
    expect(cph({ ...h, intensity: 'high' })).toBe(60);
  });

  test('between 1 and 2.5 hours inclusive', () => {
    const h = makeRoute({ mode: 'route', distance: 50, speed: 25 }); // 2h
    expect(cph({ ...h, intensity: 'low' })).toBe(30);
    expect(cph({ ...h, intensity: 'mid' })).toBe(45);
    expect(cph({ ...h, intensity: 'high' })).toBe(60);

    const boundary = makeRoute({ mode: 'route', distance: 25, speed: 25 }); // exactly 1h
    expect(cph({ ...boundary, intensity: 'mid' })).toBe(45);
  });

  test('over 2.5 hours', () => {
    const h = makeRoute({ mode: 'route', distance: 300, speed: 25 }); // 12h
    expect(cph({ ...h, intensity: 'low' })).toBe(60);
    expect(cph({ ...h, intensity: 'mid' })).toBe(75);
    expect(cph({ ...h, intensity: 'high' })).toBe(90);
  });
});

describe('sweat', () => {
  test('baseline: weight 75, temp <= 15, mid intensity', () => {
    expect(sweat(makeRoute({ weight: 75, temp: 15, intensity: 'mid' }))).toBe(490);
  });

  test('high intensity, no heat penalty', () => {
    expect(sweat(makeRoute({ weight: 75, temp: 10, intensity: 'high' }))).toBe(600);
  });

  test('default profile-like values (weight 78, low, temp 24)', () => {
    expect(sweat(makeRoute({ weight: 78, temp: 24, intensity: 'low' }))).toBe(790);
  });
});

describe('absCap', () => {
  test('default ratio 2:1', () => {
    expect(absCap(makeMix({ ratio: 2 }))).toBe(90);
  });

  test('ratio 1:1 favors fructose limit', () => {
    expect(absCap(makeMix({ ratio: 1 }))).toBe(64);
  });

  test('very low ratio clamps to the 45 g/h floor', () => {
    expect(absCap(makeMix({ ratio: 0.2 }))).toBe(45);
  });

  test('with no izo/gel carb split given, falls back to the izo ratio alone', () => {
    const mix = makeMix({ ratio: 2, gelRatio: 0.8 });
    expect(absCap(mix)).toBe(absCap(makeMix({ ratio: 2 })));
    expect(absCap(mix, 0, 0)).toBe(absCap(mix));
  });

  test('all-izo carbs matches the izo-only calculation regardless of gelRatio', () => {
    const mix = makeMix({ ratio: 2, gelRatio: 0.8 });
    expect(absCap(mix, 100, 0)).toBe(absCap(makeMix({ ratio: 2 })));
  });

  test('all-gel carbs matches the gel-only calculation regardless of ratio', () => {
    const mix = makeMix({ ratio: 2, gelRatio: 0.8 });
    expect(absCap(mix, 0, 100)).toBe(absCap(makeMix({ ratio: 0.8 })));
  });

  test('gel-heavy plan (izo 2:1, gel 0.8:1, ~80% carbs from gel) blends down toward the gel cap, not the izo-only figure', () => {
    // Regression for the bug where absCap ignored gelRatio entirely and reported the
    // izo-only cap (~90 g/h) even when most of the plan's carbs came from a lower-ratio gel.
    const mix = makeMix({ ratio: 2, gelRatio: 0.8 });
    const izoOnlyCap = absCap(makeMix({ ratio: 2 }));
    const blended = absCap(mix, 20, 80);
    expect(blended).toBe(63);
    expect(blended).toBeLessThan(izoOnlyCap);
  });

  test('a 50/50 izo/gel carb split lands between the two single-source caps', () => {
    const mix = makeMix({ ratio: 2, gelRatio: 0.8 });
    const izoOnlyCap = absCap(mix, 100, 0);
    const gelOnlyCap = absCap(mix, 0, 100);
    const blended = absCap(mix, 50, 50);
    expect(blended).toBeGreaterThanOrEqual(gelOnlyCap);
    expect(blended).toBeLessThanOrEqual(izoOnlyCap);
  });
});

describe('preRideGut', () => {
  test('nothing eaten before start: zero gut', () => {
    const route = makeRoute({ preMealCarbs: 0, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('eaten right at the start line: full carbs still in gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 0 });
    expect(preRideGut(route, 60)).toBe(50);
  });

  test('fully digested by start (cap * hours >= carbs): zero gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 60 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('partially digested: leftover = carbs - cap * hours', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBeCloseTo(5, 6); // 50 - 60*0.75
  });
});

describe('prof / eff', () => {
  test('useGpx disabled flattens effort to 1 and cum is linear', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
    const P = prof(route);
    expect(P.pts).toHaveLength(161);
    expect(P.pts.every((p) => p.effort === 1)).toBe(true);
    expect(P.cum[0]).toBe(0);
    expect(P.cum[160]).toBe(160);
    expect(P.cum[80]).toBe(80);
  });

  test('eff interpolates cumulative effort along distance', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
    expect(eff(route, 0)).toBe(0);
    expect(eff(route, 50)).toBe(80);
    expect(eff(route, 100)).toBe(160);
  });

  test('synthetic profile (useGpx on, no track) stays within physical bounds', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: true, gpxTrack: null });
    const P = prof(route);
    expect(P.pts.every((p) => p.ele >= 40)).toBe(true);
    expect(P.pts.every((p) => p.effort >= 0.32 && p.effort <= 2.3)).toBe(true);
  });

  test('GPX track elevation is interpolated across samples', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: true,
      gpxTrack: { id: 1, ele: [100, 200, 300] },
    });
    const P = prof(route);
    expect(P.pts[0].ele).toBe(100);
    expect(P.pts[80].ele).toBe(200);
    expect(P.pts[160].ele).toBe(300);
  });

  test('cumTime is linear in distance when useGpx is false, regardless of a loaded gpxTrack', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: false,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const P = prof(route);
    expect(P.cumTime[0]).toBe(0);
    expect(P.cumTime[80]).toBeCloseTo(50, 6);
    expect(P.cumTime[160]).toBeCloseTo(100, 6);
  });

  test('cumTime gives disproportionate weight to a climb when useGpx is true', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs 500m over the first half, flat second half
    });
    const P = prof(route);
    expect(P.cumTime[0]).toBe(0);
    // First half (the climb) should account for more than half of the raw cumulative time.
    expect(P.cumTime[80]).toBeGreaterThan(P.cumTime[160] / 2);
  });
});

describe('timeAtDistance / distanceAtTime', () => {
  test('useGpx false: reduces to constant-speed division (matches old km/kmh behavior)', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false }); // 4h total
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeCloseTo(2, 6);
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6);
  });

  test('useGpx true: a climb gets more than its distance share of elapsed time', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25, // 4h total
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs first half, flat second half
    });
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeGreaterThan(2); // more than half of 4h for the climb half
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6); // total is always preserved
  });

  test('distanceAtTime is the inverse of timeAtDistance', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const t = timeAtDistance(route, 63);
    expect(distanceAtTime(route, t)).toBeCloseTo(63, 3);
  });

  test('distanceAtTime at the boundaries', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false });
    expect(distanceAtTime(route, 0)).toBe(0);
    expect(distanceAtTime(route, 4)).toBeCloseTo(100, 6);
  });

  test('chart ticks and their labels agree (distanceAtTime -> fmtX round-trip)', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    for (const hh of [0, 0.5, 1, 2, 3, 4]) {
      expect(fmtX(distanceAtTime(route, hh), false, route, 'h')).toBe(fmtHM(hh));
    }
  });
});

describe('carbsFill', () => {
  const gear: Vessel[] = [
    { gid: 'g1', name: 'Bidon', vol: 720, allowed: ['water', 'izo'], gelParts: 4 },
    { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
  ];
  const mix = makeMix({ conc: 11, gelConc: 60 });

  test('water carries no carbs', () => {
    const f: Fill = { fid: 1, gid: 'g1', content: 'water', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBe(0);
  });

  test('izo scales with vessel volume and mix concentration', () => {
    const f: Fill = { fid: 2, gid: 'g1', content: 'izo', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBeCloseTo(79.2, 6);
  });

  test('gel scales with vessel volume and gel concentration', () => {
    const f: Fill = { fid: 3, gid: 'g2', content: 'gel', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBe(150);
  });
});

describe('citricAmount', () => {
  test('citric source passes the gram amount through unchanged', () => {
    expect(citricAmount(1.2, 'citric')).toEqual({ amount: 1.2, unit: 'g' });
  });

  test('lemonJuice converts citric-acid grams into juice ml using ~5% w/v yield', () => {
    const result = citricAmount(1, 'lemonJuice');
    expect(result.unit).toBe('ml');
    expect(result.amount).toBeCloseTo(20, 6);
  });

  test('limeJuice converts citric-acid grams into juice ml using ~6% w/v yield', () => {
    const result = citricAmount(1, 'limeJuice');
    expect(result.unit).toBe('ml');
    expect(result.amount).toBeCloseTo(16.6667, 3);
  });

  test('limeJuice yields less ml than lemonJuice for the same citric-acid target (lime is more concentrated)', () => {
    expect(citricAmount(1, 'limeJuice').amount).toBeLessThan(citricAmount(1, 'lemonJuice').amount);
  });

  test('zero grams converts to zero regardless of source', () => {
    expect(citricAmount(0, 'citric').amount).toBe(0);
    expect(citricAmount(0, 'lemon').amount).toBe(0);
    expect(citricAmount(0, 'lemonJuice').amount).toBe(0);
    expect(citricAmount(0, 'lime').amount).toBe(0);
    expect(citricAmount(0, 'limeJuice').amount).toBe(0);
  });

  test('whole lemon returns the raw (unrounded) fraction of a fruit, not quantized to a quarter', () => {
    // 1g citric-acid-equivalent -> 20ml juice (5% w/v) -> 20/45 of a whole lemon = 0.4444...
    const result = citricAmount(1, 'lemon');
    expect(result.unit).toBe('fruit');
    expect(result.amount).toBeCloseTo(20 / 45, 9);
  });

  test('whole lime returns the raw (unrounded) fraction of a fruit, not quantized to a quarter', () => {
    // 1g citric-acid-equivalent -> ~16.67ml juice (6% w/v) -> 16.67/30 of a whole lime = 0.5556...
    const result = citricAmount(1, 'lime');
    expect(result.unit).toBe('fruit');
    expect(result.amount).toBeCloseTo(1 / 0.06 / 30, 6);
  });

  test('a bigger amount can exceed one whole fruit without rounding to a quarter', () => {
    // 3g citric-acid-equivalent -> 60ml juice -> 60/45 = 1.3333... lemons, not rounded to 1.25
    expect(citricAmount(3, 'lemon').amount).toBeCloseTo(60 / 45, 9);
  });

  test('zero grams needs zero fruit', () => {
    expect(citricAmount(0, 'lemon')).toEqual({ amount: 0, unit: 'fruit' });
    expect(citricAmount(0, 'lime')).toEqual({ amount: 0, unit: 'fruit' });
  });

  test('regression: the default 0.2g/100ml citric setting is a small but real fraction of a lemon, not zero', () => {
    // This is the exact repro reported against the settings panel: citricAmount used to bake in
    // quarter-fruit rounding, so this realistic small amount silently collapsed to 0 before ever
    // reaching the editable percentage display. 0.2g -> 4ml juice -> 4/45 of a lemon ≈ 8.9%.
    const result = citricAmount(0.2, 'lemon');
    expect(result.unit).toBe('fruit');
    expect(result.amount).toBeGreaterThan(0);
    expect(result.amount).toBeCloseTo(0.2 / 0.05 / 45, 9);
    expect(result.amount * 100).toBeCloseTo(8.89, 1);
  });
});

describe('fmtFruitFraction', () => {
  test('formats whole numbers and quarter fractions as plain ASCII text', () => {
    expect(fmtFruitFraction(0)).toBe('0');
    expect(fmtFruitFraction(0.25)).toBe('1/4');
    expect(fmtFruitFraction(0.5)).toBe('1/2');
    expect(fmtFruitFraction(0.75)).toBe('3/4');
    expect(fmtFruitFraction(1)).toBe('1');
    expect(fmtFruitFraction(1.25)).toBe('1 1/4');
    expect(fmtFruitFraction(2)).toBe('2');
  });

  test('never emits the unicode fraction glyphs (¼ ½ ¾)', () => {
    for (const n of [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5]) {
      expect(fmtFruitFraction(n)).not.toMatch(/[¼½¾]/);
    }
  });

  test('rounds a raw (unquantized) fraction to the nearest quarter for display, since citricAmount no longer pre-rounds', () => {
    // 0.089 is under 1/8, so it rounds down to a clean "0" rather than showing raw noise.
    expect(fmtFruitFraction(0.089)).toBe('0');
    // 0.44 is closer to 1/2 than to 1/4.
    expect(fmtFruitFraction(0.44)).toBe('1/2');
    // 1.3333 (e.g. 60/45 lemons) is closer to 1 1/4 than to 1 1/2.
    expect(fmtFruitFraction(1.3333)).toBe('1 1/4');
  });
});

describe('fmtFruitFractionPct', () => {
  test('appends a percentage alongside the ASCII fraction for amounts under one whole fruit', () => {
    expect(fmtFruitFractionPct(0)).toBe('0');
    expect(fmtFruitFractionPct(0.25)).toBe('1/4 (25%)');
    expect(fmtFruitFractionPct(0.5)).toBe('1/2 (50%)');
    expect(fmtFruitFractionPct(0.75)).toBe('3/4 (75%)');
  });

  test('drops the percentage at or above one whole fruit — the mixed-number fraction alone is clear', () => {
    expect(fmtFruitFractionPct(1)).toBe('1');
    expect(fmtFruitFractionPct(1.25)).toBe('1 1/4');
    expect(fmtFruitFractionPct(1.75)).toBe('1 3/4');
    expect(fmtFruitFractionPct(2)).toBe('2');
    expect(fmtFruitFractionPct(6.75)).toBe('6 3/4');
  });

  test('never shows a percentage for amounts >= 1', () => {
    for (const n of [1, 1.25, 1.5, 1.75, 2, 2.5, 6.75]) {
      expect(fmtFruitFractionPct(n)).not.toMatch(/%/);
    }
  });

  test('shows a percentage for fractional amounts under 1', () => {
    for (const n of [0.25, 0.5, 0.75]) {
      expect(fmtFruitFractionPct(n)).toMatch(/%/);
    }
  });

  test('never emits the unicode fraction glyphs (¼ ½ ¾)', () => {
    for (const n of [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 6.75]) {
      expect(fmtFruitFractionPct(n)).not.toMatch(/[¼½¾]/);
    }
  });
});

describe('citricGramsFromAmount', () => {
  test('citric source passes the gram amount through unchanged', () => {
    expect(citricGramsFromAmount(1.2, 'citric')).toBe(1.2);
  });

  test('is the exact inverse of citricAmount for the juice sources (linear ratio)', () => {
    for (const source of ['lemonJuice', 'limeJuice'] as const) {
      for (const grams of [0, 0.4, 1, 3.7, 10]) {
        const ml = citricAmount(grams, source).amount;
        expect(citricGramsFromAmount(ml, source)).toBeCloseTo(grams, 9);
      }
    }
  });

  test('round-trips grams -> ml -> grams for lemonJuice using the ~5% w/v yield', () => {
    // 1g -> 20ml (per citricAmount test above) -> back to 1g.
    expect(citricGramsFromAmount(20, 'lemonJuice')).toBeCloseTo(1, 9);
  });

  test('round-trips grams -> ml -> grams for limeJuice using the ~6% w/v yield', () => {
    expect(citricGramsFromAmount(16.6667, 'limeJuice')).toBeCloseTo(1, 3);
  });

  test('round-trips grams -> fruit-fraction -> grams exactly for whole-fruit sources, including non-quarter fractions', () => {
    // Now that citricAmount returns the raw unrounded fraction, round-tripping is exact for any
    // fraction, not just quarter increments — this is the fix: the settings panel needs precise
    // round-tripping so typing an arbitrary percentage doesn't silently drift or collapse to 0.
    for (const source of ['lemon', 'lime'] as const) {
      for (const fraction of [0, 0.0889, 0.25, 0.3333, 0.5, 0.75, 1, 1.25, 1.3333, 1.5, 2]) {
        const grams = citricGramsFromAmount(fraction, source);
        expect(citricAmount(grams, source).amount).toBeCloseTo(fraction, 9);
      }
    }
  });

  test('round-trips an arbitrary small citric-acid amount through the lemon fraction exactly (no quarter-fruit rounding loss)', () => {
    // 0.2g citric-equivalent (the app's default) -> a small raw fraction of a lemon -> converting
    // that fraction straight back to grams now reproduces the original exactly, since citricAmount
    // no longer quantizes to a quarter fruit before this inverse gets a chance to run.
    const original = 0.2;
    const displayed = citricAmount(original, 'lemon');
    expect(displayed.unit).toBe('fruit');
    const roundTripped = citricGramsFromAmount(displayed.amount, 'lemon');
    expect(roundTripped).toBeCloseTo(original, 9);
  });

  test('zero amount converts to zero grams regardless of source', () => {
    expect(citricGramsFromAmount(0, 'citric')).toBe(0);
    expect(citricGramsFromAmount(0, 'lemon')).toBe(0);
    expect(citricGramsFromAmount(0, 'lemonJuice')).toBe(0);
    expect(citricGramsFromAmount(0, 'lime')).toBe(0);
    expect(citricGramsFromAmount(0, 'limeJuice')).toBe(0);
  });
});

describe('fracFill', () => {
  const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
  const gear: Vessel[] = [
    { gid: 'g1', name: 'Bidon', vol: 720, allowed: ['water', 'izo'], gelParts: 4 },
  ];

  test('continuous fill ramps from 0 to 1 between from and to', () => {
    const f: Fill = { fid: 1, gid: 'g1', content: 'izo', from: 20, to: 80 };
    expect(fracFill(f, 10, gear, route)).toBe(0);
    expect(fracFill(f, 20, gear, route)).toBe(0);
    expect(fracFill(f, 50, gear, route)).toBeCloseTo(0.5, 6);
    expect(fracFill(f, 80, gear, route)).toBe(1);
    expect(fracFill(f, 90, gear, route)).toBe(1);
  });

  test('point fill (from === to) is a step function', () => {
    const f: Fill = { fid: 2, gid: 'g1', content: 'izo', from: 50, to: 50 };
    expect(fracFill(f, 49, gear, route)).toBe(0);
    expect(fracFill(f, 50, gear, route)).toBe(1);
    expect(fracFill(f, 60, gear, route)).toBe(1);
  });

  test('gel split into parts steps at each portion position', () => {
    const gelGear: Vessel[] = [
      { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
    ];
    const f: Fill = { fid: 3, gid: 'g2', content: 'gel', from: 0, to: 90 };
    const gelRoute = makeRoute({ mode: 'route', distance: 90, useGpx: false });
    expect(fracFill(f, 0, gelGear, gelRoute)).toBeCloseTo(1 / 3, 6);
    expect(fracFill(f, 44.9, gelGear, gelRoute)).toBeCloseTo(1 / 3, 6);
    expect(fracFill(f, 45, gelGear, gelRoute)).toBeCloseTo(2 / 3, 6);
    expect(fracFill(f, 89.9, gelGear, gelRoute)).toBeCloseTo(2 / 3, 6);
    expect(fracFill(f, 90, gelGear, gelRoute)).toBe(1);
  });
});

describe('fracFood', () => {
  const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });

  test('one-off food is a step function at "from"', () => {
    const fd: FoodItem = { id: 1, key: 'ban', name: 'Banan', carbs: 25, from: 62, to: 62 };
    expect(fracFood(fd, 61, route)).toBe(0);
    expect(fracFood(fd, 62, route)).toBe(1);
  });

  test('continuous food ramps like a fill', () => {
    const fd: FoodItem = {
      id: 2,
      key: 'chew',
      name: 'Zelki',
      carbs: 30,
      cont: true,
      from: 20,
      to: 80,
    };
    expect(fracFood(fd, 20, route)).toBe(0);
    expect(fracFood(fd, 50, route)).toBeCloseTo(0.5, 6);
    expect(fracFood(fd, 80, route)).toBe(1);
  });
});

describe('samples', () => {
  test('zero positions in the plan: no intake anywhere, need still ramps up', () => {
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        useGpx: false,
      }),
      fills: [],
      foods: [],
    });
    const S = samples(plan);
    expect(S).toHaveLength(161);
    for (const p of [S[0], S[80], S[160]]) {
      expect(p.intake).toBe(0);
      expect(p.absorbed).toBe(0);
      expect(p.gut).toBe(0);
      expect(p.ml).toBe(0);
    }
    expect(S[0].need).toBe(0);
    expect(S[80].need).toBeCloseTo(150, 6); // target=4h*75g/h=300, half distance -> half need
    expect(S[160].need).toBeCloseTo(300, 6);
  });

  test('time mode drives duration and virtual distance', () => {
    const plan = makePlan({
      route: makeRoute({ mode: 'time', hours: 2, minutes: 30, intensity: 'mid', useGpx: false }),
    });
    const S = samples(plan);
    expect(dist(plan.route)).toBe(25);
    expect(S[0].need).toBe(0);
    expect(S[160].need).toBeCloseTo(2.5 * 45, 6); // totalHours=2.5 -> cph mid=45
  });

  test('gel split into portions steps up intake at each portion boundary', () => {
    const gear: Vessel[] = [{ gid: 'g1', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'gel', from: 0, to: 90 }];
    const plan = makePlan({
      route: makeRoute({ mode: 'route', distance: 90, speed: 30, useGpx: false }),
      gear,
      fills,
    });
    const S = samples(plan);
    expect(S[0].intake).toBeCloseTo(50, 6);
    expect(S[79].intake).toBeCloseTo(50, 6);
    expect(S[80].intake).toBeCloseTo(100, 6);
    expect(S[159].intake).toBeCloseTo(100, 6);
    expect(S[160].intake).toBeCloseTo(150, 6);
  });

  test('a gel-heavy plan absorbs less by the end when gelRatio drags the blended cap down', () => {
    // Regression for the bug where samples() derived its absorption cap from mix.ratio only,
    // ignoring gelRatio entirely — a plan fuelled purely from gel used to get the izo cap
    // (90 g/h) no matter what gelRatio said. A single 200g gel dump at the start line, over a
    // 3h ride, drains fully under a 90 g/h cap (270g of capacity) but stalls partway under a
    // 45 g/h cap (135g of capacity) — so the two mixes below should end with different
    // `absorbed` totals, not the same one.
    const gear: Vessel[] = [{ gid: 'g1', name: 'Flask', vol: 200, allowed: ['gel'], gelParts: 1 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'gel', from: 0, to: 0 }];
    const route = makeRoute({
      mode: 'time',
      hours: 3,
      minutes: 0,
      useGpx: false,
      preMealCarbs: 0,
    });

    const highCapPlan = makePlan({
      route,
      gear,
      fills,
      mix: makeMix({ gelConc: 100, gelRatio: 2 }),
    });
    const lowCapPlan = makePlan({
      route,
      gear,
      fills,
      mix: makeMix({ gelConc: 100, gelRatio: 0.2 }),
    });

    const highCapAbsorbed = samples(highCapPlan).at(-1)!.absorbed;
    const lowCapAbsorbed = samples(lowCapPlan).at(-1)!.absorbed;

    expect(highCapAbsorbed).toBeCloseTo(200, 4); // 90 g/h * 3h = 270g of capacity clears the 200g dump
    expect(lowCapAbsorbed).toBeCloseTo(135, 4); // 45 g/h floor * 3h = 135g of capacity, can't clear it all
    expect(lowCapAbsorbed).toBeLessThan(highCapAbsorbed);
  });
});

describe('samples: fluidNeed / fluidNeedRate (flat 100%-of-sweat-loss rate, effort-weighted)', () => {
  // 100km/25kph=4h, weight 75kg, 20C/mid -> sweat=700ml/h (matches the water-scenario batch).
  // sweatLoss = 700*4 = 2800ml, well above the buffer (weight*15=1125ml), so totalFluidNeed is
  // the full, undiscounted 2800ml — not reduced by the buffer and not by COVERAGE_TARGET_PCT
  // (85% is a badge-only tolerance, not part of what the line itself asks for). Distributed by
  // eff(x)/tot exactly like carbs' `need` — no GPX here, so effort=1 everywhere and eff(x)/tot
  // reduces to x/D (a straight line), matching a flat ml/h target rate.
  const route = makeRoute({ distance: 100, speed: 25, weight: 75, temp: 20, intensity: 'mid' });

  test('fluidNeed is a straight line in distance to the full sweat loss when there is no GPX profile', () => {
    const S = samples(makePlan({ route }));
    expect(S[0].fluidNeed).toBe(0);
    expect(S[80].fluidNeed).toBeCloseTo(2800 * 0.5, 3); // midpoint -> half the total
    expect(S[160].fluidNeed).toBeCloseTo(2800, 3); // the full sweat loss, not an 85%-discounted figure
  });

  test('fluidNeed rises immediately from the start (no flat-zero plateau) and monotonically throughout', () => {
    const S = samples(makePlan({ route }));
    expect(S[1].fluidNeed).toBeGreaterThan(0); // nonzero right after the start line
    for (let i = 1; i < S.length; i++) {
      expect(S[i].fluidNeed).toBeGreaterThanOrEqual(S[i - 1].fluidNeed);
    }
  });

  test('a real GPX climb in the first half pulls more of the requirement onto itself than its distance share', () => {
    const gpxRoute = makeRoute({
      distance: 100,
      speed: 25,
      weight: 75,
      temp: 20,
      intensity: 'mid',
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs first half, flat second half
    });
    const S = samples(makePlan({ route: gpxRoute }));
    // Same pattern as prof()'s own "cumTime gives disproportionate weight to a climb" test.
    expect(S[80].fluidNeed).toBeGreaterThan(S[160].fluidNeed / 2);
    // The total at the finish is unaffected by how it's distributed along the way.
    expect(S[160].fluidNeed).toBeCloseTo(2800, 3);
  });

  test('a mild ride where the buffer covers the whole route keeps fluidNeed at a flat 0 throughout', () => {
    // Mirrors water-scenario #3 (short/mild): sweat*hours never exceeds weight*15, so there is
    // honestly nothing to actively plan for.
    const mildRoute = makeRoute({
      distance: 20,
      speed: 25,
      weight: 85,
      temp: 10,
      intensity: 'low',
    });
    const S = samples(makePlan({ route: mildRoute }));
    S.forEach((p) => expect(p.fluidNeed).toBe(0));
  });

  test('fluidNeedRate is exactly flat at sweatRate from km 0 (no EMA warm-up curve)', () => {
    const S = samples(makePlan({ route }));
    // Not smoothed like needRate/rate: with no GPX, fluidNeed is perfectly linear in x, so its
    // per-step derivative is the same constant (totalFluidNeed/hours = 2800/4 = 700 = sweatRate,
    // no discount applied) at every single sample, immediately — including index 0.
    S.forEach((p) => {
      expect(Number.isFinite(p.fluidNeedRate)).toBe(true);
      expect(p.fluidNeedRate).toBeCloseTo(700, 6);
    });
  });

  test('fluidRate is also exactly flat from km 0 for a single continuous fill (no EMA warm-up curve)', () => {
    const gear: Vessel[] = [
      { gid: 'g1', name: 'Bidon', vol: 1000, allowed: ['water'], gelParts: 1 },
    ];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'water', from: 0, to: 100 }];
    const S = samples(makePlan({ route, gear, fills }));
    // 1000ml delivered evenly over the 4h ride = 250ml/h constant, immediately — not ramping up
    // from 0 the way an EMA-smoothed rate would.
    S.forEach((p) => {
      expect(Number.isFinite(p.fluidRate)).toBe(true);
      expect(p.fluidRate).toBeCloseTo(250, 6);
    });
  });
});

describe('rateStats', () => {
  test('zero positions in the plan: coverage 0%, dry stretch spans the whole ride', () => {
    const plan = makePlan({
      route: makeRoute({ mode: 'time', hours: 0, minutes: 30, intensity: 'mid', useGpx: false }),
    });
    const { coverage, dryStretch } = rateStats(plan);
    expect(coverage).toBe(0);
    expect(dryStretch.len).toBeCloseTo(0.5, 6);
    expect(dryStretch.x).toBe(5); // dist() for 0.5h in time mode
  });
});

describe('fmtHM', () => {
  test('formats fractional hours as H:MM', () => {
    expect(fmtHM(1.5)).toBe('1:30');
    expect(fmtHM(2)).toBe('2:00');
    expect(fmtHM(5 / 60)).toBe('0:05');
  });
});

describe('fmtX', () => {
  test('km axis rounds to whole kilometers', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25 });
    expect(fmtX(45.4, true, route, 'km')).toBe('45 km');
    expect(fmtX(45.4, false, route, 'km')).toBe('45');
  });

  test('time axis converts km to elapsed H:MM using average speed', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25 }); // 4h, 25 km/h
    expect(fmtX(50, true, route, 'h')).toBe('2:00 h');
  });

  test('time mode always uses the time axis regardless of xUnit', () => {
    const route = makeRoute({ mode: 'time', hours: 2, minutes: 0 }); // dist=20, 10 km/h
    expect(fmtX(10, true, route, 'km')).toBe('1:00 h');
  });

  test('time axis reflects gradient when useGpx is true (climb gets a later label than flat division would)', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25, // flat-division would put 50km at exactly "2:00"
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const label = fmtX(50, true, route, 'h');
    expect(label).not.toBe('2:00 h');
  });
});

describe('rangeLabel', () => {
  const route = makeRoute({ mode: 'route', distance: 100, speed: 25 });

  test('range renders "from–to unit"', () => {
    expect(rangeLabel(20, 80, false, route, 'km')).toBe('20–80 km');
  });

  test('point renders a single labeled value', () => {
    expect(rangeLabel(20, 80, true, route, 'km')).toBe('20 km');
  });
});

describe('planSummary', () => {
  test('aggregates target, carbs, hydration and delegates coverage/absorbed to rateStats/samples', () => {
    const gear: Vessel[] = [{ gid: 'g1', name: 'Bidon', vol: 500, allowed: ['izo'], gelParts: 4 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 100 }];
    const foods: FoodItem[] = [{ id: 1, key: 'ban', name: 'Banana', carbs: 25, from: 50, to: 50 }];
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        temp: 20,
        useGpx: false,
      }),
      gear,
      fills,
      foods,
    });

    const summary = planSummary(plan);

    expect(summary.target).toBeCloseTo(300, 6); // 4h * 75 g/h (mid, >2.5h)
    expect(summary.izoCarbs).toBeCloseTo(55, 6); // 500ml/100 * 11 g/100ml
    expect(summary.gelCarbs).toBe(0);
    expect(summary.foodCarbs).toBe(25);
    expect(summary.totalCarbs).toBeCloseTo(80, 6);
    expect(summary.fluidPlanned).toBe(500); // izo volume, no gel, no food ml
    expect(summary.sweatLoss).toBe(2800); // round(sweat=700 * 4h)
    expect(summary.hydrationPct).toBe(18); // round(500/2800*100)
    expect(summary.coverage).toBe(rateStats(plan).coverage);
    expect(summary.absorbedTotal).toBe(samples(plan).at(-1)!.absorbed);
  });

  test('zero-duration plan has zero sweat loss and reports full hydration coverage', () => {
    const zeroHrsPlan = makePlan({
      route: makeRoute({
        mode: 'time',
        hours: 0,
        minutes: 0,
        weight: 75,
        intensity: 'low',
        temp: 0,
      }),
    });
    expect(planSummary(zeroHrsPlan).sweatLoss).toBe(0);
    expect(planSummary(zeroHrsPlan).hydrationPct).toBe(100);
  });

  test('a mild ride under the short-ride buffer gate reports full hydration coverage, not a raw 0%', () => {
    // Regression: sweatLoss > 0 but below weight*15 (the same gate that zeroes samples()'s
    // fluidNeed target) used to divide fluidPlanned by the raw sweatLoss anyway, so a mild ride
    // with no water fills reported 0%/red even though the chart's target line was flat 0
    // (nothing to actively cover) — the two disagreed in the exact opposite direction of the
    // original chart-vs-badge mismatch this rework set out to fix.
    const mildPlan = makePlan({
      route: makeRoute({ distance: 20, speed: 25, weight: 85, temp: 10, intensity: 'low' }),
    });
    const summary = planSummary(mildPlan);
    expect(summary.sweatLoss).toBe(344); // round(430 * 0.8h), under the 85*15=1275ml buffer
    expect(summary.hydrationPct).toBe(100);
  });
});

describe('planExtras', () => {
  test('with no fills/foods, gut never accumulates', () => {
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        temp: 20,
        useGpx: false,
      }),
    });

    const extras = planExtras(plan);

    expect(extras.gutPeak).toEqual({ g: 0, x: 0 });
    expect(extras.refillTotal).toBe(0);
    expect(extras.gelPortions).toBe(0);
  });

  test('gutPeak tracks the largest un-absorbed backlog, reached right at the first gel step', () => {
    // Reuses the "gel split into portions" samples() fixture: intake steps 0 -> 50 -> 100 g.
    // The very first step dumps 50g into the gut before any absorption has happened (i=0 skips
    // the absorption pass), which is a bigger backlog than the second 50g step produces once
    // absorption has already been draining the gut for 80 samples.
    const gear: Vessel[] = [{ gid: 'g1', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'gel', from: 0, to: 90 }];
    const plan = makePlan({
      route: makeRoute({ mode: 'route', distance: 90, speed: 30, useGpx: false }),
      gear,
      fills,
    });

    const extras = planExtras(plan);

    expect(extras.gutPeak).toEqual({ g: 50, x: 0 });
    expect(extras.refillTotal).toBe(0);
    expect(extras.gelPortions).toBe(3);
  });

  test('counts refills per vessel beyond the first fill and sums gel portions across gel fills only', () => {
    const gear: Vessel[] = [
      { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['izo'], gelParts: 4 },
      { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
    ];
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 30 },
      { fid: 2, gid: 'g1', content: 'izo', from: 30, to: 60 },
      { fid: 3, gid: 'g1', content: 'izo', from: 60, to: 90 },
      { fid: 4, gid: 'g2', content: 'gel', from: 0, to: 100 },
    ];
    const plan = makePlan({ gear, fills });

    const extras = planExtras(plan);

    expect(extras.refillTotal).toBe(2); // g1: 3 fills -> 2 refills, g2: 1 fill -> 0 refills
    expect(extras.gelPortions).toBe(3); // single gel fill on g2, gelParts: 3
  });
});

describe('recoveryCarbs', () => {
  test('70 kg rider: 1.0-1.2 g/kg range', () => {
    expect(recoveryCarbs(70)).toEqual({ min: 70, max: 84 });
  });

  test('default 78 kg rider', () => {
    expect(recoveryCarbs(78)).toEqual({ min: 78, max: 94 });
  });

  test('rounds each bound to the nearest gram', () => {
    expect(recoveryCarbs(65)).toEqual({ min: 65, max: 78 });
  });

  test('zero weight yields zero range', () => {
    expect(recoveryCarbs(0)).toEqual({ min: 0, max: 0 });
  });
});

describe('mixSplit', () => {
  test('splits carbs proportional to the malto:fructose ratio', () => {
    const split = mixSplit(90, 2);
    expect(split.malto).toBeCloseTo(60, 5);
    expect(split.fructose).toBeCloseTo(30, 5);
  });

  test('malto + fructose always sums back to the input carbs', () => {
    const split = mixSplit(73, 0.8);
    expect(split.malto + split.fructose).toBeCloseTo(73, 5);
  });

  test('falls back to a 2:1 ratio when given 0 (falsy)', () => {
    const split = mixSplit(90, 0);
    expect(split.malto).toBeCloseTo(60, 5);
    expect(split.fructose).toBeCloseTo(30, 5);
  });
});

describe('presetTagFor', () => {
  test('maps the three named presets to their tag', () => {
    expect(presetTagFor(2)).toBe('iso');
    expect(presetTagFor(1)).toBe('sugar');
    expect(presetTagFor(0.8)).toBe('honey');
  });

  test('maps any other ratio (including the untagged 1.5 preset button) to custom', () => {
    expect(presetTagFor(1.5)).toBe('custom');
    expect(presetTagFor(3)).toBe('custom');
  });
});

describe('honeyGramsFromCarbs', () => {
  test('converts carb grams to honey mass at 80% carb fraction', () => {
    expect(honeyGramsFromCarbs(80)).toBeCloseTo(100, 5);
  });

  test('returns 0 for 0 carbs', () => {
    expect(honeyGramsFromCarbs(0)).toBe(0);
  });
});
