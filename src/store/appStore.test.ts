import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  autoplanInput,
  autoplanStopRules,
  hasPlanData,
  resolveTheme,
  shouldConfirmViewModeChange,
  withColaAtStop,
  useAppStore,
} from './appStore';
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG } from '../domain/fuel';
import { DEFAULT_AUTOPLAN_OPTIONS } from '../components/autoplan/autoplanOptions';
import type { AutoplanResult } from '../domain/autoplan/types';
import { TOUR_DEMO } from '../domain/tourDemo';
import { ONBOARDING_VERSION } from '../components/onboarding/onboardingFlow';
import type { Fill, RouteInput } from '../domain/types';

function route(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
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
    ...overrides,
  };
}

describe('hasPlanData', () => {
  test('false when route, fills, foods and shops are all default/empty', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], shops: [] })).toBe(false);
  });

  test('true once the route has a distance', () => {
    expect(hasPlanData({ route: route({ distance: 50 }), fills: [], foods: [], shops: [] })).toBe(
      true,
    );
  });

  test('true once a fill exists, even with a default route', () => {
    expect(
      hasPlanData({
        route: route(),
        fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 10 }],
        foods: [],
        shops: [],
      }),
    ).toBe(true);
  });

  test('true once a shop stop exists', () => {
    expect(
      hasPlanData({
        route: route(),
        fills: [],
        foods: [],
        shops: [{ id: 1, at: 40, name: 'Shop' }],
      }),
    ).toBe(true);
  });
});

describe('setSport', () => {
  test('switching sport resets speed to that sport default', () => {
    useAppStore.setState({ route: route({ sport: 'cycling', speed: 28 }) });
    useAppStore.getState().setSport('running');
    expect(useAppStore.getState().route.sport).toBe('running');
    expect(useAppStore.getState().route.speed).toBe(10.9);

    useAppStore.getState().setSport('cycling');
    expect(useAppStore.getState().route.sport).toBe('cycling');
    expect(useAppStore.getState().route.speed).toBe(28);
  });

  test('clicking the already-active sport is a no-op (does not reset speed)', () => {
    useAppStore.setState({ route: route({ sport: 'cycling', speed: 32 }) });
    useAppStore.getState().setSport('cycling');
    expect(useAppStore.getState().route.speed).toBe(32);
  });
});

describe('setWeight', () => {
  test('clamps to the same range the weight sliders use', () => {
    useAppStore.setState({ route: route() });
    useAppStore.getState().setWeight(20);
    expect(useAppStore.getState().route.weight).toBe(WEIGHT_MIN_KG);
    useAppStore.getState().setWeight(300);
    expect(useAppStore.getState().route.weight).toBe(WEIGHT_MAX_KG);
    expect([WEIGHT_MIN_KG, WEIGHT_MAX_KG]).toEqual([45, 150]);
  });
});

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

// Every edit that moves the plan's distance domain rescales the plan proportionally: an item
// at 68% of the route stays at 68% of it. The point is reversibility — see the round-trip tests.
describe('rescaling the plan when the distance domain moves', () => {
  const planFill = { fid: 1, gid: 'g1', content: 'water' as const, from: 34, to: 68 };

  test('setMode to time scales the plan onto the virtual distance', () => {
    useAppStore.setState({
      route: route({ mode: 'route', distance: 100, hours: 1, minutes: 0 }),
      fills: [{ ...planFill, from: 70, to: 90 }],
    });
    useAppStore.getState().setMode('time'); // dist() in time mode = round(1h * 28 km/h cycling-mid) = 28
    expect(useAppStore.getState().fills[0].from).toBeCloseTo(19.6, 9);
    expect(useAppStore.getState().fills[0].to).toBeCloseTo(25.2, 9);
  });

  test('setDistance scales live, on every keystroke', () => {
    useAppStore.setState({ route: route({ distance: 100 }), fills: [planFill] });
    useAppStore.getState().setDistance(50);
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 17, to: 34 });
  });

  test('typing digit by digit lands where the finished number would', () => {
    // "100" overtyped as "50" passes through 5 (and an empty field, committed as 0). Scaling
    // composes, so those transient values cost nothing — unlike the clamping this replaced.
    useAppStore.setState({ route: route({ distance: 100 }), fills: [planFill] });
    useAppStore.getState().setDistance(0);
    useAppStore.getState().setDistance(5);
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0].from).toBeCloseTo(17, 9);
    expect(useAppStore.getState().fills[0].to).toBeCloseTo(34, 9);
  });

  test('restoring the previous distance restores the plan', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      fills: [planFill],
      foods: [{ id: 1, key: 'gel', name: 'Gel', carbs: 25, from: 80, to: 80 }],
      shops: [{ id: 1, at: 95, name: 'Shop' }],
    });
    useAppStore.getState().setDistance(37);
    useAppStore.getState().setDistance(100);
    const s = useAppStore.getState();
    expect(s.fills[0].from).toBeCloseTo(34, 9);
    expect(s.fills[0].to).toBeCloseTo(68, 9);
    expect(s.foods[0].from).toBeCloseTo(80, 9);
    expect(s.shops[0].at).toBeCloseTo(95, 9);
  });

  test('reconcilePlan does not scale a second time on commit', () => {
    useAppStore.setState({ route: route({ distance: 100 }), fills: [planFill] });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 17, to: 34 });
  });

  test('an hours edit scales the plan in time mode', () => {
    useAppStore.setState({
      route: route({ mode: 'time', hours: 3, minutes: 0 }), // dist = round(3 * 28) = 84
      fills: [{ ...planFill, from: 42, to: 84 }],
    });
    useAppStore.getState().setHours(6); // dist = 168
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 84, to: 168 });
  });

  test('setSport scales the plan in time mode, where the virtual distance follows the sport', () => {
    useAppStore.setState({
      route: route({ mode: 'time', sport: 'cycling', hours: 3, minutes: 0 }), // dist = 84
      fills: [{ ...planFill, from: 42, to: 84 }],
      shops: [{ id: 1, at: 84, name: 'Shop' }],
    });
    useAppStore.getState().setSport('running'); // dist = round(3 * 10.9) = 33
    const s = useAppStore.getState();
    expect(s.fills[0].from).toBeCloseTo(16.5, 9);
    expect(s.fills[0].to).toBeCloseTo(33, 9);
    expect(s.shops[0].at).toBeCloseTo(33, 9);
  });

  test('setSport leaves the plan alone in route mode, where the distance is the distance', () => {
    const fills = [planFill];
    useAppStore.setState({ route: route({ mode: 'route', distance: 100 }), fills });
    useAppStore.getState().setSport('running');
    expect(useAppStore.getState().fills).toBe(fills);
  });

  test('setIntensity scales the plan in time mode, where it changes the assumed pace', () => {
    useAppStore.setState({
      route: route({ mode: 'time', intensity: 'mid', hours: 3, minutes: 0 }), // dist = 84
      fills: [{ ...planFill, from: 42, to: 84 }],
    });
    useAppStore.getState().setIntensity('high'); // dist = round(3 * 28 * 1.15) = 97
    expect(useAppStore.getState().fills[0].from).toBeCloseTo(48.5, 9);
    expect(useAppStore.getState().fills[0].to).toBeCloseTo(97, 9);
  });

  test('a speed edit leaves the plan alone — km stay km, only the clock moves', () => {
    const fills = [planFill];
    useAppStore.setState({ route: route({ mode: 'route', distance: 100, speed: 28 }), fills });
    useAppStore.getState().setSpeed(20);
    expect(useAppStore.getState().fills).toBe(fills);
  });
});

