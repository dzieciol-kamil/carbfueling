// Writes the fueling plan as a Garmin course file: the rider's own track, plus a course point at
// every moment the plan says to drink, eat or stop. The point of the exercise is the head unit —
// the rider should get the plan as on-screen prompts while riding, not have to remember a strip of
// paper.
//
// Why TCX and not GPX-with-waypoints, which is what issue #36 originally asked for: a GPX `<wpt>`
// is a point of interest, not part of a course. Garmin Connect drops waypoints when it turns an
// uploaded GPX into a course, so they never reach the device's navigation, and nothing fires while
// riding. TCX is the cheapest format that carries real course points — `<CoursePoint>` with a
// `Water` or `Food` type is exactly the "drink now" / "eat now" prompt this plan is made of, and
// it is still XML, so no binary FIT encoder. FIT would be the fully native answer and remains the
// upgrade path if a device turns out to want it.
//
// TCX schema constraints that shape the code below (TrainingCenterDatabase v2):
//   - `CoursePoint/Name` is capped at 10 characters, which is why every point carries a terse
//     ASCII `name` for the device banner and a full `note` for `<Notes>`.
//   - `Course/Name` is capped at 15.
//   - Element order is fixed, and `CoursePoint` comes after `Track`.
//   - Every `Trackpoint` needs a `<Time>`, so the file is stamped with a synthetic ride starting at
//     `COURSE_EPOCH`, paced by the plan's own time model.

import { dist, distanceAtEff, eff, partArray, partsOf, timeAtDistance } from './fuel';
import { cumulativeKm } from './gpx';
import { foodName, vesselLabels } from './printSheet';
import type { Fill, FoodItem, FoodLibEntry, GpxPoint, RouteInput, ShopStop, Vessel } from './types';
import { t, type Lang } from '../i18n/strings';

/**
 * How full the bottle should be at each checkpoint between a refill and running dry. Quarters, not
 * tenths: the rider reads this by looking at a bottle at 30 km/h, where a quarter is the finest
 * distinction worth making, and tenths would put nine prompts on every leg of every bottle.
 */
const LEVELS = [0.75, 0.5, 0.25];

/**
 * Points closer together than this collapse into one. Two bottles refilled at the same stop, a
 * bottle running dry exactly where the next one is filled, a gel taken at a shop — all of these
 * land on the same kilometre, and firing three prompts in a row there trains the rider to ignore
 * them.
 */
const MERGE_TOLERANCE_KM = 0.4;

/**
 * Ceiling on how many prompts the file carries. Garmin's limit counts every turn it generates for
 * the route as well as the points we write — an Edge holds about 200 in total, most watches 50 —
 * and a device that goes over drops points on its own, "keeping the most critical ones" by its
 * rules, not ours. Budgeting 50 here leaves an Edge room for 150 turns and keeps the choice of
 * what to lose in the one place that knows which prompts matter.
 * See https://support.garmin.com/en-US/?faq=aisqGZTLwH5LvbExSdO6L6.
 */
const MAX_COURSE_POINTS = 50;

/** `CoursePoint/Name` in the TCX schema. */
const NAME_MAX = 10;
/** `Course/Name` in the TCX schema. */
const COURSE_NAME_MAX = 15;

/**
 * A course file describes a ride that hasn't happened, but every trackpoint still needs a
 * timestamp. Any fixed instant does; this one is arbitrary and deliberately constant so the same
 * plan always exports byte-identical.
 */
const COURSE_EPOCH = Date.UTC(2020, 0, 1, 6, 0, 0);

export type TcxPointType = 'Water' | 'Food' | 'Generic';

/**
 * Ordered by how much the rider needs to see it when several points collapse into one: the prompt
 * that says *stop and pour* outranks the one that says *you should be on schedule*.
 */
export type PointKind = 'refill' | 'stop' | 'gel' | 'food' | 'level' | 'empty';

const KIND_PRIORITY: Record<PointKind, number> = {
  refill: 0,
  stop: 1,
  gel: 2,
  food: 3,
  level: 4,
  empty: 5,
};

export interface CoursePoint {
  km: number;
  kind: PointKind;
  /** What the head unit shows on the alert: ASCII, at most `NAME_MAX` characters. */
  name: string;
  /** The readable version, in the rider's language, written to `<Notes>`. */
  note: string;
  type: TcxPointType;
}

export interface CoursePlanInput {
  route: RouteInput;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
  shops: ShopStop[];
  lang: Lang;
}

/**
 * Folds to plain ASCII: head units render their own limited character set, and a `ż` that comes
 * out as a box costs more than the accent is worth on a 10-character banner. NFD splits an accented
 * letter into a plain one plus a combining mark, which the ASCII filter below then drops; `ł` has
 * no decomposition, so it is mapped by hand or it would vanish along with its word's meaning.
 */
export function ascii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

const shortName = (s: string) => ascii(s).slice(0, NAME_MAX).trim() || '?';

