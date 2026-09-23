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

// --- container format -----------------------------------------------------------
// The wire format is one leading marker byte, then either a deflate-raw-compressed or a raw
// JSON blob, all base64url-encoded together. The marker has to live *outside* the JSON (as a
// byte in front of it, not a field inside it) because its whole job is telling the decoder
// which decompressor to run before there is any JSON to read — SHARE_SCHEMA_VERSION, by
// contrast, is a field inside the JSON and versions the *shape* of a decoded plan, not the
// container it arrived in. Two different version numbers for two different things: this one
// lets the outer container format change again later (a different algorithm, say) without the
// decoder having to guess at the bytes, independent of any given browser's capabilities.
//
// CompressionStream/DecompressionStream('deflate-raw') are stream-based Web APIs, native in
// Chrome 80+, Safari 16.4+, Firefox 113+ and Node 18+ — no polyfill, no dependency, always
// used when encoding (no size threshold below which we skip it). The raw marker is decode's
// only other branch, kept as a cheap safety net rather than an old-browser compatibility
// path — browsers without CompressionStream are old enough now to not be a design concern.
// decodeSharedPlan still honours both markers unconditionally.
//
// Exported (rather than kept private) so the test file can build payloads under either marker
// directly, instead of reimplementing this encoder to test the decoder's branches.
export const SHARE_CONTAINER_RAW = 0;
export const SHARE_CONTAINER_DEFLATE = 1;

// A shared link is untrusted input from the address bar, so every list is bounded
// before anything renders it — same reasoning as MAX_IMPORT_ARRAY_LENGTH in
// settingsExport.ts, with a tighter bound because a URL cannot legitimately be long.
const MAX_SHARED_ARRAY_LENGTH = 200;

interface Limit {
  readonly min: number;
  readonly max: number;
}

/** Every numeric bound the decoder enforces, defined once so the encode side can clamp to
 *  exactly the same numbers and the two can never drift apart.
 *
 *  Why that matters: decodeSharedPlan rejects the *whole* payload over one out-of-range
 *  field, and SharedPlanPrompt.tsx ignores a failed decode without a word (spec §5.1). So
 *  any value buildSharedPlan can emit but decodeSharedPlan would refuse turns a perfectly
 *  legal local plan into a dead link — and nothing tells the sender. A bottle name has no
 *  maxLength in GearPanel/MobileGear, and settingsExport.ts only checks that temp is finite,
 *  so both are reachable. buildSharedPlan therefore truncates and clamps into these bounds:
 *  a link that degrades (the 200-character bottle name arrives cut to 60) is far better than
 *  a link that silently does nothing. */
const LIMITS = {
  km: { min: 0, max: 2000 },
  speed: { min: 0, max: 100 },
  hours: { min: 0, max: 999 },
  minutes: { min: 0, max: 1440 },
  preMealCarbs: { min: 0, max: 500 },
  preMealMinutes: { min: 0, max: 1440 },
  temp: { min: -50, max: 60 },
  weight: { min: 20, max: 300 },
  conc: { min: 0, max: 100 },
  /** Grams per 100 ml for salt/citric, and the sugar:fructose ratio — same scale for both. */
  mixPart: { min: 0, max: 20 },
  vol: { min: 0, max: 10000 },
  gelParts: { min: 0, max: 50 },
  carbs: { min: 0, max: 1000 },
  ml: { min: 0, max: 5000 },
} as const satisfies Record<string, Limit>;

/** String length caps, under the same encode/decode contract as LIMITS. */
const MAX_LEN = { gid: 20, name: 60, foodKey: 40 } as const;

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

/** Builds the plan that travels in a link, truncated and clamped into exactly the bounds
 *  decodeSharedPlan enforces — see LIMITS for why a degraded link beats a dead one. */
