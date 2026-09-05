import { describe, expect, test } from 'vitest';
import {
  ascii,
  buildTcx,
  courseFileName,
  courseNotes,
  planCoursePoints,
  type CoursePlanInput,
  type CoursePoint,
} from './courseExport';
import { eff } from './fuel';
import { parseGpxXml } from './gpx';
import {
  DEFAULT_MIX,
  type Fill,
  type FoodItem,
  type GpxPoint,
  type RouteInput,
  type Vessel,
} from './types';

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
    expect(named(points)).toEqual(['B1(I)75%', 'B1(I)50%', 'B1(I)25%', 'B1(I)0%']);
    expect(points.map((p) => Math.round(p.km))).toEqual([25, 50, 75, 100]);
    expect(points.every((p) => p.type === 'Water')).toBe(true);
  });

  test('a leg that starts mid-ride opens with a refill prompt', () => {
    const points = planCoursePoints(input({ fills: [fill({ from: 40, to: 80 })] }));

    expect(named(points)).toEqual(['B1(I)100%', 'B1(I)75%', 'B1(I)50%', 'B1(I)25%', 'B1(I)0%']);
    expect(points[0].kind).toBe('refill');
    expect(points[0].note).toBe('Bidon (Izo) · 100% (napełnij)');
    expect(points[0].km).toBe(40);
  });

  // Reported off a real export: a flask filled with izo produced "Flask · 50%" and PointType Water,
  // and nothing anywhere said what was in it. The enum has no third option — only Water and Food —
  // so the type stays Water and the content is named in the note instead.
  test('names what is in the vessel, which the point type cannot express', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'f', name: 'Flask' })],
        fills: [fill({ gid: 'f', content: 'izo' })],
      }),
    );

    expect(points[1].note).toBe('Flask (Izo) · 50%');
    expect(points[1].type).toBe('Water');
  });

  test('the note carries the readable level and the name carries the terse one', () => {
    const points = planCoursePoints(input({ fills: [fill()] }));

    expect(points[0].note).toBe('Bidon (Izo) · 75%');
    expect(points[3].note).toBe('Bidon (Izo) · 0%');
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

describe('planCoursePoints — one ladder per bottle', () => {
  const gear = [vessel({ gid: 'a' }), vessel({ gid: 'b', vol: 500 })];

  // Two bottles over one leg sit at the same percentage all ride, and used to share a single
  // prompt for exactly that reason. Once the banner started naming the contents they stopped being
  // the same message — "reach for the water" and "reach for the izo" — and a banner can only show
  // one, so both now fire.
  test('two bottles on the same span each get their own prompts', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [fill({ fid: 1, gid: 'a', content: 'water' }), fill({ fid: 2, gid: 'b' })],
      }),
    );

    expect(named(points)).toEqual([
      'B1(W)75%',
      'B2(I)75%',
      'B1(W)50%',
      'B2(I)50%',
      'B1(W)25%',
      'B2(I)25%',
      'B1(W)0%',
      'B2(I)0%',
    ]);
    expect(points[0].note).toBe('Bidon 1 (Woda) · 75%');
    expect(points[1].note).toBe('Bidon 2 (Izo) · 75%');
  });

  // Real spans off the running app: two bottles filled at one stop, ends 135 m apart because the
  // bars were dragged rather than typed. Each ladder is now computed from its own bottle's span, so
  // the near-miss costs nothing at all.
  test('drag noise does not blur one bottle into the other', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [
          fill({ fid: 1, gid: 'a', content: 'water', from: 0, to: 22.824742268041238 }),
          fill({ fid: 2, gid: 'b', from: 0, to: 22.96 }),
        ],
      }),
    );

    const half = points.filter((p) => p.name.endsWith('50%'));
    expect(half.map((p) => p.name)).toEqual(['B1(W)50%', 'B2(I)50%']);
    expect(half[0].km).toBeCloseTo(22.824742268041238 / 2, 6);
    expect(half[1].km).toBeCloseTo(22.96 / 2, 6);
  });

  test('bottles on different spans keep their own prompts', () => {
    const points = planCoursePoints(
      input({
        gear,
        fills: [fill({ fid: 1, gid: 'a', to: 50 }), fill({ fid: 2, gid: 'b', from: 50, to: 100 })],
      }),
    );

    expect(named(points)).toContain('B1(I)25%');
    expect(named(points)).toContain('B2(I)25%');
  });

  test('a third bottle is just a third ladder — nothing has to be abbreviated away', () => {
    const points = planCoursePoints(
      input({
        gear: [...gear, vessel({ gid: 'c' })],
        fills: [fill({ fid: 1, gid: 'a' }), fill({ fid: 2, gid: 'b' }), fill({ fid: 3, gid: 'c' })],
      }),
    );

    expect(points).toHaveLength(12);
    expect(named(points).slice(0, 3)).toEqual(['B1(I)75%', 'B2(I)75%', 'B3(I)75%']);
    expect(named(points).every((n) => n.length <= 10)).toBe(true);
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

    expect(named(points)).toEqual(['B1(Z)1/3', 'B1(Z)2/3', 'B1(Z)3/3']);
    expect(points.map((p) => p.km)).toEqual([0, 45, 90]);
    expect(points.every((p) => p.type === 'Food')).toBe(true);
    // Same shape as a bottle's note: vessel, contents, then where you are in it.
    expect(points[1].note).toBe('Flakon (Żel) · 2/3');
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
      { km: 40, kind: 'gel', name: 'B1(Z)', note: 'Flakon (Żel)', type: 'Food', gid: 'g' },
    ]);
  });

  test('food carries its carbs in the note', () => {
    const points = planCoursePoints(input({ foods: [food()] }));

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ km: 30, name: 'Baton', note: 'Baton · 25 g', type: 'Food' });
  });

  // A stop is a stop on the banner whatever the rider called it: what they want there is which
  // stop this is out of how many, and the name they typed never told them that. It survives in the
  // note. "Stop" stays untranslated because "Postoj(1/4)" is one character over the cap.
  test('a stop says which one it is, not what it was named', () => {
    const points = planCoursePoints(
      input({
        shops: [
          { id: 1, at: 60, name: 'Żabka' },
          { id: 2, at: 20, name: 'Sklep' },
        ],
      }),
    );

    // Counted in ride order, not in the order the markers happened to be dragged in.
    expect(points).toMatchObject([
      { km: 20, name: 'Stop 1/2', note: 'Sklep · 1/2', type: 'Generic' },
      { km: 60, name: 'Stop 2/2', note: 'Żabka · 2/2', type: 'Generic' },
    ]);
  });

  // One shape whatever the count: three stops read like twelve, and the longest a plan can produce
  // still lands inside the ten-character cap.
  test('the stop format does not change as the ride gets more stops', () => {
    const nameAt = (total: number, i: number) =>
      planCoursePoints(
        input({
          shops: Array.from({ length: total }, (_, n) => ({ id: n, at: n + 1, name: 'S' })),
        }),
      )[i].name;

    expect(nameAt(3, 0)).toBe('Stop 1/3');
    expect(nameAt(12, 0)).toBe('Stop 1/12');
    expect(nameAt(12, 11)).toBe('Stop 12/12');
    expect(nameAt(99, 98)).toBe('Stop 99/99');
    expect('Stop 99/99'.length).toBeLessThanOrEqual(10);
  });
});

