import type { SettingsExportData } from './settingsExport';
import type {
  CitricSource,
  Content,
  Fill,
  FoodItem,
  Intensity,
  MixSettings,
  Mode,
  RatioPreset,
  RouteInput,
  ShopStop,
  Sport,
  Vessel,
} from './types';

// Pure encode/decode for the "share this plan as a link" feature. Deliberately a
// different wire format from settingsExport.ts: that one is a readable JSON backup
// file with room to spare, this one has to survive being pasted into a chat message,
// so it is a positional array with enums as small integers and no key names at all.
// Framework-free per repo convention — SharePanel.tsx and SharedPlanPrompt.tsx wire it
// to the address bar. See docs/superpowers/specs/2026-09-14-share-plan-link-design.md.

export const SHARE_SCHEMA_VERSION = 1;

/** Query param the encoded plan travels in, on the calculator's own URL. */
export const SHARE_PARAM = 'p';

// A shared link is untrusted input from the address bar, so every list is bounded
// before anything renders it — same reasoning as MAX_IMPORT_ARRAY_LENGTH in
// settingsExport.ts, with a tighter bound because a URL cannot legitimately be long.
const MAX_SHARED_ARRAY_LENGTH = 200;

const SPORTS: Sport[] = ['cycling', 'running'];
const MODES: Mode[] = ['route', 'time'];
const INTENSITIES: Intensity[] = ['low', 'mid', 'high'];
const CONTENTS: Content[] = ['water', 'izo', 'gel'];
const RATIO_PRESETS: RatioPreset[] = ['iso', 'sugar', 'honey', 'ratio15', 'custom'];
const CITRIC_SOURCES: CitricSource[] = ['citric', 'lemon', 'lemonJuice', 'lime', 'limeJuice'];

/** Everything about the route that travels in a link — the macro parameters only.
 *  The elevation array is unbounded, so a GPX route degrades to these. */
export type SharedRoute = Pick<
  RouteInput,
  | 'sport'
  | 'mode'
  | 'distance'
  | 'speed'
  | 'hours'
  | 'minutes'
  | 'preMealCarbs'
  | 'preMealMinutes'
  | 'intensity'
  | 'temp'
>;

export interface SharedPlan {
  route: SharedRoute;
  /** null when the sender did not tick "share my weight" — see spec §4. */
  weight: number | null;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  shops: ShopStop[];
}

export function buildSharedPlan(data: SettingsExportData, includeWeight: boolean): SharedPlan {
  const r = data.route;
  return {
    route: {
      sport: r.sport,
      mode: r.mode,
      distance: r.distance,
      speed: r.speed,
      hours: r.hours,
      minutes: r.minutes,
      preMealCarbs: r.preMealCarbs,
      preMealMinutes: r.preMealMinutes,
      intensity: r.intensity,
      temp: r.temp,
    },
    weight: includeWeight ? r.weight : null,
    mix: data.mix,
    gear: data.gear,
    fills: data.fills,
    foods: data.foods,
    shops: data.shops,
  };
}

