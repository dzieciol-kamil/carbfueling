import { describe, expect, test } from 'vitest';
import {
  ascii,
  buildTcx,
  courseFileName,
  planCoursePoints,
  type CoursePlanInput,
  type CoursePoint,
} from './courseExport';
import { eff } from './fuel';
import { parseGpxXml } from './gpx';
import type { Fill, FoodItem, GpxPoint, RouteInput, Vessel } from './types';

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
  return { fid: 1, gid: 'v1', content: 'izo', from: 0, to: 100, ...overrides };
}

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return { id: 1, key: 'bar', name: 'Baton', carbs: 25, from: 30, to: 30, ...overrides };
}

function input(overrides: Partial<CoursePlanInput> = {}): CoursePlanInput {
  return {
    route: makeRoute(),
    gear: [vessel()],
    fills: [],
    foods: [],
    foodLib: [],
    shops: [],
    lang: 'pl',
    ...overrides,
  };
}

/** A straight west-east line at a constant latitude, so distance along it is easy to reason about. */
function line(n: number, eleAt: (i: number) => number = () => 100): GpxPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    lat: 52,
    lon: 20 + i * 0.01,
    // Rounded the way a stored track always is, so a round trip compares like with like.
    ele: Math.round(eleAt(i) * 10) / 10,
  }));
}

const named = (points: CoursePoint[]) => points.map((p) => p.name);

describe('planCoursePoints — bottle levels', () => {
  test('a fill spanning the whole ride gets its quarter checkpoints and an empty mark', () => {
    const points = planCoursePoints(input({ fills: [fill()] }));

    // No refill point: the leg starts at the start line, where "fill your bottles" is not news.
    expect(named(points)).toEqual(['B1 75%', 'B1 50%', 'B1 25%', 'B1 0%']);
    expect(points.map((p) => Math.round(p.km))).toEqual([25, 50, 75, 100]);
    expect(points.every((p) => p.type === 'Water')).toBe(true);
  });

  test('a leg that starts mid-ride opens with a refill prompt', () => {
    const points = planCoursePoints(input({ fills: [fill({ from: 40, to: 80 })] }));

    expect(named(points)).toEqual(['B1 100%', 'B1 75%', 'B1 50%', 'B1 25%', 'B1 0%']);
    expect(points[0].kind).toBe('refill');
    expect(points[0].note).toBe('Bidon · 100% (napełnij)');
    expect(points[0].km).toBe(40);
  });

  test('the note carries the readable level and the name carries the terse one', () => {
    const points = planCoursePoints(input({ fills: [fill()] }));

    expect(points[0].note).toBe('Bidon · 75%');
    expect(points[3].note).toBe('Bidon · 0%');
  });
});

describe('planCoursePoints — checkpoints follow effort, not distance', () => {
  // Half the climbing packed into the first quarter of the route: the rider works harder there,
  // so the plan has them drinking faster there, and the 75%-left mark must land before km 25.
  const climbFirst = makeRoute({
    useGpx: true,
    gpxTrack: { id: 1, ele: Array.from({ length: 401 }, (_, i) => (i < 100 ? i * 4 : 400)) },
  });

  test('a front-loaded climb pulls the first checkpoint earlier than the flat one', () => {
    const flat = planCoursePoints(input({ fills: [fill()] }));
    const hilly = planCoursePoints(input({ route: climbFirst, fills: [fill()] }));

    expect(hilly[0].km).toBeLessThan(flat[0].km);
    expect(flat[0].km).toBeCloseTo(25, 0);
  });

  test('each checkpoint sits where the fill has actually drained that far', () => {
    const points = planCoursePoints(input({ route: climbFirst, fills: [fill()] }));
    const total = eff(climbFirst, 100);

    // fracFill is (eff(x) - eff(from)) / (eff(to) - eff(from)); at "75% left" a quarter is gone.
    for (const [i, consumed] of [0.25, 0.5, 0.75].entries()) {
      expect(eff(climbFirst, points[i].km) / total).toBeCloseTo(consumed, 2);
    }
  });
});

