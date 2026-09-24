/**
 * The rider's Kielce–Marki 194km ride: route, mix, gear, food library and selection.
 *
 * Shared by `autoplanPacing.test.ts` (the pacing spec) and `exhaustive.measure.test.ts` (the
 * timing probe on the same ride) — see either file for what it's used for.
 *
 * The ride: 194km, 22km/h, 78kg, 28°C, mid intensity, on the GPX profile in `kielceMarkiEle.ts`,
 * climbing through the first half and finishing on a long descent. Kit: two 710ml izo-or-water
 * bidons, a 630ml water bidon, a 1500ml bladder, and two gel-only flasks (250ml/6 portions,
 * 150ml/5). Selection: a cola, two bananas, a 60g meal.
 */
import { KIELCE_MARKI_ELE } from './kielceMarkiEle';
import type { FoodLibEntry, MixSettings, RouteInput, Vessel } from '../types';

export const route: RouteInput = {
  sport: 'cycling',
  mode: 'route',
  distance: 194,
  speed: 22,
  hours: 0,
  minutes: 0,
  weight: 78,
  preMealCarbs: 50,
  preMealMinutes: 45,
  intensity: 'mid',
  temp: 28,
  useGpx: true,
  gpxTrack: { id: 1, ele: KIELCE_MARKI_ELE },
  gpxName: 'kielce___marki.gpx',
  gpxError: null,
};

export const mix: MixSettings = {
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

export const gear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g3', name: 'Bidon', vol: 710, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g6', name: 'Mały Bidon', vol: 630, allowed: ['water'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 6 },
  { gid: 'g4', name: 'Flask', vol: 150, allowed: ['gel'], gelParts: 5 },
  { gid: 'g5', name: 'Bukłak', vol: 1500, allowed: ['water'], gelParts: 4 },
];

export const foodLib: FoodLibEntry[] = [
  {
    key: 'gel',
    pl: 'Żel energetyczny',
    en: 'Energy gel',
    de: 'Energiegel',
    it: 'Gel energetico',
    carbs: 22,
  },
  {
    key: 'chew',
    pl: 'Żelki',
    en: 'Chews',
    de: 'Kaubonbons',
    it: 'Caramelle gommose',
    carbs: 30,
    cont: true,
    span: 18,
  },
  {
    key: 'cola',
    pl: 'Cola',
    en: 'Cola',
    de: 'Cola',
    it: 'Cola',
    carbs: 35,
    ml: 330,
    needsStop: true,
  },
  { key: 'banana', pl: 'Banan', en: 'Banana', de: 'Banane', it: 'Banana', carbs: 23 },
  // A meal is eaten sitting down, so it is a stop like the cola — owner, 2026-09-23: *"obiad
  // powinien wymuszać postój, obiadu nie zjemy pedałując"*. The fixture used to miss the flag.
  {
    key: 'u1',
    pl: 'Obiad',
    en: 'Meal',
    de: 'Mittagessen',
    it: 'Pranzo',
    carbs: 60,
    cont: false,
    span: 18,
    needsStop: true,
  },
];

export const selection = [
  { key: 'cola', count: 1 },
  { key: 'banana', count: 2 },
  { key: 'u1', count: 1 },
];