/**
 * Fills that drain as one. A fill empties linearly in effort over its own span, and nothing else
 * about it enters that calculation — not its content, not the bottle's size. So two bottles
 * covering the same span sit at the same percentage for the whole ride, whatever is in them, and
 * a prompt for the second one would repeat the first word for word.
 */
function groupBySpan(fills: Fill[]): Fill[][] {
  const groups: Fill[][] = [];
  for (const f of [...fills].sort((a, b) => a.from - b.from || a.to - b.to)) {
    // Near-equal, not equal: real spans come out of dragging a bar or out of autoplan, so two
    // bottles filled at the same stop and drained over the same leg land on 22.82 and 22.96 rather
    // than on one number. Anything inside the merge tolerance would have collapsed into a single
    // prompt further down anyway, so it belongs in one group here — at the cost of the group's
    // percentage being read off the first fill's span, which on a very short leg is a nudge off
    // for the others.
    const open = groups.find(
      (g) =>
        Math.abs(g[0].from - f.from) <= MERGE_TOLERANCE_KM &&
        Math.abs(g[0].to - f.to) <= MERGE_TOLERANCE_KM,
    );
    if (open) open.push(f);
    else groups.push([f]);
  }
  return groups;
}

export function planCoursePoints({
  route,
  gear,
  fills,
  foods,
  foodLib,
  shops,
  lang,
}: CoursePlanInput): CoursePoint[] {
  const strings = t(lang);
  const labels = vesselLabels(gear);
  // A slot number rather than an initial: two bottles the rider named "Bidon" and "Bukłak" would
  // both shorten to "B", and the readable name is in the note anyway.
  const codes = new Map(gear.map((v, i) => [v.gid, `B${i + 1}`]));
  const out: CoursePoint[] = [];

  for (const group of groupBySpan(fills.filter((f) => partsOf(f, gear) === 1 && f.to > f.from))) {
    const { from, to } = group[0];
    const joined = group.map((f) => codes.get(f.gid) ?? '?').join('+');
    // Three or more bottles on one span blow the 10-character banner, so they lose their numbers;
    // the note still lists every one of them by name.
    const code = joined.length <= 5 ? joined : 'B*';
    const named = group.map((f) => labels.get(f.gid) ?? '?').join(', ');
    const at = (level: number) => ({
      km:
        level === 1 ? from : level === 0 ? to : distanceAtEff(route, effAt(route, from, to, level)),
      name: `${code} ${Math.round(level * 100)}%`,
      type: 'Water' as const,
    });

    // Skipped at the start line, where "fill your bottles" is not news.
    if (from > 0) {
      out.push({ ...at(1), kind: 'refill', note: `${named} · 100% (${strings.courseRefill})` });
    }
    for (const level of LEVELS) {
      out.push({ ...at(level), kind: 'level', note: `${named} · ${Math.round(level * 100)}%` });
    }
    out.push({ ...at(0), kind: 'empty', note: `${named} · 0%` });
  }

  // A gel flask is a run of discrete doses at positions the rider can drag, not something sipped —
  // so it gets one prompt per dose instead of a percentage ladder.
  for (const f of fills) {
    const n = partsOf(f, gear);
    if (n <= 1) continue;
    const named = labels.get(f.gid) ?? '?';
    partArray(f, gear).forEach((km, k) => {
      out.push({
        km,
        kind: 'gel',
        name: shortName(`${strings.gel} ${k + 1}/${n}`),
        note: `${strings.gel} ${k + 1}/${n} · ${named}`,
        type: 'Food',
      });
    });
  }

  for (const f of foods) {
    const named = foodName(f, foodLib, lang);
    out.push({
      km: f.from,
      kind: 'food',
      name: shortName(named),
      note: `${named} · ${f.carbs} g`,
      type: 'Food',
    });
  }

  for (const s of shops) {
    out.push({ km: s.at, kind: 'stop', name: shortName(s.name), note: s.name, type: 'Generic' });
  }

  return fitBudget(mergeNearby(out.filter((p) => p.km >= 0 && p.km <= dist(route))));
}

/**
 * Sheds prompts until the file fits `MAX_COURSE_POINTS`. Level checkpoints go first, and thinned
 * evenly rather than truncated, so what survives still covers the whole ride instead of stopping
 * dead halfway. Points the rider put there themselves — stops, food — are never dropped: if there
 * are more of those than the budget, the file goes out over it and the device decides, which is no
 * worse than this code silently deleting the rider's own plan.
 */
function fitBudget(points: CoursePoint[]): CoursePoint[] {
  if (points.length <= MAX_COURSE_POINTS) return points;
  const optional = (p: CoursePoint) => p.kind === 'level' || p.kind === 'empty';
  const keep = points.filter((p) => !optional(p));
  const shed = points.filter(optional);
  const room = Math.max(0, MAX_COURSE_POINTS - keep.length);
  const step = shed.length / room;
  const thinned = Array.from({ length: room }, (_, i) => shed[Math.floor(i * step)]);
  return [...keep, ...thinned].sort((a, b) => a.km - b.km);
}

/** Effort at the point where `level` of the fill is still in the bottle. */
function effAt(route: RouteInput, from: number, to: number, level: number): number {
  const a = eff(route, from);
  return a + (1 - level) * (eff(route, to) - a);
}

