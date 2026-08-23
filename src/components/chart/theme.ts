import type { ActiveSource } from '../../domain/fuel';

export const CHART_COLORS = {
  carb: '#5AA33F',
  gel: '#C9922E',
  food: '#B4552F',
  water: '#3D8FBF',
  climb: '#D2703F',
  ink: '#16191C',
  muted: '#7A817C',
  neutralLine: '#5C635E',
  /** Hydration-rate warning zones, faster than gastric emptying can clear — see
   *  `FLUID_ABSORPTION_CAP_ML_H` in fuel.ts. Applied as a gradient, not a hard cutoff: severity is
   *  continuous, not a single threshold. Own tokens, not reused from `climb` (the unrelated
   *  elevation/gut-limit color) — the two need to move independently. */
  fluidWarn: '#D9A400',
  fluidOver: '#C2571F',
  fluidDanger: '#7A1F12',
} as const;

/**
 * How many multiples of the absorption cap the fluid-rate severity gradient spans, and the
 * multiple each color kicks in at. `spanMultiple` is deliberately wider than the last color
 * stop (`dangerMultiple`): the gradient's pixel-to-value mapping is built from the *chart's*
 * y-scale (which shrinks to fit whatever the current plan's peak actually is), so if the span
 * matched the last stop exactly, a peak anywhere below it would push that stop's pixel position
 * off the top of the visible range and collapse it against the one before — see the call sites
 * in Chart.tsx/MobileChart.tsx for how this fixes that.
 */
export const FLUID_ZONE = {
  warnMultiple: 1.3,
  overMultiple: 1.6,
  dangerMultiple: 2,
  spanMultiple: 2.2,
} as const;

/**
 * Color stops for the fluid-rate severity gradient, as fractions of `cap` mapped through
 * `offsetFor` (each chart supplies its own — a closure over that chart's own value→pixel `py()`
 * and y-domain, since desktop and mobile scale differently). Shared here so the two charts can't
 * silently drift apart on thresholds or colors.
 */
export function fluidZoneGradientStops(
  cap: number,
  offsetFor: (value: number) => number,
): { offset: number; color: string }[] {
  return [
    { offset: offsetFor(0), color: CHART_COLORS.water },
    { offset: offsetFor(cap), color: CHART_COLORS.water },
    { offset: offsetFor(cap * FLUID_ZONE.warnMultiple), color: CHART_COLORS.fluidWarn },
    { offset: offsetFor(cap * FLUID_ZONE.overMultiple), color: CHART_COLORS.fluidOver },
    { offset: offsetFor(cap * FLUID_ZONE.dangerMultiple), color: CHART_COLORS.fluidDanger },
    { offset: 1, color: CHART_COLORS.fluidDanger },
  ];
}

export function sourceColor(active: ActiveSource): string {
  switch (active) {
    case 'water':
      return CHART_COLORS.water;
    case 'gel':
      return CHART_COLORS.gel;
    case 'food':
      return CHART_COLORS.food;
    case 'izo':
      return CHART_COLORS.carb;
    default:
      return CHART_COLORS.neutralLine;
  }
}
