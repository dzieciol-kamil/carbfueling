/**
 * The sample plan the tour loads: a 90 km ride that is green on both badges, so the first plan a
 * rider is ever shown is a good one rather than the one-bottle deficit the tour used to open on.
 *
 * Two bidons (one iso, one water) refilled at a stop halfway, plus one gel. The whole document is
 * fixed, weight and mix included: water balance scales with body mass, so the same bottles on the
 * rider's own weight could come out amber or over. `tourDemo.test.ts` keeps it green whenever
 * `fuel.ts` changes. Ids are relative (from 0) and remapped by the store onto its own counters.
 */
import {
  DEFAULT_MIX,
  type Fill,
  type FoodItem,
  type MixSettings,
  type RouteInput,
  type Vessel,
} from './types';

export interface TourDemo {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  shops: { at: number }[];
  /** Index into `fills` of the bar the tour's "bottle" step points at. */
  targetFill: number;
}

export const TOUR_DEMO: TourDemo = {
  route: {
    sport: 'cycling',
    mode: 'route',
    distance: 90,
    speed: 28,
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
  },
  mix: DEFAULT_MIX,
  gear: [
    { gid: 'd1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
    { gid: 'd2', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
  ],
  fills: [
    { fid: 0, gid: 'd1', content: 'izo', from: 0, to: 45 },
    { fid: 1, gid: 'd1', content: 'izo', from: 45, to: 90 },
    { fid: 2, gid: 'd2', content: 'water', from: 0, to: 45 },
    { fid: 3, gid: 'd2', content: 'water', from: 45, to: 90 },
  ],
  foods: [{ id: 0, key: 'gel', name: 'Energy gel', carbs: 22, from: 60, to: 60 }],
  shops: [{ at: 45 }],
  targetFill: 0,
};
