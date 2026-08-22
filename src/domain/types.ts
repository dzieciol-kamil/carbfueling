export type Mode = 'route' | 'time';
export type Sport = 'cycling' | 'running';
export type Intensity = 'low' | 'mid' | 'high';
export type XUnit = 'km' | 'h';
export type Content = 'water' | 'izo' | 'gel';
/**
 * Sour component of a recipe: pure citric acid powder, a whole fresh fruit
 * (measured as a fraction of one fruit), or its pre-squeezed juice (measured in ml).
 */
export type CitricSource = 'citric' | 'lemon' | 'lemonJuice' | 'lime' | 'limeJuice';
/** Which preset produced `ratio`/`gelRatio` — 'custom' whenever the value was typed into the
 *  free-entry field, even if it numerically matches a preset value. Drives whether the bottle-
 *  composition card shows a single Miód/Cukier line or the Malto/Frukto split. */
export type RatioPreset = 'iso' | 'sugar' | 'honey' | 'ratio15' | 'custom';

export interface RouteInput {
  sport: Sport;
  mode: Mode;
  distance: number;
  speed: number;
  hours: number;
  minutes: number;
  weight: number;
  preMealCarbs: number;
  preMealMinutes: number;
  intensity: Intensity;
  temp: number;
  useGpx: boolean;
  gpxTrack: GpxTrack | null;
  gpxName: string | null;
  gpxError: string | null;
}

export interface GpxTrack {
  id: number;
  ele: number[];
}

export interface MixSettings {
  conc: number;
  gelConc: number;
  ratio: number;
  gelRatio: number;
  ratioPreset: RatioPreset;
  gelRatioPreset: RatioPreset;
  salt: number;
  citric: number;
  gelSalt: number;
  gelCitric: number;
  /** Which sour ingredient `citric` (g/100ml, citric-acid-equivalent) is delivered as. */
  citricSource: CitricSource;
  gelCitricSource: CitricSource;
}

/** The mix a fresh plan (or footer/"Me" tab with no plan in scope) starts from. Lives here,
 *  not in appStore.ts, so framework-free callers (e.g. the landing's SiteFooter) can read it
 *  without importing the store. */
export const DEFAULT_MIX: MixSettings = {
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
};

export interface Vessel {
  gid: string;
  name: string;
  vol: number;
  allowed: Content[];
  gelParts: number;
}

export interface Fill {
  fid: number;
  gid: string;
  content: Content;
  from: number;
  to: number;
  pos?: number[];
}

export interface ShopStop {
  id: number;
  at: number;
  name: string;
}

export interface FoodItem {
  id: number;
  key: string;
  name: string;
  carbs: number;
  ml?: number;
  cont?: boolean;
  from: number;
  to: number;
}

export interface FoodLibEntry {
  key: string;
  pl: string;
  en: string;
  carbs: number;
  ml?: number;
  cont?: boolean;
  span?: number;
}

export interface PlanState {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
}