describe('planCoursePoints — bottles that drain together', () => {
  const gear = [vessel({ gid: 'a' }), vessel({ gid: 'b', vol: 500 })];

  test('two bottles on the same span share one set of prompts', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [fill({ fid: 1, gid: 'a', content: 'water' }), fill({ fid: 2, gid: 'b' })],
      }),
    );

    expect(named(points)).toEqual(['B1+B2 75%', 'B1+B2 50%', 'B1+B2 25%', 'B1+B2 0%']);
    // Duplicate names get numbered, the same way the printed strip numbers them.
    expect(points[0].note).toBe('Bidon 1, Bidon 2 · 75%');
  });

  // Taken off a real plan in the running app: a water bottle and an izo bottle filled at the same
  // stop and drained over the same leg, whose ends differ by 135 m because the bars were dragged
  // rather than typed. Grouping on exact spans split these into two identical ladders.
  test('bottles whose spans differ only by drag noise still share one set of prompts', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [
          fill({ fid: 1, gid: 'a', content: 'water', from: 0, to: 22.824742268041238 }),
          fill({ fid: 2, gid: 'b', from: 0, to: 22.96 }),
        ],
      }),
    );

    expect(named(points)).toEqual(['B1+B2 75%', 'B1+B2 50%', 'B1+B2 25%', 'B1+B2 0%']);
    expect(points[0].note).toBe('Bidon 1, Bidon 2 · 75%');
  });

  test('bottles on different spans keep their own prompts', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [fill({ fid: 1, gid: 'a', to: 50 }), fill({ fid: 2, gid: 'b', from: 50, to: 100 })],
      }),
    );

    expect(named(points)).toContain('B1 25%');
    expect(named(points)).toContain('B2 25%');
  });

  test('three bottles on one span drop their numbers rather than overflow the banner', () => {
    const points = planCoursePoints(
      input({
        gear: [...gear, vessel({ gid: 'c' })],
        fills: [fill({ fid: 1, gid: 'a' }), fill({ fid: 2, gid: 'b' }), fill({ fid: 3, gid: 'c' })],
      }),
    );

    expect(named(points)).toEqual(['B* 75%', 'B* 50%', 'B* 25%', 'B* 0%']);
    expect(points[0].note).toBe('Bidon 1, Bidon 2, Bidon 3 · 75%');
  });
});

describe('planCoursePoints — gel, food and stops', () => {
  test('a gel flask gets one prompt per dose, not a percentage ladder', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'g', name: 'Flakon', allowed: ['gel'], gelParts: 3 })],
        fills: [fill({ gid: 'g', content: 'gel', from: 0, to: 90 })],
      }),
    );

    expect(named(points)).toEqual(['Zel 1/3', 'Zel 2/3', 'Zel 3/3']);
    expect(points.map((p) => p.km)).toEqual([0, 45, 90]);
    expect(points.every((p) => p.type === 'Food')).toBe(true);
  });

  test('a single-dose flask says just the word, and never asks to be refilled', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'g', name: 'Flakon', allowed: ['gel'], gelParts: 1 })],
        fills: [fill({ gid: 'g', content: 'gel', from: 40, to: 80 })],
      }),
    );

    // A one-shot gel has one part, like a bottle does — routing on that instead of on content sent
    // it down the ladder and prompted "napełnij" under a water icon.
    expect(points).toEqual([
      { km: 40, kind: 'gel', name: 'Zel', note: 'Żel · Flakon', type: 'Food' },
    ]);
  });

  test('food carries its carbs in the note', () => {
    const points = planCoursePoints(input({ foods: [food()] }));

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ km: 30, name: 'Baton', note: 'Baton · 25 g', type: 'Food' });
  });

  test('stops keep the name the rider typed', () => {
    const points = planCoursePoints(input({ shops: [{ id: 1, at: 60, name: 'Żabka' }] }));

    expect(points[0]).toMatchObject({ km: 60, name: 'Zabka', note: 'Żabka', type: 'Generic' });
  });
});