describe('tour lifecycle', () => {
  test('startTour opens at step 0 on the plan tab', () => {
    useAppStore.setState((s) => ({ ui: { ...s.ui, tab: 'gear' } }));
    useAppStore.getState().startTour();
    const ui = useAppStore.getState().ui;
    expect(ui.tourStep).toBe(0);
    expect(ui.tab).toBe('plan');
  });

  test('closeTour clears the running step', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().closeTour();
    expect(useAppStore.getState().ui.tourStep).toBeNull();
  });

  test('setTourStep clamps below zero to zero', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(-3);
    expect(useAppStore.getState().ui.tourStep).toBe(0);
  });

  test('setTourStep moves forward freely', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(2);
    expect(useAppStore.getState().ui.tourStep).toBe(2);
  });
});

describe('loadTourDemoData', () => {
  test('loads the sample plan and points the tour at its first iso fill', () => {
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.route.distance).toBe(TOUR_DEMO.route.distance);
    expect(s.fills).toHaveLength(TOUR_DEMO.fills.length);
    expect(s.foods).toHaveLength(TOUR_DEMO.foods.length);
    expect(s.shops).toHaveLength(TOUR_DEMO.shops.length);
    expect(s.gear).toHaveLength(TOUR_DEMO.gear.length);
    const target = s.fills.find((f) => f.fid === s.ui.tourDemoFid);
    expect(target?.content).toBe('izo');
    expect(s.ui.sampleActive).toBe(true);
  });

  test('every id it hands out is new, and the fills name its own vessels', () => {
    const before = useAppStore.getState();
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    const gids = new Set(s.gear.map((v) => v.gid));
    expect(s.fills.every((f) => gids.has(f.gid))).toBe(true);
    expect(before.gear.some((v) => gids.has(v.gid))).toBe(false);
    expect(Math.min(...s.fills.map((f) => f.fid))).toBe(before.nextFid);
    expect(s.nextFid).toBe(before.nextFid + TOUR_DEMO.fills.length);
  });

  test('is a no-op the second time it is called', () => {
    useAppStore.getState().loadTourDemoData();
    const fills = useAppStore.getState().fills;
    useAppStore.getState().loadTourDemoData();
    expect(useAppStore.getState().fills).toBe(fills);
  });

  test('replaying the tour does not accumulate fills', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().startTour(); // resets tourDemoFid, as a replay from the footer does
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.fills).toHaveLength(TOUR_DEMO.fills.length);
    expect(s.fills.some((f) => f.fid === s.ui.tourDemoFid)).toBe(true);
  });
});

describe('restoring the plan the tour replaced', () => {
  function ownPlan() {
    useAppStore.getState().setDistance(120);
    useAppStore.getState().setSpeed(25);
    useAppStore.getState().addFillInGap('g1');
    useAppStore.getState().addShop();
    useAppStore.getState().setWeight(64);
  }
  const doc = () => {
    const { route, mix, gear, fills, foods, shops, foodLib, combinedFillIds } =
      useAppStore.getState();
    return { route, mix, gear, fills, foods, shops, foodLib, combinedFillIds };
  };

  test('Given my own plan, When I go through the tour and restore, Then my plan is back as it was', () => {
    ownPlan();
    const before = doc();
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    // Playing with the sample during the tour is not something restore has to undo step by step.
    const { fills } = useAppStore.getState();
    useAppStore.getState().updateFill(fills[0].fid, { to: 30 });
    useAppStore.getState().removeShop(useAppStore.getState().shops[0].id);
    useAppStore.getState().restorePreTourPlan();
    expect(doc()).toEqual(before);
    expect(useAppStore.getState().ui.sampleActive).toBe(false);
  });

  test('a replay while the sample is still up restores the plan from before the first one', () => {
    ownPlan();
    const before = doc();
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().restorePreTourPlan();
    expect(doc()).toEqual(before);
  });

  test('keeping the sample forgets the old plan', () => {
    ownPlan();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().dismissSample();
    const sample = doc();
    useAppStore.getState().restorePreTourPlan();
    expect(doc()).toEqual(sample);
    expect(useAppStore.getState().ui.sampleActive).toBe(false);
  });

  test('starting over ends the sample', () => {
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().clearPlan();
    expect(useAppStore.getState().ui.sampleActive).toBe(false);
  });
});