describe('planCoursePoints — merging', () => {
  // The only merge left: one bottle emptied and refilled at the same stop is one instruction.
  test('a bottle running dry where it is refilled becomes one prompt', () => {
    const points = planCoursePoints(
      input({
        fills: [fill({ fid: 1, to: 50 }), fill({ fid: 2, from: 50, to: 100 })],
      }),
    );

    const atFifty = points.filter((p) => Math.abs(p.km - 50) < 0.5);
    expect(atFifty).toHaveLength(1);
    // The refill outranks the empty mark, so that is what the device shows.
    expect(atFifty[0].name).toBe('B1(I)100%');
    expect(atFifty[0].note).toBe('Bidon (Izo) · 100% (napełnij) | Bidon (Izo) · 0%');
  });

  test('one bottle running dry as a different one is filled stays two prompts', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'a' }), vessel({ gid: 'b' })],
        fills: [fill({ fid: 1, gid: 'a', to: 50 }), fill({ fid: 2, gid: 'b', from: 50, to: 100 })],
      }),
    );

    const atFifty = points.filter((p) => Math.abs(p.km - 50) < 0.5);
    expect(atFifty.map((p) => p.name).sort()).toEqual(['B1(I)0%', 'B2(I)100%']);
  });

  test('a refill at a stop fires as both, since each says something the other does not', () => {
    const points = planCoursePoints(
      input({
        fills: [fill({ from: 60, to: 100 })],
        shops: [{ id: 1, at: 60, name: 'Sklep' }],
      }),
    );

    const atSixty = points.filter((p) => Math.abs(p.km - 60) < 0.5);
    expect(atSixty.map((p) => p.name).sort()).toEqual(['B1(I)100%', 'Stop 1/1']);
  });

  // Two bottles on genuinely different legs whose checkpoints collide at km 30: one a quarter left,
  // the other a half. Nothing collapses them any more, so each keeps its own banner.
  test('two bottles at different levels in the same place stay two prompts', () => {
    const points = planCoursePoints(
      input({
        gear: [vessel({ gid: 'a' }), vessel({ gid: 'b' })],
        fills: [
          fill({ fid: 1, gid: 'a', content: 'water', to: 40 }),
          fill({ fid: 2, gid: 'b', to: 60 }),
        ],
      }),
    );

    const collision = points.filter((p) => p.km === 30);
    expect(collision.map((p) => p.name)).toEqual(['B1(W)25%', 'B2(I)50%']);
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
    expect(out).toContain('<Notes>Lidl &amp; Co · 1/1</Notes>');
    expect(out).not.toContain('Lidl & Co');
  });

  test('the same plan exports byte-identical, so a re-download is not a new file', () => {
    expect(buildTcx({ points, track, route, name: route.gpxName ?? '' })).toBe(xml);
  });
});

