import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  bestGapSpan,
  clampFillToDistance,
  clampFoodToDistance,
  clampShopToDistance,
  gaps,
  moveListItem,
  nextShopAt,
} from '../domain/dragMath';
import { startFillOf } from '../domain/combinedRefill';
import { dist, presetTagFor } from '../domain/fuel';
import { loadGpxFile } from '../domain/gpx';
import type { SettingsExportData } from '../domain/settingsExport';
import { LANGS, t, type Lang } from '../i18n/strings';
import { createDebouncedLocalStorage } from './persistStorage';
import {
  DEFAULT_MIX,
  type CitricSource,
  type FoodItem,
  type FoodLibEntry,
  type Intensity,
  type Mode,
  type MixSettings,
  type RatioPreset,
  type RouteInput,
  type Vessel,
  type Fill,
  type ShopStop,
  type XUnit,
} from '../domain/types';

function defaultLang(): Lang {
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : '';
  return browserLang.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export const DESKTOP_BREAKPOINT = 770;

// Read synchronously at store-creation time rather than defaulting to 'desktop' and
// correcting via a useEffect: an effect only runs after the first paint, so on a narrow
// viewport that would commit and briefly paint the desktop tree (and its degenerate-route
// math) before self-correcting to mobile.
function defaultAutoView(): 'desktop' | 'mobile' {
  return typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT
    ? 'mobile'
    : 'desktop';
}

// A route edit (shorter distance, fewer hours, switching mode, a shorter GPX
// track...) can pull the plan's distance domain in under fills/foods/shops
// placed further out — clamp them back onto the route instead of letting
// them render off the end of the chart.
function reconcileToRoute(route: RouteInput, fills: Fill[], foods: FoodItem[], shops: ShopStop[]) {
  const distanceKm = dist(route);
  return {
    fills: fills.map((f) => clampFillToDistance(f, distanceKm)),
    foods: foods.map((f) => clampFoodToDistance(f, distanceKm)),
    shops: shops.map((sh) => clampShopToDistance(sh, distanceKm)),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Minutes are intentionally left unclamped while typing (80 in the minutes field is a
// valid way to enter "1h 20m" mid-edit) — this rolls any minutes overflow/underflow into
// hours once the field is committed, so the fields end up showing the normalized split
// instead of leaving e.g. "80" sitting in the minutes box.
function normalizeHoursMinutes(route: RouteInput): RouteInput {
  if (route.mode !== 'time') return route;
  const totalMinutes = Math.max(0, Math.round(route.hours) * 60 + Math.round(route.minutes));
  return { ...route, hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export type ViewMode = 'auto' | 'desktop' | 'mobile';
export type YMode = 'rate' | 'fluid';
export type PanelId = 'settings' | 'mix' | 'gear' | 'food' | null;
export type MobileTab = 'plan' | 'gear' | 'mix' | 'food' | 'me';

interface UiState {
  lang: Lang;
  viewMode: ViewMode;
  autoView: 'desktop' | 'mobile';
  panel: PanelId;
  xUnit: XUnit;
  yMode: YMode;
  selKey: string | null;
  hoverKey: string | null;
  dragKey: string | null;
  timelineOpen: boolean;
  tab: MobileTab;
  tourStep: number | null;
  tourSeen: boolean;
  tourDemoFid: number | null;
  scrubX: number | null;
  gpxPeek: boolean;
  mixSheet: boolean;
  routeSheet: boolean;
  shopSheet: { editId: number | null } | null;
  chartHelp: boolean;
}

interface AppState {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  shops: ShopStop[];
  foodLib: FoodLibEntry[];
  // Fill ids the rider has picked to prepare together as one batch (see
  // RecipesSection / MobileMixSheet) — any fill of any vessel, not just each
  // vessel's start fill. Unrelated to shop stops.
  combinedFillIds: number[];
  ui: UiState;
  nextGid: number;
  nextFid: number;
  nextFoodId: number;
  nextFoodKey: number;
  nextShopId: number;

  setMode: (mode: Mode) => void;
  setDistance: (n: number) => void;
  setSpeed: (n: number) => void;
  setHours: (n: number) => void;
  setMinutes: (n: number) => void;
  reconcilePlan: () => void;
  setWeight: (n: number) => void;
  setPreMealCarbs: (n: number) => void;
  setPreMealMinutes: (n: number) => void;
  setIntensity: (i: Intensity) => void;
  setTemp: (n: number) => void;
  toggleGpx: () => void;
  loadGpxFromFile: (file: File) => Promise<void>;

  getSettingsExportData: () => SettingsExportData;
  importSettings: (data: SettingsExportData) => void;

  setLang: (lang: Lang) => void;
  setViewMode: (mode: ViewMode) => void;
  setAutoView: (view: 'desktop' | 'mobile') => void;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
  setXUnit: (u: XUnit) => void;
  setYMode: (m: YMode) => void;
  toggleTimelineOpen: () => void;
  setTab: (tab: MobileTab) => void;
  setScrubX: (x: number | null) => void;
  toggleGpxPeek: () => void;
  openMixSheet: () => void;
  closeMixSheet: () => void;
  openChartHelp: () => void;
  closeChartHelp: () => void;
  openRouteSheet: () => void;
  closeRouteSheet: () => void;
  openShopSheet: (editId: number | null) => void;
  closeShopSheet: () => void;
  startTour: () => void;
  closeTour: () => void;
  setTourStep: (n: number) => void;
  loadTourDemoData: () => void;

  setHoverKey: (key: string | null) => void;
  setDragKey: (key: string | null) => void;
  setSelKey: (key: string | null) => void;

  updateFill: (fid: number, patch: Partial<Fill>) => void;
  removeFill: (fid: number) => void;
  addFillInGap: (gid: string) => void;
  setFillContent: (fid: number, content: Fill['content']) => void;

  updateFood: (id: number, patch: Partial<FoodItem>) => void;
  removeFood: (id: number) => void;
  addFoodFromLibrary: (key: string) => void;

  addShop: () => void;
  updateShop: (id: number, patch: Partial<ShopStop>) => void;
  removeShop: (id: number) => void;

  toggleCombinedFill: (fid: number) => void;
  clearCombinedFills: () => void;

  setRatio: (n: number, preset: RatioPreset) => void;
  setGelRatio: (n: number, preset: RatioPreset) => void;
  setConc: (n: number) => void;
  setSalt: (n: number) => void;
  setCitric: (n: number) => void;
  setCitricSource: (source: CitricSource) => void;
  setGelConc: (n: number) => void;
  setGelSalt: (n: number) => void;
  setGelCitric: (n: number) => void;
  setGelCitricSource: (source: CitricSource) => void;
  resetMix: () => void;

  updateVessel: (gid: string, patch: Partial<Vessel>) => void;
  removeVessel: (gid: string) => void;
  addVessel: () => void;
  reorderVessel: (fromIndex: number, toIndex: number) => void;
  toggleVesselAllowed: (gid: string, content: Fill['content']) => void;
  setVesselGelParts: (gid: string, n: number) => void;

  updateFoodLibEntry: (key: string, patch: Partial<FoodLibEntry>) => void;
  removeFoodLibEntry: (key: string) => void;
  addFoodLibEntry: () => void;
}

const defaultRoute: RouteInput = {
  sport: 'cycling',
  mode: 'route',
  distance: 0,
  speed: 0,
  hours: 0,
  minutes: 0,
  weight: 78,
  preMealCarbs: 50,
  preMealMinutes: 45,
  intensity: 'mid',
  temp: 24,
  useGpx: true,
  gpxTrack: null,
  gpxName: null,
  gpxError: null,
};

const defaultMix: MixSettings = DEFAULT_MIX;

const defaultGear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['izo', 'water', 'gel'], gelParts: 4 },
];

const defaultFills: Fill[] = [];

const defaultFoods: FoodItem[] = [];

const defaultShops: ShopStop[] = [];

const defaultCombinedFillIds: number[] = [];

const defaultFoodLib: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330 },
  { key: 'banana', pl: 'Banan', en: 'Banana', carbs: 23 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      route: defaultRoute,
      mix: defaultMix,
      gear: defaultGear,
      fills: defaultFills,
      foods: defaultFoods,
      shops: defaultShops,
      foodLib: defaultFoodLib,
      combinedFillIds: defaultCombinedFillIds,
      ui: {
        lang: defaultLang(),
        viewMode: 'auto',
        autoView: defaultAutoView(),
        panel: null,
        xUnit: 'km',
        yMode: 'rate',
        selKey: null,
        hoverKey: null,
        dragKey: null,
        timelineOpen: false,
        tab: 'plan',
        tourStep: null,
        tourSeen: false,
        tourDemoFid: null,
        scrubX: null,
        gpxPeek: false,
        mixSheet: false,
        routeSheet: false,
        shopSheet: null,
        chartHelp: false,
      },
      nextGid: 3,
      nextFid: 1,
      nextFoodId: 101,
      nextFoodKey: 1,
      nextShopId: 1,

      setMode: (mode) =>
        set((s) => {
          const route = { ...s.route, mode };
          return { route, ...reconcileToRoute(route, s.fills, s.foods, s.shops) };
        }),
      // Distance/hours/minutes are edited through free-typing number fields, which
      // commit a value on every keystroke (for live chart feedback) — reconciling
      // fills/foods/shops right here would clamp them against transient in-progress
      // digits (e.g. typing "50" over "90" passes through "5"), destructively
      // collapsing them before the final value ever lands. Reconcile once the field
      // is actually committed instead — see reconcilePlan, wired to onCommit.
      setDistance: (n) => set((s) => ({ route: { ...s.route, distance: clamp(n, 0, 2000) } })),
      setSpeed: (n) => set((s) => ({ route: { ...s.route, speed: clamp(n, 0, 100) } })),
      setHours: (n) => set((s) => ({ route: { ...s.route, hours: clamp(n, 0, 999) } })),
      // Deliberately unclamped — see normalizeHoursMinutes, applied on commit via reconcilePlan.
      setMinutes: (n) => set((s) => ({ route: { ...s.route, minutes: n } })),
      reconcilePlan: () =>
        set((s) => {
          const route = normalizeHoursMinutes(s.route);
          return { route, ...reconcileToRoute(route, s.fills, s.foods, s.shops) };
        }),
      setWeight: (n) => set((s) => ({ route: { ...s.route, weight: clamp(n, 20, 300) } })),
      setPreMealCarbs: (n) =>
        set((s) => ({ route: { ...s.route, preMealCarbs: clamp(n, 0, 500) } })),
      setPreMealMinutes: (n) =>
        set((s) => ({ route: { ...s.route, preMealMinutes: clamp(n, 0, 1440) } })),
      setIntensity: (i) => set((s) => ({ route: { ...s.route, intensity: i } })),
      setTemp: (n) => set((s) => ({ route: { ...s.route, temp: n } })),
      toggleGpx: () => set((s) => ({ route: { ...s.route, useGpx: !s.route.useGpx } })),
      loadGpxFromFile: async (file) => {
        try {
          const { track, distanceKm, fileName } = await loadGpxFile(file);
          set((s) => {
            const route: RouteInput = {
              ...s.route,
              gpxTrack: track,
              gpxName: fileName,
              gpxError: null,
              useGpx: true,
              distance: distanceKm,
            };
            return { route, ...reconcileToRoute(route, s.fills, s.foods, s.shops) };
          });
        } catch {
          set((s) => ({ route: { ...s.route, gpxError: 'gpxBad' } }));
        }
      },

      // Snapshot of everything a settings backup should cover: gear/products/
      // profile plus the current plan (route, fills, foods, shops) and the
      // durable UI prefs (lang, view mode, chart units/mode). Deliberately
      // excludes transient UI (open panels/sheets, hover/drag/selection, tour
      // progress) — see SettingsExportData in domain/settingsExport.ts.
      getSettingsExportData: () => {
        const s = get();
        return {
          route: s.route,
          mix: s.mix,
          gear: s.gear,
          fills: s.fills,
          foods: s.foods,
          shops: s.shops,
          foodLib: s.foodLib,
          ui: { lang: s.ui.lang, viewMode: s.ui.viewMode, xUnit: s.ui.xUnit, yMode: s.ui.yMode },
          nextGid: s.nextGid,
          nextFid: s.nextFid,
          nextFoodId: s.nextFoodId,
          nextFoodKey: s.nextFoodKey,
          nextShopId: s.nextShopId,
        };
      },
      // Wholesale-replaces settings/plan with an imported backup. Reconciles
      // fills/foods/shops against the imported route's distance the same way
      // any other route edit does, in case the file predates a since-changed
      // clamping rule. Closes any open panel/sheet and clears selection/hover/
      // drag state, since those may reference ids that no longer exist.
      importSettings: (data) =>
        set((s) => {
          const reconciled = reconcileToRoute(data.route, data.fills, data.foods, data.shops);
          return {
            route: data.route,
            mix: data.mix,
            gear: data.gear,
            ...reconciled,
            foodLib: data.foodLib,
            nextGid: data.nextGid,
            nextFid: data.nextFid,
            nextFoodId: data.nextFoodId,
            nextFoodKey: data.nextFoodKey,
            nextShopId: data.nextShopId,
            ui: {
              ...s.ui,
              lang: data.ui.lang,
              viewMode: data.ui.viewMode,
              xUnit: data.ui.xUnit,
              yMode: data.ui.yMode,
              panel: null,
              selKey: null,
              hoverKey: null,
              dragKey: null,
              mixSheet: false,
              routeSheet: false,
              shopSheet: null,
              chartHelp: false,
              tourStep: null,
            },
          };
        }),

      setLang: (lang) => set((s) => ({ ui: { ...s.ui, lang } })),
      setViewMode: (viewMode) => set((s) => ({ ui: { ...s.ui, viewMode } })),
      setAutoView: (autoView) => set((s) => ({ ui: { ...s.ui, autoView } })),
      openPanel: (panel) => set((s) => ({ ui: { ...s.ui, panel } })),
      closePanel: () => set((s) => ({ ui: { ...s.ui, panel: null } })),
      setXUnit: (xUnit) => set((s) => ({ ui: { ...s.ui, xUnit } })),
      setYMode: (yMode) => set((s) => ({ ui: { ...s.ui, yMode } })),
      toggleTimelineOpen: () => set((s) => ({ ui: { ...s.ui, timelineOpen: !s.ui.timelineOpen } })),
      setTab: (tab) => set((s) => ({ ui: { ...s.ui, tab, selKey: null } })),
      setScrubX: (scrubX) => set((s) => ({ ui: { ...s.ui, scrubX } })),
      toggleGpxPeek: () => set((s) => ({ ui: { ...s.ui, gpxPeek: !s.ui.gpxPeek } })),
      openMixSheet: () => set((s) => ({ ui: { ...s.ui, mixSheet: true } })),
      closeMixSheet: () => set((s) => ({ ui: { ...s.ui, mixSheet: false } })),
      openChartHelp: () => set((s) => ({ ui: { ...s.ui, chartHelp: true } })),
      closeChartHelp: () => set((s) => ({ ui: { ...s.ui, chartHelp: false } })),
      openRouteSheet: () => set((s) => ({ ui: { ...s.ui, routeSheet: true } })),
      closeRouteSheet: () => set((s) => ({ ui: { ...s.ui, routeSheet: false } })),
      openShopSheet: (editId) => set((s) => ({ ui: { ...s.ui, shopSheet: { editId } } })),
      closeShopSheet: () => set((s) => ({ ui: { ...s.ui, shopSheet: null } })),
      startTour: () =>
        set((s) => ({
          ui: { ...s.ui, tab: 'plan', tourStep: 0, tourSeen: true, tourDemoFid: null },
        })),
      closeTour: () => set((s) => ({ ui: { ...s.ui, tourStep: null } })),
      setTourStep: (n) => set((s) => ({ ui: { ...s.ui, tourStep: Math.max(0, n) } })),
      loadTourDemoData: () =>
        set((s) => {
          if (s.ui.tourDemoFid !== null) return {};
          // Clears fills/foods/shops rather than appending to them: the replay
          // confirmation promises demo data "in place of" the current plan, so
          // repeated replays must not accumulate fills instead of replacing them.
          const route: RouteInput = { ...s.route, mode: 'route', distance: 90, speed: 28 };
          const distanceKm = dist(route);
          const vessel = s.gear[0];
          if (!vessel) return { route, fills: [], foods: [], shops: [] };
          const span = bestGapSpan(gaps([], distanceKm), distanceKm);
          if (!span) return { route, fills: [], foods: [], shops: [] };
          const allowed: Fill['content'][] = vessel.allowed?.length ? vessel.allowed : ['izo'];
          const content: Fill['content'] = allowed.includes('izo') ? 'izo' : allowed[0];
          const fid = s.nextFid;
          return {
            route,
            fills: [{ fid, gid: vessel.gid, content, from: span.from, to: span.to }],
            foods: [],
            shops: [],
            nextFid: fid + 1,
            ui: { ...s.ui, tourDemoFid: fid },
          };
        }),

      setHoverKey: (hoverKey) => set((s) => ({ ui: { ...s.ui, hoverKey } })),
      setDragKey: (dragKey) => set((s) => ({ ui: { ...s.ui, dragKey } })),
      setSelKey: (selKey) => set((s) => ({ ui: { ...s.ui, selKey } })),

      updateFill: (fid, patch) =>
        set((s) => ({ fills: s.fills.map((f) => (f.fid === fid ? { ...f, ...patch } : f)) })),
      removeFill: (fid) =>
        set((s) => ({
          fills: s.fills.filter((f) => f.fid !== fid),
          combinedFillIds: s.combinedFillIds.filter((f) => f !== fid),
          ui: { ...s.ui, hoverKey: null, selKey: null },
        })),
      addFillInGap: (gid) =>
        set((s) => {
          const vessel = s.gear.find((g) => g.gid === gid);
          if (!vessel) return {};
          const distanceKm = dist(s.route);
          const span = bestGapSpan(
            gaps(
              s.fills.filter((f) => f.gid === gid),
              distanceKm,
            ),
            distanceKm,
          );
          if (!span) return {};
          const allowed: Fill['content'][] = vessel.allowed?.length ? vessel.allowed : ['izo'];
          const content: Fill['content'] = allowed.includes('izo') ? 'izo' : allowed[0];
          return {
            fills: [...s.fills, { fid: s.nextFid, gid, content, from: span.from, to: span.to }],
            nextFid: s.nextFid + 1,
          };
        }),
      setFillContent: (fid, content) =>
        set((s) => ({ fills: s.fills.map((f) => (f.fid === fid ? { ...f, content } : f)) })),

      updateFood: (id, patch) =>
        set((s) => ({ foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFood: (id) =>
        set((s) => ({
          foods: s.foods.filter((f) => f.id !== id),
          ui: { ...s.ui, hoverKey: null, selKey: null },
        })),
      addFoodFromLibrary: (key) =>
        set((s) => {
          const entry = s.foodLib.find((f) => f.key === key);
          if (!entry) return {};
          const distanceKm = dist(s.route);
          const start = Math.round(distanceKm * 0.5);
          const to = entry.cont ? Math.min(distanceKm, start + (entry.span || 18)) : start;
          const name = entry[s.ui.lang] || entry.en;
          return {
            foods: [
              ...s.foods,
              {
                id: s.nextFoodId,
                key: entry.key,
                name,
                carbs: entry.carbs,
                ml: entry.ml,
                cont: !!entry.cont,
                from: start,
                to,
              },
            ],
            nextFoodId: s.nextFoodId + 1,
          };
        }),

      addShop: () =>
        set((s) => {
          const distanceKm = dist(s.route);
          const at = nextShopAt(s.shops, distanceKm);
          return {
            shops: [...s.shops, { id: s.nextShopId, at, name: t(s.ui.lang).shopDefaultName }],
            nextShopId: s.nextShopId + 1,
          };
        }),
      updateShop: (id, patch) =>
        set((s) => ({ shops: s.shops.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeShop: (id) =>
        set((s) => ({
          shops: s.shops.filter((x) => x.id !== id),
          ui: { ...s.ui, hoverKey: null, dragKey: null },
        })),

      toggleCombinedFill: (fid) =>
        set((s) => ({
          combinedFillIds: s.combinedFillIds.includes(fid)
            ? s.combinedFillIds.filter((f) => f !== fid)
            : [...s.combinedFillIds, fid],
        })),
      clearCombinedFills: () => set({ combinedFillIds: [] }),

      setRatio: (n, preset) =>
        set((s) => ({ mix: { ...s.mix, ratio: clamp(n, 0.2, 10), ratioPreset: preset } })),
      setGelRatio: (n, preset) =>
        set((s) => ({ mix: { ...s.mix, gelRatio: clamp(n, 0.2, 10), gelRatioPreset: preset } })),
      setConc: (n) => set((s) => ({ mix: { ...s.mix, conc: clamp(n, 0, 100) } })),
      setSalt: (n) => set((s) => ({ mix: { ...s.mix, salt: clamp(n, 0, 10) } })),
      setCitric: (n) => set((s) => ({ mix: { ...s.mix, citric: clamp(n, 0, 10) } })),
      setCitricSource: (source) => set((s) => ({ mix: { ...s.mix, citricSource: source } })),
      setGelConc: (n) => set((s) => ({ mix: { ...s.mix, gelConc: clamp(n, 0, 100) } })),
      setGelSalt: (n) => set((s) => ({ mix: { ...s.mix, gelSalt: clamp(n, 0, 10) } })),
      setGelCitric: (n) => set((s) => ({ mix: { ...s.mix, gelCitric: clamp(n, 0, 10) } })),
      setGelCitricSource: (source) => set((s) => ({ mix: { ...s.mix, gelCitricSource: source } })),
      resetMix: () => set({ mix: { ...defaultMix } }),

      updateVessel: (gid, patch) =>
        set((s) => ({ gear: s.gear.map((g) => (g.gid === gid ? { ...g, ...patch } : g)) })),
      removeVessel: (gid) =>
        set((s) => {
          const removedFids = new Set(s.fills.filter((f) => f.gid === gid).map((f) => f.fid));
          return {
            gear: s.gear.filter((g) => g.gid !== gid),
            fills: s.fills.filter((f) => f.gid !== gid),
            combinedFillIds: s.combinedFillIds.filter((fid) => !removedFids.has(fid)),
          };
        }),
      addVessel: () =>
        set((s) => ({
          gear: [
            ...s.gear,
            {
              gid: 'g' + s.nextGid,
              name: t(s.ui.lang).newVessel,
              vol: 500,
              allowed: ['water', 'izo'],
              gelParts: 4,
            },
          ],
          nextGid: s.nextGid + 1,
        })),
      reorderVessel: (fromIndex, toIndex) =>
        set((s) => ({ gear: moveListItem(s.gear, fromIndex, toIndex) })),
      toggleVesselAllowed: (gid, content) =>
        set((s) => {
          const willRemoveFills = !!s.gear.find((g) => g.gid === gid)?.allowed.includes(content);
          const removedFids = willRemoveFills
            ? new Set(
                s.fills.filter((f) => f.gid === gid && f.content === content).map((f) => f.fid),
              )
            : null;
          return {
            gear: s.gear.map((g) => {
              if (g.gid !== gid) return g;
              const cur = g.allowed || [];
              const on = cur.includes(content);
              const next = on ? cur.filter((v) => v !== content) : [...cur, content];
              return { ...g, allowed: next.length ? next : cur };
            }),
            fills: willRemoveFills
              ? s.fills.filter((f) => !(f.gid === gid && f.content === content))
              : s.fills,
            combinedFillIds: removedFids
              ? s.combinedFillIds.filter((fid) => !removedFids.has(fid))
              : s.combinedFillIds,
          };
        }),
      setVesselGelParts: (gid, n) =>
        set((s) => ({
          gear: s.gear.map((g) =>
            g.gid === gid ? { ...g, gelParts: Math.max(1, Math.min(12, n)) } : g,
          ),
          fills: s.fills.map((f) => (f.gid === gid ? { ...f, pos: undefined } : f)),
        })),

      updateFoodLibEntry: (key, patch) =>
        set((s) => {
          const foodLib = s.foodLib.map((f) => (f.key === key ? { ...f, ...patch } : f));
          // Existing chart items were seeded from the library's `cont` at creation time and
          // never re-read it afterward — without this, editing a product's shot/steady default
          // in Settings silently stops applying to instances already placed on the chart.
          if (patch.cont === undefined) return { foodLib };
          const cont = patch.cont;
          const distanceKm = dist(s.route);
          const span = foodLib.find((f) => f.key === key)?.span || 18;
          return {
            foodLib,
            foods: s.foods.map((f) =>
              f.key === key
                ? { ...f, cont, to: cont ? Math.min(distanceKm, f.from + span) : f.from }
                : f,
            ),
          };
        }),
      removeFoodLibEntry: (key) =>
        set((s) => ({ foodLib: s.foodLib.filter((f) => f.key !== key) })),
      addFoodLibEntry: () =>
        set((s) => {
          const name = t(s.ui.lang).newFood;
          return {
            foodLib: [...s.foodLib, { key: 'u' + s.nextFoodKey, pl: name, en: name, carbs: 25 }],
            nextFoodKey: s.nextFoodKey + 1,
          };
        }),
    }),
    {
      name: 'carbfueling',
      version: 5,
      storage: createJSONStorage(() => createDebouncedLocalStorage(400)),
      // v1 -> v2: the combine-bottles feature moved from a per-vessel "start fill only"
      // checkbox (combineStartGids: vessel ids) to a per-fill one (combinedFillIds: fill
      // ids). Map each previously-selected vessel to its own start fill's id so an
      // existing selection survives the upgrade instead of silently vanishing.
      // v2 -> v3: ratioPreset/gelRatioPreset are new required MixSettings fields. Infer them
      // once from the persisted numeric ratio/gelRatio (same mapping as presetTagFor) so a
      // rider who already had Miód/Cukier selected doesn't silently lose that label after the
      // upgrade — going forward, the tag is only ever set by an explicit preset-button click.
      // v3 -> v4: the 1.5:1 ratio preset used to have no tag of its own and fell back to
      // 'custom' (see presetTagFor) — a rider who clicked the "1.5:1" button therefore got
      // 'custom' persisted. Now that 1.5 has its own 'ratio15' tag, re-derive the tag for
      // anyone sitting at exactly 1.5 so the segmented control still highlights their choice.
      // v4 -> v5: the chart's "sum" (cumulative) y-mode was removed — fall a rider who had it
      // selected back to "rate" instead of leaving a value the type no longer allows.
      migrate: (persistedState, version) => {
        const s = persistedState as
          (Partial<AppState> & { combineStartGids?: string[] }) | undefined;
        if (!s) return s;
        if (version < 2) {
          const oldGids = Array.isArray(s.combineStartGids) ? s.combineStartGids : [];
          const fills = Array.isArray(s.fills) ? s.fills : [];
          s.combinedFillIds = oldGids
            .map((gid) => startFillOf(gid, fills)?.fid)
            .filter((fid): fid is number => fid != null);
          delete s.combineStartGids;
        }
        if (version < 3 && s.mix) {
          const mix = s.mix as Partial<MixSettings>;
          if (mix.ratioPreset == null && typeof mix.ratio === 'number') {
            mix.ratioPreset = presetTagFor(mix.ratio);
          }
          if (mix.gelRatioPreset == null && typeof mix.gelRatio === 'number') {
            mix.gelRatioPreset = presetTagFor(mix.gelRatio);
          }
        }
        if (version < 4 && s.mix) {
          const mix = s.mix as Partial<MixSettings>;
          if (mix.ratio === 1.5 && mix.ratioPreset === 'custom') {
            mix.ratioPreset = 'ratio15';
          }
          if (mix.gelRatio === 1.5 && mix.gelRatioPreset === 'custom') {
            mix.gelRatioPreset = 'ratio15';
          }
        }
        if (version < 5 && s.ui && (s.ui as { yMode?: string }).yMode === 'sum') {
          (s.ui as { yMode?: string }).yMode = 'rate';
        }
        return s;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        // The test suite runs with `environment: 'node'` (no DOM), so `document` is
        // undefined there — this guard mirrors defaultLang()'s own `typeof navigator`
        // check above rather than requiring every test file to stub a DOM.
        // The attribute is not ours alone: Chrome's "always translate this page" rewrites it to
        // the translation's language. Accepting it unchecked would put e.g. `es` into ui.lang,
        // which nextLangPath() then pushes into the address bar as /es/calculator/ — a URL that
        // 404s on reload — and merge's result goes straight back to localStorage, so it sticks.
        const attrLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
        const htmlLang = LANGS.includes(attrLang as Lang) ? (attrLang as Lang) : undefined;
        return {
          ...currentState,
          ...persisted,
          route: { ...currentState.route, ...persisted?.route },
          // Deep-merge mix so fields added after a user's data was already persisted (e.g.
          // citricSource) fall back to the current default instead of coming back undefined.
          mix: { ...currentState.mix, ...persisted?.mix },
          // Same deep-merge reasoning for ui, plus: the calculator's two HTML entries
          // (en/calculator/index.html, pl/calculator/index.html) seed the language via a
          // static `<html lang>` attribute, read here. That HTML-seeded value always wins
          // over whatever language was previously persisted — otherwise a returning
          // visitor's stored preference would silently override a shared /pl/calculator/
          // link, defeating the point of the URL carrying the language at all.
          ui: {
            ...currentState.ui,
            ...persisted?.ui,
            // autoView is derived from the viewport, not a preference — restoring it
            // makes the first paint depend on whichever device last used the app, so a
            // phone opens the desktop layout until the resize effect corrects it.
            // currentState's value has just been computed by defaultAutoView().
            autoView: currentState.ui.autoView,
            // Where someone happened to be looking last time is not a setting either.
            // Following the landing's "open the calculator" into a settings panel or
            // the Me tab is never what that link promised, so both start from their
            // defaults: no panel open, and the plan.
            panel: currentState.ui.panel,
            tab: currentState.ui.tab,
            // The same argument, one step stronger, for everything that gates a full-screen
            // overlay. All of these are persisted too (there is no partialize), and the
            // debounced write flushes on pagehide — so backgrounding a phone with the Mix
            // sheet open stores `mixSheet: true`, and the next visit opens on that sheet
            // instead of the plan.
            //
            // tourStep is deliberately NOT in this list, even though it gates an overlay too.
            // startTour sets tourSeen at step 0, and tourSeen is a preference that has to
            // survive — so resetting the step alone would strand a first-time visitor who
            // reloaded mid-tour: the overlay would go, and App's `if (tourSeen) return` guard
            // would never bring it back. Leaving the step persisted resumes the tour where it
            // was, which is what happened before this block existed.
            mixSheet: currentState.ui.mixSheet,
            routeSheet: currentState.ui.routeSheet,
            shopSheet: currentState.ui.shopSheet,
            chartHelp: currentState.ui.chartHelp,
            // In-flight pointer state, persisted for the same reason and just as meaningless
            // once the pointer is gone: a drag interrupted by backgrounding the phone brought
            // the bar back rendered mid-drag, with nothing to clear it until the next drag.
            dragKey: currentState.ui.dragKey,
            hoverKey: currentState.ui.hoverKey,
            selKey: currentState.ui.selKey,
            scrubX: currentState.ui.scrubX,
            ...(htmlLang ? { lang: htmlLang } : {}),
          },
        };
      },
    },
  ),
);

export function isDesktopView(viewMode: ViewMode, autoView: 'desktop' | 'mobile'): boolean {
  return viewMode === 'auto' ? autoView === 'desktop' : viewMode === 'desktop';
}

export function shouldConfirmViewModeChange(next: ViewMode, current: ViewMode): boolean {
  return next !== 'auto' && next !== current;
}

export function hasPlanData(state: Pick<AppState, 'route' | 'fills' | 'foods' | 'shops'>): boolean {
  const r = state.route;
  return (
    r.distance > 0 ||
    r.speed > 0 ||
    r.hours > 0 ||
    r.minutes > 0 ||
    r.gpxTrack !== null ||
    state.fills.length > 0 ||
    state.foods.length > 0 ||
    state.shops.length > 0
  );
}