export function buildSharedPlan(data: SettingsExportData, includeWeight: boolean): SharedPlan {
  const r = data.route;
  const m = data.mix;
  return {
    route: {
      sport: r.sport,
      mode: r.mode,
      distance: clampTo(r.distance, LIMITS.km),
      speed: clampTo(r.speed, LIMITS.speed),
      hours: clampTo(r.hours, LIMITS.hours),
      minutes: clampTo(r.minutes, LIMITS.minutes),
      preMealCarbs: clampTo(r.preMealCarbs, LIMITS.preMealCarbs),
      preMealMinutes: clampTo(r.preMealMinutes, LIMITS.preMealMinutes),
      intensity: r.intensity,
      temp: clampTo(r.temp, LIMITS.temp),
    },
    weight: includeWeight ? clampTo(r.weight, LIMITS.weight) : null,
    mix: {
      ...m,
      conc: clampTo(m.conc, LIMITS.conc),
      gelConc: clampTo(m.gelConc, LIMITS.conc),
      ratio: clampTo(m.ratio, LIMITS.mixPart),
      gelRatio: clampTo(m.gelRatio, LIMITS.mixPart),
      salt: clampTo(m.salt, LIMITS.mixPart),
      citric: clampTo(m.citric, LIMITS.mixPart),
      gelSalt: clampTo(m.gelSalt, LIMITS.mixPart),
      gelCitric: clampTo(m.gelCitric, LIMITS.mixPart),
    },
    // Vessel gids are truncated on both sides of the reference, so a fill still finds its
    // bottle — and at 'g<n>' they are nowhere near the cap anyway.
    gear: data.gear.map((v) => ({
      ...v,
      gid: truncate(v.gid, MAX_LEN.gid),
      name: truncate(v.name, MAX_LEN.name),
      vol: clampTo(v.vol, LIMITS.vol),
      gelParts: clampTo(v.gelParts, LIMITS.gelParts),
    })),
    fills: data.fills.map(boundFill),
    foods: data.foods.map(boundFood),
    shops: data.shops.map((s) => ({
      ...s,
      at: clampTo(s.at, LIMITS.km),
      name: truncate(s.name, MAX_LEN.name),
    })),
  };
}

function boundFill(f: Fill): Fill {
  const from = clampTo(f.from, LIMITS.km);
  const to = Math.max(from, clampTo(f.to, LIMITS.km));
  const bounded: Fill = { ...f, gid: truncate(f.gid, MAX_LEN.gid), from, to };
  // Rounding in encodeSharedPlan is monotonic, so a dose clamped inside [from, to] here is
  // still inside the rounded [from, to] the decoder checks it against.
  if (f.pos) bounded.pos = f.pos.map((p) => clampTo(p, { min: from, max: to }));
  return bounded;
}

function boundFood(f: FoodItem): FoodItem {
  const from = clampTo(f.from, LIMITS.km);
  return {
    ...f,
    key: truncate(f.key, MAX_LEN.foodKey),
    name: truncate(f.name, MAX_LEN.name),
    carbs: clampTo(f.carbs, LIMITS.carbs),
    ml: f.ml === undefined ? undefined : clampTo(f.ml, LIMITS.ml),
    from,
    to: Math.max(from, clampTo(f.to, LIMITS.km)),
  };
}

function clampTo(n: number, limit: Limit): number {
  return Number.isFinite(n) ? Math.min(limit.max, Math.max(limit.min, n)) : limit.min;
}