function mergeNearby(points: CoursePoint[]): CoursePoint[] {
  const clusters: CoursePoint[][] = [];
  for (const p of [...points].sort((a, b) => a.km - b.km)) {
    const open = clusters[clusters.length - 1];
    // Measured against the cluster's first point, not its last, so a dense run of prompts can't
    // chain into one cluster spanning kilometres.
    if (open && p.km - open[0].km <= MERGE_TOLERANCE_KM) open.push(p);
    else clusters.push([p]);
  }

  return clusters.map((cluster) => {
    const lead = cluster.reduce((a, b) => (KIND_PRIORITY[b.kind] < KIND_PRIORITY[a.kind] ? b : a));
    const rest = cluster.filter((p) => p !== lead);
    const notes = [lead.note, ...rest.map((p) => p.note)].filter(
      (n, i, all) => all.indexOf(n) === i,
    );
    return { ...lead, km: cluster[0].km, note: notes.join(' · ') };
  });
}

export interface TcxInput {
  points: CoursePoint[];
  track: GpxPoint[];
  route: RouteInput;
  /** Course name, usually the GPX file's name; folded and truncated to what the schema allows. */
  name: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stamp = (hours: number) => new Date(COURSE_EPOCH + hours * 3600_000).toISOString();

/** The file's name without its extension — `.gpx` is about the file, not about the ride. */
const baseName = (name: string | null) => (name ?? '').replace(/\.[^.]*$/, '');

const coord = (p: GpxPoint) =>
  `<LatitudeDegrees>${p.lat}</LatitudeDegrees><LongitudeDegrees>${p.lon}</LongitudeDegrees>`;

/**
 * Interpolates the track position at a plan kilometre. The plan's distance domain is the rider's
 * `route.distance`, which is the GPX length rounded — and free to be edited afterwards — so the
 * two are matched proportionally rather than compared directly.
 */
function positionAt(track: GpxPoint[], cum: number[], frac: number): GpxPoint {
  const target = Math.max(0, Math.min(1, frac)) * cum[cum.length - 1];
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const span = cum[i] - cum[i - 1];
  const k = span > 0 ? (target - cum[i - 1]) / span : 0;
  const a = track[i - 1];
  const b = track[i];
  return {
    lat: a.lat + (b.lat - a.lat) * k,
    lon: a.lon + (b.lon - a.lon) * k,
    ele: a.ele + (b.ele - a.ele) * k,
  };
}

export function buildTcx({ points, track, route, name }: TcxInput): string {
  const cum = cumulativeKm(track);
  const totalKm = cum[cum.length - 1];
  const planKm = dist(route);
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
      ' xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2' +
      ' http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">',
  );
  lines.push('<Courses><Course>');
  lines.push(
    `<Name>${esc(ascii(baseName(name)).slice(0, COURSE_NAME_MAX).trim() || 'Course')}</Name>`,
  );

  lines.push('<Lap>');
  lines.push(
    `<TotalTimeSeconds>${Math.round(timeAtDistance(route, planKm) * 3600)}</TotalTimeSeconds>`,
  );
  lines.push(`<DistanceMeters>${Math.round(totalKm * 1000)}</DistanceMeters>`);
  lines.push(`<BeginPosition>${coord(track[0])}</BeginPosition>`);
  lines.push(`<EndPosition>${coord(track[track.length - 1])}</EndPosition>`);
  lines.push('<Intensity>Active</Intensity>');
  lines.push('</Lap>');

  lines.push('<Track>');
  track.forEach((p, i) => {
    const hours = timeAtDistance(route, totalKm > 0 ? (cum[i] / totalKm) * planKm : 0);
    lines.push(
      `<Trackpoint><Time>${stamp(hours)}</Time><Position>${coord(p)}</Position>` +
        `<AltitudeMeters>${p.ele}</AltitudeMeters>` +
        `<DistanceMeters>${Math.round(cum[i] * 1000)}</DistanceMeters></Trackpoint>`,
    );
  });
  lines.push('</Track>');

  for (const point of points) {
    const p = positionAt(track, cum, planKm > 0 ? point.km / planKm : 0);
    lines.push('<CoursePoint>');
    lines.push(`<Name>${esc(point.name.slice(0, NAME_MAX))}</Name>`);
    lines.push(`<Time>${stamp(timeAtDistance(route, point.km))}</Time>`);
    lines.push(`<Position>${coord({ ...p, lat: round5(p.lat), lon: round5(p.lon) })}</Position>`);
    lines.push(`<PointType>${point.type}</PointType>`);
    lines.push(`<Notes>${esc(point.note)}</Notes>`);
    lines.push('</CoursePoint>');
  }

  lines.push('</Course></Courses>');
  lines.push('</TrainingCenterDatabase>');
  return lines.join('\n');
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/** `kielce___marki.gpx` → `kielce___marki-plan.tcx`. */
export function courseFileName(gpxName: string | null): string {
  return `${baseName(gpxName) || 'course'}-plan.tcx`;
}