describe('planCoursePoints — merging', () => {
  test('a bottle running dry where the next one is filled becomes one prompt', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'a' }), vessel({ gid: 'b' })],
        fills: [fill({ fid: 1, gid: 'a', to: 50 }), fill({ fid: 2, gid: 'b', from: 50, to: 100 })],
      }),
    );

    const atFifty = points.filter((p) => Math.abs(p.km - 50) < 0.5);
    expect(atFifty).toHaveLength(1);
    // The refill outranks the empty mark, so that is what the device shows.
    expect(atFifty[0].name).toBe('B2 100%');
    expect(atFifty[0].note).toBe('Bidon 2 · 100% (napełnij) · Bidon 1 · 0%');
  });

  test('a refill at a stop shows the refill, with the stop named in the note', () => {
    const points = planCoursePoints(
      input({
        fills: [fill({ from: 60, to: 100 })],
        shops: [{ id: 1, at: 60, name: 'Sklep' }],
      }),
    );

    const atSixty = points.filter((p) => Math.abs(p.km - 60) < 0.5);
    expect(atSixty).toHaveLength(1);
    expect(atSixty[0].name).toBe('B1 100%');
    expect(atSixty[0].note).toContain('Sklep');
  });

  test('points further apart than the tolerance stay separate', () => {
    const points = planCoursePoints(
      input({ foods: [food({ id: 1, from: 30 }), food({ id: 2, from: 30.5 })] }),
    );

    expect(points).toHaveLength(2);
  });
});

describe('planCoursePoints — device budget', () => {
  // Twenty legs, five prompts each: a hundred points before thinning, where an Edge only has room
  // for about 200 including every turn on the route.
  const manyLegs = Array.from({ length: 20 }, (_, i) =>
    fill({ fid: i + 1, from: i * 5, to: (i + 1) * 5 }),
  );

  test('thins a plan that would overrun the device', () => {
    const points = planCoursePoints(input({ fills: manyLegs }));

    expect(points.length).toBeLessThanOrEqual(50);
    expect(points.map((p) => p.km)).toEqual([...points.map((p) => p.km)].sort((a, b) => a - b));
  });

  test('keeps every refill and drops only level checkpoints', () => {
    const points = planCoursePoints(input({ fills: manyLegs }));

    // Nineteen legs start mid-ride, and each of those refills survives.
    expect(points.filter((p) => p.kind === 'refill')).toHaveLength(19);
  });

  test('what survives still spans the whole ride rather than stopping halfway', () => {
    const points = planCoursePoints(input({ fills: manyLegs }));
    const levels = points.filter((p) => p.kind === 'level');

    expect(levels.length).toBeGreaterThan(0);
    expect(levels[levels.length - 1].km).toBeGreaterThan(75);
  });

  test("never drops the rider's own stops, even past the budget", () => {
    const shops = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, at: i + 1, name: `S${i}` }));
    const points = planCoursePoints(input({ shops }));

    expect(points.filter((p) => p.kind === 'stop')).toHaveLength(60);
  });
});

describe('ascii', () => {
  test('folds Polish diacritics, including the one that has no decomposition', () => {
    expect(ascii('Żel gęś łódź ŁÓDŹ')).toBe('Zel ges lodz LODZ');
  });

  test('drops what it cannot fold rather than emitting boxes', () => {
    expect(ascii('café ☕ 42')).toBe('cafe  42');
  });
});