// Rounding keeps float noise (12.300000000000001) out of a string the user has to paste.
// 2dp on positions is half a metre at these distances; 3dp on the mix is below what the
// UI lets anyone type.
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
function r3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function encodeSharedPlan(plan: SharedPlan): string {
  const { route: rt, mix: m } = plan;
  const payload = [
    SHARE_SCHEMA_VERSION,
    [
      SPORTS.indexOf(rt.sport),
      MODES.indexOf(rt.mode),
      r2(rt.distance),
      r2(rt.speed),
      rt.hours,
      rt.minutes,
      rt.preMealCarbs,
      rt.preMealMinutes,
      INTENSITIES.indexOf(rt.intensity),
      r2(rt.temp),
    ],
    [
      r3(m.conc),
      r3(m.gelConc),
      r3(m.ratio),
      r3(m.gelRatio),
      RATIO_PRESETS.indexOf(m.ratioPreset),
      RATIO_PRESETS.indexOf(m.gelRatioPreset),
      r3(m.salt),
      r3(m.citric),
      r3(m.gelSalt),
      r3(m.gelCitric),
      CITRIC_SOURCES.indexOf(m.citricSource),
      CITRIC_SOURCES.indexOf(m.gelCitricSource),
    ],
    plan.gear.map((v) => [
      v.gid,
      v.name,
      r2(v.vol),
      v.allowed.map((c) => CONTENTS.indexOf(c)),
      v.gelParts,
    ]),
    plan.fills.map((f) => [
      f.fid,
      f.gid,
      CONTENTS.indexOf(f.content),
      r2(f.from),
      r2(f.to),
      f.pos ? f.pos.map(r2) : 0,
    ]),
    plan.foods.map((f) => [
      f.id,
      f.key,
      f.name,
      r2(f.carbs),
      f.ml ?? 0,
      f.cont ? 1 : 0,
      r2(f.from),
      r2(f.to),
    ]),
    plan.shops.map((s) => [s.id, r2(s.at), s.name]),
    plan.weight === null ? 0 : r2(plan.weight),
  ];
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeSharedPlan(param: string): SharedPlan | null {
  const bytes = fromBase64Url(param);
  if (!bytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 8) return null;
  if (parsed[0] !== SHARE_SCHEMA_VERSION) return null;

  const route = decodeRoute(parsed[1]);
  const mix = decodeMix(parsed[2]);
  const gear = decodeList(parsed[3], decodeVessel);
  const fills = decodeList(parsed[4], decodeFill);
  const foods = decodeList(parsed[5], decodeFood);
  const shops = decodeList(parsed[6], decodeShop);
  const weightRaw = parsed[7];
  if (!route || !mix || !gear || !fills || !foods || !shops) return null;
  if (!num(weightRaw)) return null;
  if (weightRaw !== 0 && !inRange(weightRaw, 20, 300)) return null;

  return { route, weight: weightRaw === 0 ? null : weightRaw, mix, gear, fills, foods, shops };
}

/** Merges a decoded link into the recipient's own settings: their food library, their UI
 *  preferences and — when the link carries no weight — their body weight all stay put, and
 *  the id counters are lifted above every incoming id so the next bottle/food/stop the
 *  recipient adds cannot collide with one that arrived in the link. */
export function sharedPlanToSettingsData(
  plan: SharedPlan,
  base: SettingsExportData,
): SettingsExportData {
  return {
    route: {
      ...plan.route,
      weight: plan.weight ?? base.route.weight,
      // A link carries no elevation, so leaving the recipient's own track in place would
      // draw someone else's hills under this plan's distance.
      useGpx: false,
      gpxTrack: null,
      gpxName: null,
      gpxError: null,
    },
    mix: plan.mix,
    gear: plan.gear,
    fills: plan.fills,
    foods: plan.foods,
    shops: plan.shops,
    foodLib: base.foodLib,
    ui: base.ui,
    nextGid: liftCounter(base.nextGid, plan.gear.map(gidNumber)),
    nextFid: liftCounter(
      base.nextFid,
      plan.fills.map((f) => f.fid),
    ),
    nextFoodId: liftCounter(
      base.nextFoodId,
      plan.foods.map((f) => f.id),
    ),
    nextFoodKey: base.nextFoodKey,
    nextShopId: liftCounter(
      base.nextShopId,
      plan.shops.map((s) => s.id),
    ),
  };
}

function liftCounter(current: number, ids: number[]): number {
  return ids.reduce((acc, id) => (Number.isFinite(id) ? Math.max(acc, id + 1) : acc), current);
}

/** `'g12'` -> 12, so nextGid can clear the highest imported vessel. Anything else -> NaN,
 *  which liftCounter ignores. */
function gidNumber(v: Vessel): number {
  const m = /^g(\d+)$/.exec(v.gid);
  return m ? Number(m[1]) : NaN;
}

// --- validation helpers -------------------------------------------------------

function num(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function inRange(v: unknown, min: number, max: number): boolean {
  return num(v) && v >= min && v <= max;
}
function str(v: unknown, maxLen = 60): v is string {
  return typeof v === 'string' && v.length <= maxLen;
}
function enumAt<T>(v: unknown, table: T[]): T | null {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) < table.length
    ? table[v as number]
    : null;
}

function decodeList<T>(v: unknown, decode: (row: unknown) => T | null): T[] | null {
  if (!Array.isArray(v) || v.length > MAX_SHARED_ARRAY_LENGTH) return null;
  const out: T[] = [];
  for (const row of v) {
    const item = decode(row);
    if (item === null) return null;
    out.push(item);
  }
  return out;
}

function decodeRoute(v: unknown): SharedRoute | null {
  if (!Array.isArray(v) || v.length !== 10) return null;
  const sport = enumAt(v[0], SPORTS);
  const mode = enumAt(v[1], MODES);
  const intensity = enumAt(v[8], INTENSITIES);
  if (!sport || !mode || !intensity) return null;
  if (
    !inRange(v[2], 0, 2000) ||
    !inRange(v[3], 0, 100) ||
    !inRange(v[4], 0, 999) ||
    !inRange(v[5], 0, 1440) ||
    !inRange(v[6], 0, 500) ||
    !inRange(v[7], 0, 1440) ||
    !inRange(v[9], -50, 60)
  ) {
    return null;
  }
  return {
    sport,
    mode,
    distance: v[2],
    speed: v[3],
    hours: v[4],
    minutes: v[5],
    preMealCarbs: v[6],
    preMealMinutes: v[7],
    intensity,
    temp: v[9],
  };
}

function decodeMix(v: unknown): MixSettings | null {
  if (!Array.isArray(v) || v.length !== 12) return null;
  const ratioPreset = enumAt(v[4], RATIO_PRESETS);
  const gelRatioPreset = enumAt(v[5], RATIO_PRESETS);
  const citricSource = enumAt(v[10], CITRIC_SOURCES);
  const gelCitricSource = enumAt(v[11], CITRIC_SOURCES);
  if (!ratioPreset || !gelRatioPreset || !citricSource || !gelCitricSource) return null;
  if (
    !inRange(v[0], 0, 100) ||
    !inRange(v[1], 0, 100) ||
    !inRange(v[2], 0, 20) ||
    !inRange(v[3], 0, 20) ||
    !inRange(v[6], 0, 20) ||
    !inRange(v[7], 0, 20) ||
    !inRange(v[8], 0, 20) ||
    !inRange(v[9], 0, 20)
  ) {
    return null;
  }
  return {
    conc: v[0],
    gelConc: v[1],
    ratio: v[2],
    gelRatio: v[3],
    ratioPreset,
    gelRatioPreset,
    salt: v[6],
    citric: v[7],
    gelSalt: v[8],
    gelCitric: v[9],
    citricSource,
    gelCitricSource,
  };
}

function decodeVessel(v: unknown): Vessel | null {
  if (!Array.isArray(v) || v.length !== 5) return null;
  if (!str(v[0], 20) || !str(v[1]) || !inRange(v[2], 0, 10000) || !inRange(v[4], 0, 50))
    return null;
  if (!Array.isArray(v[3]) || v[3].length > CONTENTS.length) return null;
  const allowed: Content[] = [];
  for (const c of v[3]) {
    const content = enumAt(c, CONTENTS);
    if (!content) return null;
    allowed.push(content);
  }
  return { gid: v[0], name: v[1], vol: v[2], allowed, gelParts: v[4] };
}

function decodeFill(v: unknown): Fill | null {
  if (!Array.isArray(v) || v.length !== 6) return null;
  const content = enumAt(v[2], CONTENTS);
  if (!content) return null;
  if (!num(v[0]) || !str(v[1], 20) || !inRange(v[3], 0, 2000) || !inRange(v[4], 0, 2000)) {
    return null;
  }
  const fill: Fill = { fid: v[0], gid: v[1], content, from: v[3], to: v[4] };
  if (v[5] !== 0) {
    if (!Array.isArray(v[5]) || v[5].length > MAX_SHARED_ARRAY_LENGTH) return null;
    if (!v[5].every((p) => inRange(p, 0, 2000))) return null;
    fill.pos = v[5] as number[];
  }
  return fill;
}

function decodeFood(v: unknown): FoodItem | null {
  if (!Array.isArray(v) || v.length !== 8) return null;
  if (
    !num(v[0]) ||
    !str(v[1], 40) ||
    !str(v[2]) ||
    !inRange(v[3], 0, 1000) ||
    !inRange(v[4], 0, 5000) ||
    (v[5] !== 0 && v[5] !== 1) ||
    !inRange(v[6], 0, 2000) ||
    !inRange(v[7], 0, 2000)
  ) {
    return null;
  }
  const food: FoodItem = { id: v[0], key: v[1], name: v[2], carbs: v[3], from: v[6], to: v[7] };
  if (v[4] !== 0) food.ml = v[4];
  if (v[5] === 1) food.cont = true;
  return food;
}

function decodeShop(v: unknown): ShopStop | null {
  if (!Array.isArray(v) || v.length !== 3) return null;
  if (!num(v[0]) || !inRange(v[1], 0, 2000) || !str(v[2])) return null;
  return { id: v[0], at: v[1], name: v[2] };
}

// --- base64url ----------------------------------------------------------------
// btoa/atob and TextEncoder/TextDecoder are globals in browsers and in Node >= 18,
// which is what keeps this file usable from vitest's `environment: 'node'`.

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array | null {
  if (!s || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}