describe('Set me up', () => {
  const lib = () => useAppStore.getState().foodLib;

  test('closing it the first time finishes onboarding and starts the hints', () => {
    useAppStore.getState().openSetup();
    useAppStore.getState().closeSetup();
    const ui = useAppStore.getState().ui;
    expect(ui.setupOpen).toBe(false);
    expect(ui.onboardingVersion).toBe(ONBOARDING_VERSION);
    expect(ui.onboardingHint).toBe(1);
  });

  test('Skip changes nothing of the plan', () => {
    const { route, gear, foodLib } = useAppStore.getState();
    useAppStore.getState().openSetup();
    useAppStore.getState().closeSetup();
    const s = useAppStore.getState();
    expect(s.route).toBe(route);
    expect(s.gear).toBe(gear);
    expect(s.foodLib).toBe(foodLib);
  });

  test('opening it again later does not restart the hints', () => {
    useAppStore.getState().closeSetup();
    useAppStore.getState().setOnboardingHint(null);
    useAppStore.getState().openSetup();
    useAppStore.getState().closeSetup();
    expect(useAppStore.getState().ui.onboardingHint).toBeNull();
  });

  test('saving writes weight, gear and products to the same data Settings, Gear and Products edit', () => {
    const [bidon] = useAppStore.getState().gear;
    const gel = lib().find((e) => e.key === 'gel')!;
    useAppStore.getState().applySetup({
      weight: 66,
      gear: [
        { ...bidon, vol: 750 },
        { gid: 'new:1', name: 'Bladder', vol: 1500, allowed: ['water'], gelParts: 4 },
      ],
      foodLib: [
        gel,
        { key: 'new:1', pl: 'Daktyle', en: 'Daktyle', de: 'Daktyle', it: 'Daktyle', carbs: 18 },
      ],
    });
    const s = useAppStore.getState();
    expect(s.route.weight).toBe(66);
    expect(s.gear.map((v) => [v.name, v.vol])).toEqual([
      ['Bidon', 750],
      ['Bladder', 1500],
    ]);
    expect(s.gear[1].gid).toBe('g' + initialState.nextGid);
    expect(s.nextGid).toBe(initialState.nextGid + 1);
    expect(s.foodLib.map((e) => e.key)).toEqual(['gel', 'u' + initialState.nextFoodKey]);
    expect(s.ui.onboardingHint).toBe(1);
  });

  test('a vessel left out takes its fills along, like removing it in Gear', () => {
    useAppStore.getState().setDistance(100);
    useAppStore.getState().setSpeed(25);
    useAppStore.getState().addFillInGap('g1');
    useAppStore.getState().addFillInGap('g2');
    const [, flask] = useAppStore.getState().gear;
    useAppStore.getState().applySetup({ weight: 78, gear: [flask], foodLib: lib() });
    expect(useAppStore.getState().fills.map((f) => f.gid)).toEqual(['g2']);
  });

  test('weight is held to the one weight range', () => {
    useAppStore.getState().applySetup({ weight: 500, gear: [], foodLib: [] });
    expect(useAppStore.getState().route.weight).toBe(WEIGHT_MAX_KG);
  });
});

