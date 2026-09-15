import { dist, fmtHM, planSummary, totalHours } from './fuel';
import type { PlanState, ShopStop } from './types';

// The handful of figures every shareable artefact prints: the "Link z opisem" blurb,
// the badge PNG and the chart PNG's caption all read from here, so the three cannot
// quote different numbers for the same plan. Framework-free per repo convention.

export interface ShareStats {
  distanceKm: number;
  /** Already formatted (e.g. "3:00") — the three renderers print it verbatim. */
  durationLabel: string;
  /** The same rate the carb badge grades, rounded to whole grams. */
  carbGph: number;
  vessels: number;
  stops: number;
}

export function shareStats(state: PlanState, shops: ShopStop[]): ShareStats {
  const hrs = totalHours(state.route);
  const summary = planSummary(state);
  return {
    distanceKm: Math.round(dist(state.route)),
    durationLabel: fmtHM(hrs),
    carbGph: Math.round(summary.carbRateGph),
    vessels: state.gear.length,
    stops: shops.length,
  };
}

export function shareBlurb(stats: ShareStats, template: string): string {
  return template
    .replace('{dist}', String(stats.distanceKm))
    .replace('{dur}', stats.durationLabel)
    .replace('{gph}', String(stats.carbGph))
    .replace('{stops}', String(stats.stops));
}
