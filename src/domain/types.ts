export type Mode = 'route' | 'time';
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
export type RatioPreset = 'iso' | 'sugar' | 'honey' | 'custom';

export interface RouteInput {
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
  /** True when this stop was created by autoplan() itself (as opposed to a rider placing it
   *  by hand, e.g. via addShop or GPX import). Lets a later autoplan run offer to clean up
   *  only its own previously-generated stops, never a rider-placed one. */
  autoCreated?: boolean;
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
  /** True for things nobody carries with them — a cola, an ice cream. Eating one *is* a stop, so
   *  the planner may only place it at a shop stop (creating one if the item is worth it), and that
   *  stop doubles as a refill opportunity for every bottle on board. */
  needsStop?: boolean;
}

export interface PlanState {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
  shops: ShopStop[];
}
