import { LANGS, type Lang } from '../i18n/strings';
import type {
  Content,
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  RouteInput,
  ShopStop,
  Vessel,
} from './types';

// Pure serialize/validate/deserialize logic for the "export settings to a file
// / import from a file" feature (backup + transfer between devices). Kept
// framework-free per repo convention — SettingsPanel.tsx wires this to a
// download link and a file input.

export const SETTINGS_EXPORT_APP_ID = 'carb-fueling-settings';
export const SETTINGS_EXPORT_SCHEMA_VERSION = 1;

// Upper bound on imported list lengths, so a crafted file with e.g. hundreds
// of thousands of synthetic `fills` entries can't freeze the importing tab
// rendering all of it (chart, Schedule list, recipe cards).
const MAX_IMPORT_ARRAY_LENGTH = 500;

// Durable UI preferences worth carrying across devices. Deliberately excludes
// transient UI state (open panels/sheets, hover/drag/selection, tour progress,
// scrub position) — none of that is "settings" and importing it would just
// leave the app in a weird mid-interaction state.
export type SettingsExportViewMode = 'auto' | 'desktop' | 'mobile';
export type SettingsExportYMode = 'rate' | 'fluid' | 'sum';
export type SettingsExportXUnit = 'km' | 'h';

const VIEW_MODES: SettingsExportViewMode[] = ['auto', 'desktop', 'mobile'];
const Y_MODES: SettingsExportYMode[] = ['rate', 'fluid', 'sum'];
const X_UNITS: SettingsExportXUnit[] = ['km', 'h'];
const CONTENTS: Content[] = ['water', 'izo', 'gel'];

export interface SettingsExportUi {
  lang: Lang;
  viewMode: SettingsExportViewMode;
  xUnit: SettingsExportXUnit;
  yMode: SettingsExportYMode;
}

export interface SettingsExportData {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  shops: ShopStop[];
  foodLib: FoodLibEntry[];
  ui: SettingsExportUi;
  nextGid: number;
  nextFid: number;
  nextFoodId: number;
  nextFoodKey: number;
  nextShopId: number;
}

export interface SettingsExportFile {
  app: typeof SETTINGS_EXPORT_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  data: SettingsExportData;
}

/** Import/export outcome shown in the Header (desktop) and MobileProfile (mobile) feedback banner. */
export type PlanFeedback = 'import-error' | 'import-success' | 'export-error';

