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
  /** Litres of fluid the plan pours, already rounded to `HYDRATION_STEP_L`. */
  hydrationL: number;
  vessels: number;
  stops: number;
}

/** Granularity the shared hydration figure is rounded and printed at, in litres, and the number
 *  of decimals that granularity needs. 0.1 l is what the owner wants for metric: fine enough to
 *  separate 1.5 from 2, coarse enough that nobody reads the figure as a promise. If an imperial
 *  unit system is ever added, the granularity becomes that system's own unit — so the rounding
 *  lives here, named, instead of as a `Math.round(x * 10) / 10` sprinkled across the renderers. */
const HYDRATION_STEP_L = 0.1;
const HYDRATION_DECIMALS = 1;

/** e.g. "~2 l" / "~1.5 l". The tilde is deliberate: this is an estimate, not a measurement. A
 *  whole number drops its trailing ".0" so it reads "~2 l" rather than "~2.0 l". */
export function fmtHydration(litres: number): string {
  return `~${litres.toFixed(HYDRATION_DECIMALS).replace(/\.0$/, '')} l`;
}

export function shareStats(state: PlanState, shops: ShopStop[]): ShareStats {
  const hrs = totalHours(state.route);
  const summary = planSummary(state);
  return {
    distanceKm: Math.round(dist(state.route)),
    durationLabel: fmtHM(hrs),
    carbGph: Math.round(summary.carbRateGph),
    hydrationL: Math.round(summary.fluidPlanned / 1000 / HYDRATION_STEP_L) * HYDRATION_STEP_L,
    vessels: state.gear.length,
    stops: shops.length,
  };
}

/** `stopsPhrase` arrives already inflected ("1 postój" / "2 postoje" / "5 postojów"): picking the
 *  form needs the string table, and this layer stays framework- and i18n-free, so the call site
 *  resolves the phrase and passes it in. */
export function shareBlurb(stats: ShareStats, template: string, stopsPhrase: string): string {
  return template
    .replace('{dist}', String(stats.distanceKm))
    .replace('{dur}', stats.durationLabel)
    .replace('{gph}', String(stats.carbGph))
    .replace('{hyd}', fmtHydration(stats.hydrationL))
    .replace('{stops}', stopsPhrase);
}