describe('applyAutoplan', () => {
  test('replaces fills/foods, appends new stops, and advances the fid/shop id counters', () => {
    useAppStore.setState({
      route: route({ distance: 300, speed: 25 }),
      fills: [{ fid: 999, gid: 'g1', content: 'water', from: 0, to: 10 }],
      foods: [],
      shops: [{ id: 1, at: 5, name: 'Existing' }],
    });
    const before = useAppStore.getState();
    const beforeFid = before.nextFid;
    const beforeShopId = before.nextShopId;

    useAppStore.getState().applyAutoplan([], false);

    const after = useAppStore.getState();
    expect(after.fills.every((f) => f.fid >= beforeFid)).toBe(true);
    expect(after.fills.some((f) => f.fid === 999)).toBe(false); // old fill replaced
    expect(after.shops.some((sh) => sh.id === 1 && sh.name === 'Existing')).toBe(true); // preserved
    expect(after.nextFid).toBeGreaterThan(beforeFid);
    if (after.shops.length > before.shops.length) {
      expect(after.nextShopId).toBeGreaterThan(beforeShopId);
    }
  });

  /**
   * Every fill in the plan is replaced, so anything pointing at a fill by id is pointing at
   * nothing. `combinedFillIds` is the rider's "I'll prepare these two together" batch in Recipes:
   * left behind, it resolves to zero fills and the block disappears from the page without a word,
   * while the dead ids sit in localStorage forever. The transient hover/drag/selection keys are
   * the same story — they name a fill that no longer exists.
   */
  test('drops the pointers into the plan it just replaced', () => {
    useAppStore.setState({
      route: route({ distance: 300, speed: 25 }),
      fills: [
        { fid: 901, gid: 'g1', content: 'izo', from: 0, to: 50 },
        { fid: 902, gid: 'g2', content: 'water', from: 0, to: 50 },
      ],
      foods: [],
      shops: [],
      combinedFillIds: [901, 902],
      ui: { ...useAppStore.getState().ui, selKey: 'f901', hoverKey: 'f902', dragKey: 'f901' },
    });

    useAppStore.getState().applyAutoplan([], false);

    const after = useAppStore.getState();
    expect(after.combinedFillIds).toEqual([]);
    expect(after.ui.selKey).toBeNull();
    expect(after.ui.hoverKey).toBeNull();
    expect(after.ui.dragKey).toBeNull();
  });

  /**
   * On a phone the button lives in the shared header, so it fires from Gear, Mix, Food or Me just
   * as readily as from the plan. The rider then gets a toast telling him a plan was made, on a
   * screen showing none of it.
   */
  test('brings the rider to the plan it just made', () => {
    useAppStore.setState({
      route: route({ distance: 120, speed: 25 }),
      fills: [],
      foods: [],
      shops: [],
      ui: { ...useAppStore.getState().ui, tab: 'gear' },
    });

    useAppStore.getState().applyAutoplan([], false);

    expect(useAppStore.getState().ui.tab).toBe('plan');
  });

  test('resolves food names from foodLib in the current UI language and advances nextFoodId', () => {
    useAppStore.setState({
      route: route({ distance: 100, speed: 25 }),
      gear: [], // no vessels => no bottle carbs, forcing the whole target onto food
      foods: [],
      ui: { ...useAppStore.getState().ui, lang: 'pl' },
    });
    const beforeFoodId = useAppStore.getState().nextFoodId;

    useAppStore.getState().applyAutoplan([{ key: 'gel', count: 5 }], false);

    const after = useAppStore.getState();
    expect(after.foods.length).toBeGreaterThan(0);
    expect(after.foods.every((f) => f.name === 'Żel energetyczny')).toBe(true);
    expect(after.foods.every((f) => f.id >= beforeFoodId)).toBe(true);
    expect(after.nextFoodId).toBeGreaterThan(beforeFoodId);
  });

  test('tags newly created stops as autoCreated', () => {
    useAppStore.setState({
      route: route({ distance: 300, speed: 25 }),
      fills: [],
      foods: [],
      shops: [],
    });

    useAppStore.getState().applyAutoplan([], false);

    const after = useAppStore.getState();
    expect(after.shops.length).toBeGreaterThan(0);
    expect(after.shops.every((sh) => sh.autoCreated === true)).toBe(true);
  });

  describe('removePreviousAutoStops toggle', () => {
    // A manual stop id far outside the auto-assigned range (which starts at nextShopId, here
    // 501) so it can never collide with an id the store hands out to an autoplan-created stop.
    function setupWithAutoStopsAndOneManualStop() {
      useAppStore.setState({
        route: route({ distance: 300, speed: 25 }),
        fills: [],
        foods: [],
        shops: [{ id: 1, at: 40, name: 'Manual stop' }],
        nextShopId: 501,
      });
      // First run creates at least one autoCreated stop to build on top of.
      useAppStore.getState().applyAutoplan([], false);
      const s = useAppStore.getState();
      expect(s.shops.some((sh) => sh.autoCreated)).toBe(true);
      expect(s.shops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
    }

    test('false: a second run keeps prior autoplan stops and adds the new ones', () => {
      setupWithAutoStopsAndOneManualStop();
      const before = useAppStore.getState();
      const priorAutoStopIds = before.shops.filter((sh) => sh.autoCreated).map((sh) => sh.id);

      // Grow the route so the second run needs more refill points than the first — the engine
      // never sees the existing stops, so a longer route is what makes it produce more of them.
      useAppStore.setState({ route: route({ distance: 600, speed: 25 }) });
      useAppStore.getState().applyAutoplan([], false);

      const after = useAppStore.getState();
      expect(after.shops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
      for (const id of priorAutoStopIds) {
        expect(after.shops.some((sh) => sh.id === id)).toBe(true);
      }
      expect(after.shops.filter((sh) => sh.autoCreated).length).toBeGreaterThan(
        priorAutoStopIds.length,
      );
    });

    test('true: a second run removes prior autoplan stops but never a manually-added one', () => {
      setupWithAutoStopsAndOneManualStop();
      const before = useAppStore.getState();
      const priorAutoStopIds = before.shops.filter((sh) => sh.autoCreated).map((sh) => sh.id);
      expect(priorAutoStopIds.length).toBeGreaterThan(0);

      useAppStore.getState().applyAutoplan([], true);

      const after = useAppStore.getState();
      expect(after.shops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
      for (const id of priorAutoStopIds) {
        expect(after.shops.some((sh) => sh.id === id)).toBe(false);
      }
      // The new run still needs stops at the same route positions, so it recreates them
      // (fresh ids) rather than leaving the rider with none.
      expect(after.shops.some((sh) => sh.autoCreated)).toBe(true);
    });

    /**
     * A suggestion the rider edits stops being a suggestion.
     *
     * Autoplan guesses a kilometre; the rider drags it onto the shop he knows is there and types
     * its name. From then on it is his, and the cleanup that clears "previously suggested stops"
     * has no business deleting it.
     */
    test('a stop the rider renames or moves stops counting as autoplan’s', () => {
      useAppStore.setState({
        shops: [
          { id: 1, at: 40, name: 'Sklep', autoCreated: true },
          { id: 2, at: 80, name: 'Sklep', autoCreated: true },
        ],
      });

      useAppStore.getState().updateShop(1, { name: 'Żabka za mostem' });
      useAppStore.getState().updateShop(2, { at: 83 });

      const after = useAppStore.getState();
      expect(after.shops.find((sh) => sh.id === 1)?.autoCreated).toBeFalsy();
      expect(after.shops.find((sh) => sh.id === 2)?.autoCreated).toBeFalsy();
    });

    test('an adopted stop survives the cleanup that wipes the rest', () => {
      setupWithAutoStopsAndOneManualStop();
      const adopted = useAppStore.getState().shops.find((sh) => sh.autoCreated)!;
      useAppStore.getState().updateShop(adopted.id, { name: 'Źródełko' });

      useAppStore.getState().applyAutoplan([], true);

      const after = useAppStore.getState();
      expect(after.shops.some((sh) => sh.id === adopted.id && sh.name === 'Źródełko')).toBe(true);
    });
  });

  /**
   * `options` (autoplanOptions.ts) is what the pre-flight modal collects. Every call above omits
   * it and still gets the plain behavior via the default parameter — these cover the two things it
   * newly lets the caller do: drop the rider's own stops too, and leave a vessel home for the run.
   */
  describe('options', () => {
    test("stopsMode 'clear' drops the rider's own stops, not just autoplan's prior guesses", () => {
      useAppStore.setState({
        route: route({ distance: 300, speed: 25 }),
        fills: [],
        foods: [],
        // An id far outside the auto-assigned range (which starts at nextShopId, here 501) so a
        // freshly created stop can never collide with it by coincidence.
        shops: [{ id: 1, at: 40, name: 'Manual stop' }],
        nextShopId: 501,
      });

      useAppStore.getState().applyAutoplan([], true, {
        stopsMode: 'clear',
        carriedVesselGids: null,
      });

      const after = useAppStore.getState();
      expect(after.shops.some((sh) => sh.id === 1 || sh.name === 'Manual stop')).toBe(false);
    });

    test("stopsMode 'keepOnly' keeps the rider's stops and adds none of its own", () => {
      // The same 300 km ride that needs refill stops above, with one stop of the rider's.
      useAppStore.setState({
        route: route({ distance: 300, speed: 25 }),
        fills: [],
        foods: [],
        shops: [{ id: 1, at: 40, name: 'Manual stop' }],
        nextShopId: 501,
      });

      useAppStore.getState().applyAutoplan([], true, {
        stopsMode: 'keepOnly',
        carriedVesselGids: null,
      });

      const after = useAppStore.getState();
      expect(after.shops).toEqual([{ id: 1, at: 40, name: 'Manual stop' }]);
      expect(after.fills.length).toBeGreaterThan(0);
    });

    test('carriedVesselGids keeps an unchecked vessel out of the run without touching saved gear', () => {
      useAppStore.setState({
        route: route({ distance: 200, speed: 25 }),
        gear: [
          { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
          { gid: 'g2', name: 'Flask', vol: 250, allowed: ['izo', 'water', 'gel'], gelParts: 4 },
        ],
        fills: [],
        foods: [],
        shops: [],
      });

      useAppStore.getState().applyAutoplan([], true, {
        stopsMode: 'keepAndAdd',
        carriedVesselGids: ['g1'],
      });

      const after = useAppStore.getState();
      expect(after.fills.every((f) => f.gid !== 'g2')).toBe(true);
      // Left home for this run only — the saved gear list itself is untouched.
      expect(after.gear.map((g) => g.gid)).toEqual(['g1', 'g2']);
    });
  });
});

describe('insertAutoplan', () => {
  const resultAt = (ats: number[]): AutoplanResult => ({
    fills: [],
    foods: [],
    newStops: ats.map((at) => ({ at })),
  });

  test('a second insert replaces the first one’s stops and keeps the rider’s own', () => {
    useAppStore.setState({
      shops: [{ id: 1, at: 40, name: 'Manual stop' }],
      nextShopId: 501,
    });

    useAppStore.getState().insertAutoplan(resultAt([30, 60, 90]));
    useAppStore.getState().insertAutoplan(resultAt([50]));

    const shops = useAppStore.getState().shops;
    expect(shops.filter((sh) => sh.autoCreated).map((sh) => sh.at)).toEqual([50]);
    expect(shops.some((sh) => sh.id === 1)).toBe(true);
  });

  /**
   * The thinking modal's worker gets this exact object via `postMessage`, which uses the
   * structured-clone algorithm under the hood — a function or a `Map`/class instance anywhere in
   * it throws `DataCloneError` rather than silently dropping. `structuredClone()` here is the same
   * check the browser would run, without needing an actual Worker in the test environment.
   */
  test('autoplanInput is plain data the worker can receive', () => {
    const input = autoplanInput(useAppStore.getState(), DEFAULT_AUTOPLAN_OPTIONS);

    expect(() => structuredClone(input)).not.toThrow();
    expect(Object.keys(input).sort()).toEqual([
      'fills',
      'foodLib',
      'foods',
      'gear',
      'mix',
      'route',
    ]);
  });
});

describe('mobile ui state', () => {
  test('setTab switches tab and clears selKey', () => {
    useAppStore.getState().setSelKey('f1');
    useAppStore.getState().setTab('mix');
    expect(useAppStore.getState().ui.tab).toBe('mix');
    expect(useAppStore.getState().ui.selKey).toBeNull();
  });

  test('setScrubX stores and clears the scrub position', () => {
    useAppStore.getState().setScrubX(42);
    expect(useAppStore.getState().ui.scrubX).toBe(42);
    useAppStore.getState().setScrubX(null);
    expect(useAppStore.getState().ui.scrubX).toBeNull();
  });

  test('toggleGpxPeek flips the flag', () => {
    const before = useAppStore.getState().ui.gpxPeek;
    useAppStore.getState().toggleGpxPeek();
    expect(useAppStore.getState().ui.gpxPeek).toBe(!before);
  });

  test('mix/route sheets open and close', () => {
    useAppStore.getState().openMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(true);
    useAppStore.getState().closeMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(false);

    useAppStore.getState().openRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(true);
    useAppStore.getState().closeRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(false);
  });

  test('shop sheet opens with an edit target and closes to null', () => {
    useAppStore.getState().openShopSheet(7);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: 7 });
    useAppStore.getState().openShopSheet(null);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: null });
    useAppStore.getState().closeShopSheet();
    expect(useAppStore.getState().ui.shopSheet).toBeNull();
  });
});

