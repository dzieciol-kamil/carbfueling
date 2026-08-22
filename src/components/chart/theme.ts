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
   *  continuous, not a single threshold. */
  fluidWarn: '#D9A400',
  fluidDanger: '#7A1F12',
} as const;

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