describe('courseNotes', () => {
  const state = {
    route: makeRoute(),
    mix: DEFAULT_MIX,
    gear: [vessel()],
    fills: [fill()],
    foods: [food()],
    foodLib: [],
  };

  test('summarises the plan in the rider language', () => {
    const notes = courseNotes(state, [{ id: 1, at: 50, name: 'Sklep' }], 'pl');
    const rows = notes.split('\n');

    expect(rows[0]).toBe('Carb Fueling · 100 km · 4:00');
    expect(rows[1]).toMatch(/^Węglowodany: \d+ g \(\d+ g\/h\)$/);
    expect(rows[2]).toMatch(/^Płyny: \d+ ml \(\d+ ml\/h\)$/);
    expect(rows[3]).toBe('Postoje: 1');
  });

  test('speaks English too, reusing the labels the rest of the app uses', () => {
    const rows = courseNotes(state, [], 'en').split('\n');

    expect(rows[1]).toMatch(/^Carbs: /);
    expect(rows[2]).toMatch(/^Fluids: /);
    expect(rows[3]).toBe('Stops: 0');
  });

  test('rides into the file between the track and the course points', () => {
    const notes = courseNotes(state, [], 'pl');
    const xml = buildTcx({ points: [], track: line(20), route: makeRoute(), name: 'x', notes });

    expect(xml.indexOf('</Track>')).toBeLessThan(xml.indexOf('<Notes>'));
    expect(xml).toContain('<Notes>Carb Fueling · 100 km · 4:00\n');
  });

  test('is left out entirely when there is nothing to say', () => {
    expect(buildTcx({ points: [], track: line(20), route: makeRoute(), name: 'x' })).not.toContain(
      '<Notes>',
    );
  });
});

describe('buildTcx — author', () => {
  const withAuthor = buildTcx({
    points: [],
    track: line(20),
    route: makeRoute(),
    name: 'x',
    version: '1.14.0',
    lang: 'pl',
  });

  test('names this app, and does not borrow Garmin Connect identity', () => {
    expect(withAuthor).toContain('<Author xsi:type="Application_t">');
    expect(withAuthor).toContain('<Name>Carb Fueling</Name>');
    // The part number namespace is Garmin's to assign; 006-D2449-00 is Connect's own.
    expect(withAuthor).not.toContain('Connect Api');
    expect(withAuthor).not.toContain('006-D2449-00');
  });

  test('splits the app version across the schema fields', () => {
    expect(withAuthor).toContain('<VersionMajor>1</VersionMajor>');
    expect(withAuthor).toContain('<VersionMinor>14</VersionMinor>');
    expect(withAuthor).toContain('<BuildMajor>0</BuildMajor>');
  });

  test('carries the two-letter language the schema asks for, and a well-formed part number', () => {
    expect(withAuthor).toContain('<LangID>pl</LangID>');
    expect(withAuthor.match(/<PartNumber>([^<]*)</)?.[1]).toMatch(
      /^[A-Z0-9]{3}-[A-Z0-9]{5}-[A-Z0-9]{2}$/,
    );
  });

  test('sits after the courses, where the root sequence puts it', () => {
    expect(withAuthor.indexOf('</Courses>')).toBeLessThan(withAuthor.indexOf('<Author'));
    expect(withAuthor.indexOf('<Author')).toBeLessThan(
      withAuthor.indexOf('</TrainingCenterDatabase>'),
    );
  });

  test('is left out when no version is supplied', () => {
    expect(buildTcx({ points: [], track: line(20), route: makeRoute(), name: 'x' })).not.toContain(
      '<Author',
    );
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