describe('chart help modal', () => {
  test('closed by default', () => {
    expect(useAppStore.getState().ui.chartHelp).toBe(false);
  });

  test('openChartHelp sets chartHelp true', () => {
    useAppStore.getState().openChartHelp();
    expect(useAppStore.getState().ui.chartHelp).toBe(true);
  });

  test('closeChartHelp sets chartHelp false', () => {
    useAppStore.getState().openChartHelp();
    useAppStore.getState().closeChartHelp();
    expect(useAppStore.getState().ui.chartHelp).toBe(false);
  });
});

describe('shouldConfirmViewModeChange', () => {
  test('never confirms switching back to auto', () => {
    expect(shouldConfirmViewModeChange('auto', 'desktop')).toBe(false);
    expect(shouldConfirmViewModeChange('auto', 'mobile')).toBe(false);
  });

  test('confirms picking a different forced layout', () => {
    expect(shouldConfirmViewModeChange('desktop', 'auto')).toBe(true);
    expect(shouldConfirmViewModeChange('mobile', 'auto')).toBe(true);
    expect(shouldConfirmViewModeChange('mobile', 'desktop')).toBe(true);
  });

  test('does not confirm re-picking the already-active forced layout', () => {
    expect(shouldConfirmViewModeChange('desktop', 'desktop')).toBe(false);
    expect(shouldConfirmViewModeChange('mobile', 'mobile')).toBe(false);
  });
});

