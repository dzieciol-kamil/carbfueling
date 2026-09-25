import { useAppStore } from '../../store/appStore';

export type TourTarget = 'route-summary' | 'chart' | 'demo-fill' | 'autoplan' | 'recipes';

export type TourCopyKey =
  | 'tourRouteTitle'
  | 'tourRouteBody'
  | 'tourRouteBodyMobile'
  | 'tourChartTitle'
  | 'tourChartBody'
  | 'tourChartBodyMobile'
  | 'tourFillTitle'
  | 'tourFillBody'
  | 'tourFillBodyMobile'
  | 'tourAutoplanTitle'
  | 'tourAutoplanBody'
  | 'tourAutoplanBodyMobile'
  | 'tourRecipesTitle'
  | 'tourRecipesBody'
  | 'tourRecipesBodyMobile';

export interface TourStep {
  target: TourTarget;
  titleKey: TourCopyKey;
  bodyKey: TourCopyKey;
  // Only set for steps whose interaction differs enough between mouse and touch
  // (drag/hover vs. tap/steppers) that the desktop copy would describe the wrong
  // gesture. Steps without one share the desktop body key on mobile too.
  mobileBodyKey?: TourCopyKey;
  onEnter?: () => (() => void) | void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'route-summary',
    titleKey: 'tourRouteTitle',
    bodyKey: 'tourRouteBody',
    mobileBodyKey: 'tourRouteBodyMobile',
    // Loaded here, before any step ever renders the chart or lanes, so the
    // sample plan always already exists by the time the user reaches those
    // steps — no empty-then-filled flash. Idempotent, so revisiting this
    // step via Back/Next can't load it a second time.
    onEnter: () => {
      useAppStore.getState().loadTourDemoData();
    },
  },
  {
    target: 'chart',
    titleKey: 'tourChartTitle',
    bodyKey: 'tourChartBody',
    mobileBodyKey: 'tourChartBodyMobile',
  },
  {
    target: 'demo-fill',
    titleKey: 'tourFillTitle',
    bodyKey: 'tourFillBody',
    mobileBodyKey: 'tourFillBodyMobile',
  },
  {
    target: 'autoplan',
    titleKey: 'tourAutoplanTitle',
    bodyKey: 'tourAutoplanBody',
    mobileBodyKey: 'tourAutoplanBodyMobile',
  },
  {
    target: 'recipes',
    titleKey: 'tourRecipesTitle',
    bodyKey: 'tourRecipesBody',
    mobileBodyKey: 'tourRecipesBodyMobile',
  },
];