export function buildSettingsExport(
  data: SettingsExportData,
  now: Date = new Date(),
): SettingsExportFile {
  return {
    app: SETTINGS_EXPORT_APP_ID,
    schemaVersion: SETTINGS_EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

export function serializeSettingsExport(file: SettingsExportFile): string {
  return JSON.stringify(file, null, 2);
}

// Filename suggestion for the download, e.g. carb-fueling-settings-2026-08-06.json
export function settingsExportFileName(now: Date = new Date()): string {
  const iso = now.toISOString().slice(0, 10);
  return `carb-fueling-settings-${iso}.json`;
}

export type ParseSettingsResult =
  | { ok: true; data: SettingsExportData }
  | { ok: false; reason: 'invalid-json' | 'wrong-shape' | 'unsupported-version' };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === 'string';
}

function isInRange(v: unknown, min: number, max: number): boolean {
  return isFiniteNumber(v) && v >= min && v <= max;
}

function isValidRoute(v: unknown): v is RouteInput {
  if (!isRecord(v)) return false;
  if (v.mode !== 'route' && v.mode !== 'time') return false;
  if (
    !isInRange(v.distance, 0, 2000) ||
    !isInRange(v.speed, 0, 100) ||
    !isInRange(v.weight, 20, 300) ||
    !isInRange(v.hours, 0, 999) ||
    !isFiniteNumber(v.minutes) ||
    !isInRange(v.preMealCarbs, 0, 500) ||
    !isInRange(v.preMealMinutes, 0, 1440) ||
    !isFiniteNumber(v.temp)
  ) {
    return false;
  }
  if (v.intensity !== 'low' && v.intensity !== 'mid' && v.intensity !== 'high') return false;
  if (typeof v.useGpx !== 'boolean') return false;
  if (!isNullableString(v.gpxName) || !isNullableString(v.gpxError)) return false;
  if (v.gpxTrack !== null) {
    if (!isRecord(v.gpxTrack)) return false;
    if (!isFiniteNumber(v.gpxTrack.id) || !Array.isArray(v.gpxTrack.ele)) return false;
    if (v.gpxTrack.ele.length > MAX_IMPORT_ARRAY_LENGTH) return false;
    if (!v.gpxTrack.ele.every((n) => typeof n === 'number')) return false;
  }
  return true;
}

function isValidMix(v: unknown): v is MixSettings {
  if (!isRecord(v)) return false;
  return (
    isFiniteNumber(v.conc) &&
    isFiniteNumber(v.gelConc) &&
    isFiniteNumber(v.ratio) &&
    isFiniteNumber(v.salt) &&
    isFiniteNumber(v.citric) &&
    isFiniteNumber(v.gelSalt) &&
    isFiniteNumber(v.gelCitric)
  );
}

function isValidVessel(v: unknown): v is Vessel {
  if (!isRecord(v)) return false;
  return (
    typeof v.gid === 'string' &&
    typeof v.name === 'string' &&
    isFiniteNumber(v.vol) &&
    Array.isArray(v.allowed) &&
    v.allowed.every((c) => CONTENTS.includes(c as Content)) &&
    isFiniteNumber(v.gelParts)
  );
}

function isValidFill(v: unknown): v is Fill {
  if (!isRecord(v)) return false;
  return (
    isFiniteNumber(v.fid) &&
    typeof v.gid === 'string' &&
    CONTENTS.includes(v.content as Content) &&
    isFiniteNumber(v.from) &&
    isFiniteNumber(v.to)
  );
}

function isValidFood(v: unknown): v is FoodItem {
  if (!isRecord(v)) return false;
  return (
    isFiniteNumber(v.id) &&
    typeof v.key === 'string' &&
    typeof v.name === 'string' &&
    isFiniteNumber(v.carbs) &&
    isFiniteNumber(v.from) &&
    isFiniteNumber(v.to)
  );
}

function isValidShop(v: unknown): v is ShopStop {
  if (!isRecord(v)) return false;
  return isFiniteNumber(v.id) && isFiniteNumber(v.at) && typeof v.name === 'string';
}

function isValidFoodLibEntry(v: unknown): v is FoodLibEntry {
  if (!isRecord(v)) return false;
  return (
    typeof v.key === 'string' &&
    typeof v.pl === 'string' &&
    typeof v.en === 'string' &&
    isFiniteNumber(v.carbs)
  );
}

function isValidUi(v: unknown): v is SettingsExportUi {
  if (!isRecord(v)) return false;
  return (
    LANGS.includes(v.lang as Lang) &&
    VIEW_MODES.includes(v.viewMode as SettingsExportViewMode) &&
    X_UNITS.includes(v.xUnit as SettingsExportXUnit) &&
    Y_MODES.includes(v.yMode as SettingsExportYMode)
  );
}

function isValidSettingsExportData(v: unknown): v is SettingsExportData {
  if (!isRecord(v)) return false;
  return (
    isValidRoute(v.route) &&
    isValidMix(v.mix) &&
    Array.isArray(v.gear) &&
    v.gear.length <= MAX_IMPORT_ARRAY_LENGTH &&
    v.gear.every(isValidVessel) &&
    Array.isArray(v.fills) &&
    v.fills.length <= MAX_IMPORT_ARRAY_LENGTH &&
    v.fills.every(isValidFill) &&
    Array.isArray(v.foods) &&
    v.foods.length <= MAX_IMPORT_ARRAY_LENGTH &&
    v.foods.every(isValidFood) &&
    Array.isArray(v.shops) &&
    v.shops.length <= MAX_IMPORT_ARRAY_LENGTH &&
    v.shops.every(isValidShop) &&
    Array.isArray(v.foodLib) &&
    v.foodLib.length <= MAX_IMPORT_ARRAY_LENGTH &&
    v.foodLib.every(isValidFoodLibEntry) &&
    isValidUi(v.ui) &&
    isFiniteNumber(v.nextGid) &&
    isFiniteNumber(v.nextFid) &&
    isFiniteNumber(v.nextFoodId) &&
    isFiniteNumber(v.nextFoodKey) &&
    isFiniteNumber(v.nextShopId)
  );
}

export function parseSettingsImport(raw: string): ParseSettingsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!isRecord(parsed)) return { ok: false, reason: 'wrong-shape' };
  if (parsed.app !== SETTINGS_EXPORT_APP_ID) return { ok: false, reason: 'wrong-shape' };
  if (
    typeof parsed.schemaVersion !== 'number' ||
    parsed.schemaVersion > SETTINGS_EXPORT_SCHEMA_VERSION
  ) {
    return { ok: false, reason: 'unsupported-version' };
  }
  if (!isValidSettingsExportData(parsed.data)) return { ok: false, reason: 'wrong-shape' };
  return { ok: true, data: parsed.data };
}