describe('resolveTheme', () => {
  test('auto resolves to the detected OS theme', () => {
    expect(resolveTheme('auto', 'dark')).toBe('dark');
    expect(resolveTheme('auto', 'light')).toBe('light');
  });

  test('an explicit choice overrides auto-detection', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
});

describe('addFillInGap', () => {
  function overlaps(fills: Fill[]): boolean {
    const sorted = fills.slice().sort((a, b) => a.from - b.from);
    return sorted.some((f, i) => i > 0 && f.from < sorted[i - 1].to);
  }

  test('shrinks the new fill to a gap narrower than the default width', () => {
    const gid = useAppStore.getState().gear[0].gid;
    useAppStore.setState({
      route: route({ mode: 'route', distance: 90, speed: 28 }),
      fills: [{ fid: 1, gid, content: 'izo', from: 0, to: 78 }],
      nextFid: 2,
    });
    useAppStore.getState().addFillInGap(gid);
    expect(useAppStore.getState().fills.find((f) => f.fid === 2)).toMatchObject({
      from: 78,
      to: 90,
    });
  });

  test('keeps finding real gaps after the widest gap put a new fill left of the old ones', () => {
    const gid = useAppStore.getState().gear[0].gid;
    // The widest gap can sit left of an existing fill, so the appended fill lands ahead
    // of it on the lane: array order stops matching lane order without any drag at all.
    useAppStore.setState({
      route: route({ mode: 'route', distance: 90, speed: 28 }),
      fills: [
        { fid: 1, gid, content: 'izo', from: 60, to: 85 },
        { fid: 2, gid, content: 'izo', from: 0, to: 25 },
      ],
      nextFid: 3,
    });
    useAppStore.getState().addFillInGap(gid);
    expect(useAppStore.getState().fills.find((f) => f.fid === 3)).toMatchObject({
      from: 25,
      to: 50,
    });
    expect(overlaps(useAppStore.getState().fills)).toBe(false);
  });

  test('does not stack a fill on an existing one when the array is out of lane order', () => {
    const gid = useAppStore.getState().gear[0].gid;
    // Only the two 5 km slivers are free; array order gives no hint of that.
    useAppStore.setState({
      route: route({ mode: 'route', distance: 90, speed: 28 }),
      fills: [
        { fid: 1, gid, content: 'izo', from: 0, to: 25 },
        { fid: 2, gid, content: 'izo', from: 60, to: 85 },
        { fid: 3, gid, content: 'izo', from: 30, to: 55 },
      ],
      nextFid: 4,
    });
    useAppStore.getState().addFillInGap(gid);
    const fills = useAppStore.getState().fills;
    expect(fills).toHaveLength(4);
    expect(overlaps(fills)).toBe(false);
  });

  test('adds nothing when the lane has no gap left', () => {
    const gid = useAppStore.getState().gear[0].gid;
    useAppStore.setState({
      route: route({ mode: 'route', distance: 90, speed: 28 }),
      fills: [{ fid: 1, gid, content: 'izo', from: 0, to: 90 }],
      nextFid: 2,
    });
    useAppStore.getState().addFillInGap(gid);
    expect(useAppStore.getState().fills).toHaveLength(1);
  });
});

describe('combinedFillIds', () => {
  test('toggleCombinedFill adds then removes a fill id', () => {
    useAppStore.getState().toggleCombinedFill(1);
    expect(useAppStore.getState().combinedFillIds).toEqual([1]);
    useAppStore.getState().toggleCombinedFill(1);
    expect(useAppStore.getState().combinedFillIds).toEqual([]);
  });

  test('toggleCombinedFill can hold multiple selected fills', () => {
    useAppStore.getState().toggleCombinedFill(1);
    useAppStore.getState().toggleCombinedFill(2);
    expect(useAppStore.getState().combinedFillIds).toEqual([1, 2]);
  });

  test("removeVessel drops that vessel's fill ids from the selection", () => {
    const gid = useAppStore.getState().gear[0].gid;
    const otherGid = useAppStore.getState().gear[1].gid;
    const fills: Fill[] = [
      { fid: 1, gid, content: 'izo', from: 0, to: 10 },
      { fid: 2, gid: otherGid, content: 'izo', from: 0, to: 10 },
    ];
    useAppStore.setState({ fills, combinedFillIds: [1, 2] });
    useAppStore.getState().removeVessel(gid);
    expect(useAppStore.getState().combinedFillIds).toEqual([2]);
  });

  test('removeFill drops just that fill id from the selection', () => {
    const gid = useAppStore.getState().gear[0].gid;
    const fills: Fill[] = [
      { fid: 1, gid, content: 'izo', from: 0, to: 10 },
      { fid: 2, gid, content: 'izo', from: 20, to: 30 },
    ];
    useAppStore.setState({ fills, combinedFillIds: [1, 2] });
    useAppStore.getState().removeFill(1);
    expect(useAppStore.getState().combinedFillIds).toEqual([2]);
  });

  test('toggleVesselAllowed drops fill ids it removes along with the disallowed content', () => {
    const gid = useAppStore.getState().gear[0].gid; // Bidon, allowed water+izo by default
    const fills: Fill[] = [{ fid: 1, gid, content: 'izo', from: 0, to: 10 }];
    useAppStore.setState({ fills, combinedFillIds: [1] });
    useAppStore.getState().toggleVesselAllowed(gid, 'izo'); // turning izo off removes the izo fill
    expect(useAppStore.getState().fills).toEqual([]);
    expect(useAppStore.getState().combinedFillIds).toEqual([]);
  });
});

describe('citric source setters', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  test('defaults to lemon for both izo and gel', () => {
    expect(useAppStore.getState().mix.citricSource).toBe('lemon');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('lemon');
  });

  test('setCitricSource only changes the izo source', () => {
    useAppStore.getState().setCitricSource('citric');
    expect(useAppStore.getState().mix.citricSource).toBe('citric');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('lemon');
  });

  test('setGelCitricSource only changes the gel source', () => {
    useAppStore.getState().setGelCitricSource('lime');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('lime');
    expect(useAppStore.getState().mix.citricSource).toBe('lemon');
  });

  test('resetMix restores both sources to lemon', () => {
    useAppStore.getState().setCitricSource('citric');
    useAppStore.getState().setGelCitricSource('lime');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.citricSource).toBe('lemon');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('lemon');
  });
});

describe('ratio setters', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  test('defaults to honey (0.8:1) for both izo and gel', () => {
    expect(useAppStore.getState().mix.ratio).toBe(0.8);
    expect(useAppStore.getState().mix.gelRatio).toBe(0.8);
    expect(useAppStore.getState().mix.ratioPreset).toBe('honey');
    expect(useAppStore.getState().mix.gelRatioPreset).toBe('honey');
  });

  test('setRatio only changes the izo ratio', () => {
    useAppStore.getState().setRatio(1, 'sugar');
    expect(useAppStore.getState().mix.ratio).toBe(1);
    expect(useAppStore.getState().mix.gelRatio).toBe(0.8);
  });

  test('setGelRatio only changes the gel ratio', () => {
    useAppStore.getState().setGelRatio(2, 'iso');
    expect(useAppStore.getState().mix.gelRatio).toBe(2);
    expect(useAppStore.getState().mix.ratio).toBe(0.8);
  });

  test('setGelRatio clamps to the 0.2-10 range', () => {
    useAppStore.getState().setGelRatio(20, 'custom');
    expect(useAppStore.getState().mix.gelRatio).toBe(10);
    useAppStore.getState().setGelRatio(0, 'custom');
    expect(useAppStore.getState().mix.gelRatio).toBe(0.2);
  });

  test('resetMix restores both ratios to honey', () => {
    useAppStore.getState().setRatio(1, 'sugar');
    useAppStore.getState().setGelRatio(2, 'iso');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.ratio).toBe(0.8);
    expect(useAppStore.getState().mix.gelRatio).toBe(0.8);
  });

  test('setRatio stores the preset tag alongside the ratio', () => {
    useAppStore.getState().setRatio(2, 'iso');
    expect(useAppStore.getState().mix.ratioPreset).toBe('iso');
    useAppStore.getState().setRatio(1.3, 'custom');
    expect(useAppStore.getState().mix.ratioPreset).toBe('custom');
  });

  test('setGelRatio stores the preset tag alongside the gel ratio', () => {
    useAppStore.getState().setGelRatio(1, 'sugar');
    expect(useAppStore.getState().mix.gelRatioPreset).toBe('sugar');
  });

  test('resetMix restores ratioPreset/gelRatioPreset to honey', () => {
    useAppStore.getState().setRatio(2, 'iso');
    useAppStore.getState().setGelRatio(1, 'sugar');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.ratioPreset).toBe('honey');
    expect(useAppStore.getState().mix.gelRatioPreset).toBe('honey');
  });
});

