import { useAppStore } from '../../store/appStore';

export type TourTarget = 'route-summary' | 'chart' | 'demo-fill' | 'demo-add-fill' | 'add-stop';

export type TourCopyKey =
  | 'tourWelcomeTitle'
  | 'tourWelcomeBody'
  | 'tourRouteTitle'
  | 'tourRouteBody'
  | 'tourRouteBodyMobile'
  | 'tourChartTitle'
  | 'tourChartBody'
  | 'tourChartBodyMobile'
  | 'tourFillTitle'
  | 'tourFillBody'
  | 'tourFillBodyMobile'
  | 'tourAddFillTitle'
  | 'tourAddFillBody'
  | 'tourAddFillBodyMobile'
  | 'tourAddStopTitle'
  | 'tourAddStopBody'
  | 'tourAddStopBodyMobile'
  | 'tourClosingTitle'
  | 'tourClosingBody'
  | 'tourClosingBodyMobile';

export interface TourStep {
  target: TourTarget | null;
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
    target: null,
    titleKey: 'tourWelcomeTitle',
    bodyKey: 'tourWelcomeBody',
    // Loaded here, before any step ever renders the chart or lanes, so the
    // demo bottle always already exists by the time the user reaches those
    // steps — no empty-then-filled flash. Idempotent, so revisiting this
    // step via Back/Next can't add a second demo fill.
    onEnter: () => {
      useAppStore.getState().loadTourDemoData();
    },
  },
  {
    target: 'route-summary',
    titleKey: 'tourRouteTitle',
    bodyKey: 'tourRouteBody',
    mobileBodyKey: 'tourRouteBodyMobile',
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
    target: 'demo-add-fill',
    titleKey: 'tourAddFillTitle',
    bodyKey: 'tourAddFillBody',
    mobileBodyKey: 'tourAddFillBodyMobile',
  },
  {
    target: 'add-stop',
    titleKey: 'tourAddStopTitle',
    bodyKey: 'tourAddStopBody',
    mobileBodyKey: 'tourAddStopBodyMobile',
  },
  {
    target: null,
    titleKey: 'tourClosingTitle',
    bodyKey: 'tourClosingBody',
    mobileBodyKey: 'tourClosingBodyMobile',
  },
];