describe('buildTcx', () => {
  const route = makeRoute({ gpxName: 'kielce___marki.gpx' });
  const track = line(50);
  const points = planCoursePoints(
    input({ route, fills: [fill()], shops: [{ id: 1, at: 60, name: 'Sklep' }] }),
  );
  const xml = buildTcx({ points, track, route, name: route.gpxName ?? '' });

  test('writes a course whose elements sit in the order the schema demands', () => {
    const order = ['<Name>', '<Lap>', '<Track>', '</Track>', '<CoursePoint>'];
    const found = order.map((tag) => xml.indexOf(tag));
    expect(found.every((i) => i >= 0)).toBe(true);
    expect([...found].sort((a, b) => a - b)).toEqual(found);
  });

  test('keeps the course name inside the schema limit', () => {
    const name = xml.match(/<Name>([^<]*)<\/Name>/)?.[1] ?? '';
    expect(name).toBe('kielce___marki');
    expect(name.length).toBeLessThanOrEqual(15);
  });

  test('every course point name fits the ten-character banner and is plain ASCII', () => {
    const names = [...xml.matchAll(/<CoursePoint>\s*<Name>([^<]*)<\/Name>/g)].map((m) => m[1]);
    expect(names.length).toBe(points.length);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(10);
      expect(name).toMatch(/^[\x20-\x7E]*$/);
    }
  });

  test('writes one trackpoint per track point, with distance climbing to the total', () => {
    const metres = [...xml.matchAll(/<DistanceMeters>(\d+)<\/DistanceMeters>/g)].map((m) =>
      Number(m[1]),
    );
    // One per trackpoint plus the lap's own total, which is written first.
    expect(metres).toHaveLength(track.length + 1);
    expect(metres[0]).toBe(metres[metres.length - 1]);
    expect(metres.slice(1)).toEqual([...metres.slice(1)].sort((a, b) => a - b));
  });

  test('timestamps rise monotonically, which a head unit needs to pace the course', () => {
    const times = [...xml.matchAll(/<Time>([^<]*)<\/Time>/g)].map((m) => Date.parse(m[1]));
    expect(times.every(Number.isFinite)).toBe(true);
    const trackTimes = times.slice(0, track.length);
    expect(trackTimes).toEqual([...trackTimes].sort((a, b) => a - b));
  });

  test('keeps trackpoint times climbing across a stop the ride recorded', () => {
    // A recorded ride sits at a traffic light: ten points at one position, so one cumulative
    // distance and, from distance alone, one repeated timestamp — which is what a TCX reader
    // chokes on. Sorted order is not enough to catch it; duplicates are sorted.
    const stalled = [...line(20), ...Array(10).fill(line(1)[0]), ...line(20)];
    const out = buildTcx({ points: [], track: stalled, route, name: 'x' });
    const times = [...out.matchAll(/<Time>([^<]*)<\/Time>/g)].map((m) => Date.parse(m[1]));

    expect(times).toHaveLength(stalled.length);
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
  });

  test('places a course point on the track at its share of the ride', () => {
    const positions = [...xml.matchAll(/<CoursePoint>[\s\S]*?<LongitudeDegrees>([\d.]+)</g)].map(
      (m) => Number(m[1]),
    );
    const [west, east] = [track[0].lon, track[track.length - 1].lon];
    for (const lon of positions) {
      expect(lon).toBeGreaterThanOrEqual(west);
      expect(lon).toBeLessThanOrEqual(east);
    }
    // The stop sits at 60 of 100 km, so 60% of the way along a straight line.
    const stop = points.findIndex((p) => p.note.includes('Sklep'));
    expect(positions[stop]).toBeCloseTo(west + (east - west) * 0.6, 3);
  });

  test('escapes what a rider might type into a stop name', () => {
    const withAmp = planCoursePoints(
      input({ route, shops: [{ id: 1, at: 10, name: 'Lidl & Co' }] }),
    );
    const out = buildTcx({ points: withAmp, track, route, name: 'x' });
    expect(out).toContain('<Notes>Lidl &amp; Co</Notes>');
    expect(out).not.toContain('Lidl & Co');
  });

  test('the same plan exports byte-identical, so a re-download is not a new file', () => {
    expect(buildTcx({ points, track, route, name: route.gpxName ?? '' })).toBe(xml);
  });
});

describe('round trip', () => {
  test('the exported course loads back in as the same route', () => {
    const track = line(120, (i) => 100 + Math.sin(i / 8) * 60);
    const source = makeRoute({ gpxName: 'ride.gpx' });
    const xml = buildTcx({ points: [], track, route: source, name: 'ride.gpx' });

    const reparsed = parseGpxXml(xml);

    expect(reparsed.pts).toHaveLength(track.length);
    expect(reparsed.pts[0]).toEqual(track[0]);
    expect(reparsed.pts[track.length - 1]).toEqual(track[track.length - 1]);
    // The distance the file declares and the one recomputed from its own points agree.
    const declared = Number(xml.match(/<DistanceMeters>(\d+)<\/DistanceMeters>/)?.[1]);
    expect(reparsed.distanceKm * 1000).toBeCloseTo(declared, 0);
  });
});

describe('courseFileName', () => {
  test('swaps the extension and marks the file as carrying a plan', () => {
    expect(courseFileName('kielce___marki.gpx')).toBe('kielce___marki-plan.tcx');
    expect(courseFileName(null)).toBe('course-plan.tcx');
  });
});