describe('persisted mix merge', () => {
  // Simulates a user whose localStorage was written before gelRatio existed: the persisted
  // blob has no gelRatio key at all. merge() should fall back to the current default instead
  // of leaving it undefined — same deep-merge-of-mix behavior citricSource already relies on.
  test('fills in gelRatio for state persisted before the field existed', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const legacyPersistedMix = {
      conc: 8.4,
      gelConc: 60,
      ratio: 2,
      salt: 0.16,
      citric: 0.2,
      gelSalt: 0.4,
      gelCitric: 0.4,
      citricSource: 'citric',
      gelCitricSource: 'citric',
    };
    const merged = merge({ mix: legacyPersistedMix }, currentState) as typeof currentState;
    expect(merged.mix.gelRatio).toBe(currentState.mix.gelRatio);
  });
});

describe('persisted ui merge — the calculator always opens on the plan', () => {
  test('a panel left open last time does not come back', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, panel: 'settings', tab: 'me' } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.panel).toBeNull();
    expect(merged.ui.tab).toBe('plan');
  });
});

describe('persisted ui merge — no overlay survives a reload', () => {
  // Every field here gates a full-screen overlay, and all of them are persisted (there is no
  // partialize on the persist config). Backgrounding a phone with the Mix sheet open flushes
  // it to localStorage on pagehide, so without this reset the next visit — typically the
  // landing's "open the calculator" link — boots straight into that sheet.
  test('the sheets and the chart help modal all come back closed', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      {
        ui: {
          ...currentState.ui,
          mixSheet: true,
          routeSheet: true,
          shopSheet: { editId: 3 },
          chartHelp: true,
        },
      },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.mixSheet).toBe(false);
    expect(merged.ui.routeSheet).toBe(false);
    expect(merged.ui.shopSheet).toBeNull();
    expect(merged.ui.chartHelp).toBe(false);
  });

  // Pointer state is the same class: persisted, but meaningless once the pointer is gone. A
  // drag interrupted by backgrounding the phone stored dragKey, and the bar came back rendered
  // mid-drag — dimmed and highlighted — with nothing to clear it until the next drag.
  test('in-flight pointer state does not come back', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, dragKey: 'f3', hoverKey: 'f2', selKey: 'f1', scrubX: 120 } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.dragKey).toBeNull();
    expect(merged.ui.hoverKey).toBeNull();
    expect(merged.ui.selKey).toBeNull();
    expect(merged.ui.scrubX).toBeNull();
  });

  // The tour only runs on request now, and its restore point lived in memory: after a reload
  // there is nothing to resume and nothing to restore.
  test('a tour interrupted by a reload does not come back', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, tourStep: 2, tourDemoFid: 7, sampleActive: true } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.tourStep).toBeNull();
    expect(merged.ui.tourDemoFid).toBeNull();
    expect(merged.ui.sampleActive).toBe(false);
  });

  // Where the rider is in the first-run flow is progress, not a view: it has to survive.
  test('onboarding progress is restored', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, onboardingVersion: 1, onboardingHint: 2, setupOpen: true } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.onboardingVersion).toBe(1);
    expect(merged.ui.onboardingHint).toBe(2);
    expect(merged.ui.setupOpen).toBe(false);
  });
});

describe('persisted ui merge — autoView is derived, not remembered', () => {
  test('a stale autoView from another device loses to the one computed for this viewport', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, autoView: 'desktop', viewMode: 'auto' } },
      { ...currentState, ui: { ...currentState.ui, autoView: 'mobile' } },
    ) as typeof currentState;
    expect(merged.ui.autoView).toBe('mobile');
    // an explicit user override is a preference and must still survive
    expect(merged.ui.viewMode).toBe('auto');
  });

  test('an explicitly forced viewMode is still restored', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, viewMode: 'desktop' } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.viewMode).toBe('desktop');
  });
});

describe('persisted ui merge — autoTheme is derived, not remembered', () => {
  test('a stale autoTheme from another device loses to the one computed for this session', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, autoTheme: 'dark', themeMode: 'auto' } },
      { ...currentState, ui: { ...currentState.ui, autoTheme: 'light' } },
    ) as typeof currentState;
    expect(merged.ui.autoTheme).toBe('light');
    expect(merged.ui.themeMode).toBe('auto');
  });

  test('an explicitly forced themeMode is still restored', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, themeMode: 'dark' } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.themeMode).toBe('dark');
  });
});

describe('persisted ui merge — HTML-seeded language precedence', () => {
  // Un-stubbing here rather than at the end of each test: an assertion that fails leaves the
  // rest of its test body unrun, so a trailing unstubAllGlobals() would leak a fake `document`
  // into every test after it and turn one honest failure into a cascade of confusing ones.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('the HTML-seeded lang wins over a persisted ui.lang; other ui fields survive', () => {
    vi.stubGlobal('document', { documentElement: { lang: 'pl' } });
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    // xUnit stands in for "an ordinary remembered preference" here. panel and tab used
    // to serve that purpose, but they are deliberately no longer restored — the
    // calculator always opens on the plan.
    const persistedUi = { ...currentState.ui, lang: 'en', viewMode: 'desktop', xUnit: 'h' };
    const merged = merge({ ui: persistedUi }, currentState) as typeof currentState;
    expect(merged.ui.lang).toBe('pl');
    expect(merged.ui.viewMode).toBe('desktop');
    expect(merged.ui.xUnit).toBe('h');
  });

  // Chrome's "always translate this page" rewrites <html lang> to the translation's language,
  // so this attribute is not ours to trust. An unchecked value would be pushed into the URL by
  // nextLangPath() — /es/calculator/ 404s on reload — and written straight back to localStorage.
  test('a language we do not ship is ignored, and the persisted one survives', () => {
    vi.stubGlobal('document', { documentElement: { lang: 'es' } });
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, lang: 'pl' } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.lang).toBe('pl');
  });

  test('an empty <html lang> is ignored too', () => {
    vi.stubGlobal('document', { documentElement: { lang: '' } });
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, lang: 'pl' } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.lang).toBe('pl');
  });

  test('first-ever visit (no persisted state): non-lang ui fields fall back to current defaults, lang is still HTML-seeded', () => {
    vi.stubGlobal('document', { documentElement: { lang: 'pl' } });
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(undefined, currentState) as typeof currentState;
    expect(merged.ui.lang).toBe('pl');
    expect(merged.ui.viewMode).toBe(currentState.ui.viewMode);
    expect(merged.ui.panel).toBe(currentState.ui.panel);
  });
});