function truncate(s: string, maxLen: number): string {
  return s.length <= maxLen ? s : s.slice(0, maxLen);
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

export async function encodeSharedPlan(plan: SharedPlan): Promise<string> {
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
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const [marker, body] =
    typeof CompressionStream === 'undefined'
      ? [SHARE_CONTAINER_RAW, json]
      : [SHARE_CONTAINER_DEFLATE, await deflateRaw(json)];
  return toBase64Url(withMarker(marker, body));
}

export async function decodeSharedPlan(param: string): Promise<SharedPlan | null> {
  const container = fromBase64Url(param);
  if (!container || container.length < 1) return null;
  const marker = container[0];
  const body = container.subarray(1);

  let json: Uint8Array;
  if (marker === SHARE_CONTAINER_DEFLATE) {
    if (typeof DecompressionStream === 'undefined') return null;
    try {
      json = await inflateRaw(body);
    } catch {
      // A DecompressionStream fed non-deflate bytes (garbage input, a truncated paste)
      // rejects rather than throws synchronously — this is where that becomes a plain null.
      return null;
    }
  } else if (marker === SHARE_CONTAINER_RAW) {
    json = body;
  } else {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(json));
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
  if (weightRaw !== 0 && !inLimit(weightRaw, LIMITS.weight)) return null;

  // Invariants no single row can check on its own. A duplicate id gives React duplicate keys
  // and makes updateFill(fid, …) edit two rows at once; a fill pointing at a vessel that is
  // not in the link has no volume to draw from. Neither can be produced by this app, so a
  // link carrying one is hostile input — and per spec §5.1 a bad link is ignored in silence.
  if (
    !unique(gear.map((v) => v.gid)) ||
    !unique(fills.map((f) => f.fid)) ||
    !unique(foods.map((f) => f.id)) ||
    !unique(shops.map((s) => s.id))
  ) {
    return null;
  }
  const gids = new Set(gear.map((v) => v.gid));
  if (!fills.every((f) => gids.has(f.gid))) return null;

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
function inLimit(v: unknown, limit: Limit): boolean {
  return num(v) && v >= limit.min && v <= limit.max;
}
function str(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.length <= maxLen;
}
/** Ids index React keys and address rows in updateFill/updateFood — fractional or negative
 *  ones are never something this app produced. */
function id(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0;
}
function unique(values: (number | string)[]): boolean {
  return new Set(values).size === values.length;
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
    !inLimit(v[2], LIMITS.km) ||
    !inLimit(v[3], LIMITS.speed) ||
    !inLimit(v[4], LIMITS.hours) ||
    !inLimit(v[5], LIMITS.minutes) ||
    !inLimit(v[6], LIMITS.preMealCarbs) ||
    !inLimit(v[7], LIMITS.preMealMinutes) ||
    !inLimit(v[9], LIMITS.temp)
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
    !inLimit(v[0], LIMITS.conc) ||
    !inLimit(v[1], LIMITS.conc) ||
    !inLimit(v[2], LIMITS.mixPart) ||
    !inLimit(v[3], LIMITS.mixPart) ||
    !inLimit(v[6], LIMITS.mixPart) ||
    !inLimit(v[7], LIMITS.mixPart) ||
    !inLimit(v[8], LIMITS.mixPart) ||
    !inLimit(v[9], LIMITS.mixPart)
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
  if (
    !str(v[0], MAX_LEN.gid) ||
    !str(v[1], MAX_LEN.name) ||
    !inLimit(v[2], LIMITS.vol) ||
    !inLimit(v[4], LIMITS.gelParts)
  ) {
    return null;
  }
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
  if (
    !id(v[0]) ||
    !str(v[1], MAX_LEN.gid) ||
    !inLimit(v[3], LIMITS.km) ||
    !inLimit(v[4], LIMITS.km)
  )
    return null;
  const from: number = v[3];
  const to: number = v[4];
  if (from > to) return null;
  const fill: Fill = { fid: v[0], gid: v[1], content, from, to };
  if (v[5] !== 0) {
    if (!Array.isArray(v[5]) || v[5].length > MAX_SHARED_ARRAY_LENGTH) return null;
    // A dose outside its own fill is a gel poured from a bottle the rider is not carrying yet.
    if (!v[5].every((p) => inLimit(p, { min: from, max: to }))) return null;
    fill.pos = v[5] as number[];
  }
  return fill;
}

function decodeFood(v: unknown): FoodItem | null {
  if (!Array.isArray(v) || v.length !== 8) return null;
  if (
    !id(v[0]) ||
    !str(v[1], MAX_LEN.foodKey) ||
    !str(v[2], MAX_LEN.name) ||
    !inLimit(v[3], LIMITS.carbs) ||
    !inLimit(v[4], LIMITS.ml) ||
    (v[5] !== 0 && v[5] !== 1) ||
    !inLimit(v[6], LIMITS.km) ||
    !inLimit(v[7], LIMITS.km) ||
    v[6] > v[7]
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
  if (!id(v[0]) || !inLimit(v[1], LIMITS.km) || !str(v[2], MAX_LEN.name)) return null;
  return { id: v[0], at: v[1], name: v[2] };
}

// --- container marker + compression --------------------------------------------

function withMarker(marker: number, bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length + 1);
  out[0] = marker;
  out.set(bytes, 1);
  return out;
}

/** Runs `bytes` through a Compression/DecompressionStream and collects the result. Both write
 *  and read are awaited together (rather than firing the write and only awaiting the read) so
 *  a write-side error — e.g. `inflateRaw` fed bytes that are not valid deflate — surfaces as a
 *  rejection here instead of an unhandled one off in the background. */
function pump(
  stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<BufferSource> },
  bytes: Uint8Array,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  // Cast: TS's DOM lib pins BufferSource's ArrayBufferView to an ArrayBuffer-backed one
  // specifically, while a bare `Uint8Array` type is generic over any ArrayBufferLike
  // (including SharedArrayBuffer) — bytes here are always a plain, freshly-allocated buffer.
  const written = writer.write(bytes as BufferSource).then(() => writer.close());
  return Promise.all([written, new Response(stream.readable).arrayBuffer()]).then(
    ([, buf]) => new Uint8Array(buf),
  );
}

function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  return pump(new CompressionStream('deflate-raw'), bytes);
}

function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  return pump(new DecompressionStream('deflate-raw'), bytes);
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