describe('migrate: ratioPreset inference (v2 -> v3)', () => {
  test('infers honey from a legacy ratio of 0.8', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { mix: { ratio: 0.8, gelRatio: 2 } };
    const migrated = migrate(legacy, 2) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('honey');
    expect(migrated.mix.gelRatioPreset).toBe('iso');
  });

  test('infers sugar from a legacy ratio of 1', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { mix: { ratio: 1, gelRatio: 1 } };
    const migrated = migrate(legacy, 2) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('sugar');
    expect(migrated.mix.gelRatioPreset).toBe('sugar');
  });

  test('infers custom from an arbitrary legacy ratio', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { mix: { ratio: 1.3, gelRatio: 2 } };
    const migrated = migrate(legacy, 2) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('custom');
  });

  test('leaves an already-tagged ratioPreset untouched', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { mix: { ratio: 0.8, ratioPreset: 'custom', gelRatio: 2 } };
    const migrated = migrate(legacy, 2) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('custom');
  });

  test('does nothing when there is no persisted mix at all', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    expect(migrate({}, 2)).toEqual({});
  });
});

describe('migrate: 1.5:1 preset re-tagging (v3 -> v4)', () => {
  test('re-tags a ratio of 1.5 previously stored as custom', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = {
      mix: { ratio: 1.5, ratioPreset: 'custom', gelRatio: 1.5, gelRatioPreset: 'custom' },
    };
    const migrated = migrate(legacy, 3) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('ratio15');
    expect(migrated.mix.gelRatioPreset).toBe('ratio15');
  });

  test('leaves a genuinely custom ratio (not 1.5) alone', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = {
      mix: { ratio: 1.3, ratioPreset: 'custom', gelRatio: 2, gelRatioPreset: 'iso' },
    };
    const migrated = migrate(legacy, 3) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.mix.ratioPreset).toBe('custom');
    expect(migrated.mix.gelRatioPreset).toBe('iso');
  });
});

describe('share preferences', () => {
  test('shareIncludeWeight defaults to false', () => {
    expect(useAppStore.getState().ui.shareIncludeWeight).toBe(false);
  });

  test('setShareIncludeWeight persists the choice for the next share', () => {
    useAppStore.getState().setShareIncludeWeight(true);
    expect(useAppStore.getState().ui.shareIncludeWeight).toBe(true);
    useAppStore.getState().setShareIncludeWeight(false);
    expect(useAppStore.getState().ui.shareIncludeWeight).toBe(false);
  });

  test('the share panel opens and closes like every other panel', () => {
    useAppStore.getState().openPanel('share');
    expect(useAppStore.getState().ui.panel).toBe('share');
    useAppStore.getState().closePanel();
    expect(useAppStore.getState().ui.panel).toBeNull();
  });
});

describe('autoplanStopRules', () => {
  const shops = [
    { id: 1, at: 40, name: 'Mine' },
    { id: 2, at: 90, name: 'Guess', autoCreated: true },
  ];
  const opts = (stopsMode: 'keepAndAdd' | 'keepOnly' | 'clear') => ({
    stopsMode,
    carriedVesselGids: null,
  });

  test("'Od nowa': none of his, new ones wherever", () => {
    expect(autoplanStopRules({ shops }, opts('clear'))).toEqual({ riderStops: [], newStops: true });
  });

  test("'Dołóż': his stops, not a previous run's, and new ones allowed", () => {
    expect(autoplanStopRules({ shops }, opts('keepAndAdd'))).toEqual({
      riderStops: [40],
      newStops: true,
    });
  });

  test("'Tylko moje': his stops and nothing new", () => {
    expect(autoplanStopRules({ shops }, opts('keepOnly'))).toEqual({
      riderStops: [40],
      newStops: false,
    });
  });

  test("'Bez postojów' — no stops of his own: 'Tylko moje' plans with no stops at all", () => {
    const onlyGuesses = [{ id: 2, at: 90, name: 'Guess', autoCreated: true }];
    expect(autoplanStopRules({ shops: onlyGuesses }, opts('keepOnly'))).toEqual({
      riderStops: [],
      newStops: false,
    });
  });

  test("a previous run's stops count too when they are being kept", () => {
    expect(autoplanStopRules({ shops }, opts('keepOnly'), false).riderStops).toEqual([40, 90]);
  });
});

describe('cola is a stop by default (v5 -> v6, and on import)', () => {
  const cola = { key: 'cola', pl: 'Cola', en: 'Cola', de: 'Cola', it: 'Cola', carbs: 35, ml: 330 };
  const gel = { key: 'gel', pl: 'Żel', en: 'Gel', de: 'Gel', it: 'Gel', carbs: 22 };

  test('a library saved before needsStop gets cola as a stop, and nothing else changes', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const migrated = migrate({ foodLib: [cola, gel] }, 5) as ReturnType<
      typeof useAppStore.getState
    >;
    expect(migrated.foodLib.find((e) => e.key === 'cola')?.needsStop).toBe(true);
    expect(migrated.foodLib.find((e) => e.key === 'gel')?.needsStop).toBeUndefined();
  });

  test('a cola the rider switched off stays off', () => {
    expect(withColaAtStop([{ ...cola, needsStop: false }])[0].needsStop).toBe(false);
  });

  test('a plan file exported before needsStop imports with cola as a stop', () => {
    const data = useAppStore.getState().getSettingsExportData();
    useAppStore.getState().importSettings({ ...data, foodLib: [cola, gel] });
    const lib = useAppStore.getState().foodLib;
    expect(lib.find((e) => e.key === 'cola')?.needsStop).toBe(true);
    expect(lib.find((e) => e.key === 'gel')?.needsStop).toBeUndefined();
  });
});

describe('migrate: tourSeen -> onboardingVersion (v6 -> v7)', () => {
  const migrate = useAppStore.persist.getOptions().migrate!;
  const ui = (v: unknown) => (v as { ui: Record<string, unknown> }).ui;

  test('a rider who saw the tour is on onboarding version 1', () => {
    const migrated = ui(migrate({ ui: { tourSeen: true } }, 6));
    expect(migrated.onboardingVersion).toBe(1);
    expect(migrated).not.toHaveProperty('tourSeen');
  });

  test('a rider who never saw it is on 0', () => {
    expect(ui(migrate({ ui: { tourSeen: false } }, 6)).onboardingVersion).toBe(0);
  });
});
