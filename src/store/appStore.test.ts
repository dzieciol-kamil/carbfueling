import { beforeEach, describe, expect, test } from 'vitest';
import { hasPlanData, shouldConfirmViewModeChange, useAppStore } from './appStore';
import type { Fill, RouteInput } from '../domain/types';

function route(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
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
  test('false when route, fills, foods and stops are all default/empty', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], stops: [] })).toBe(false);
  });

  test('true once the route has a distance', () => {
    expect(hasPlanData({ route: route({ distance: 50 }), fills: [], foods: [], stops: [] })).toBe(
      true,
    );
  });

  test('true once a fill exists, even with a default route', () => {
    expect(
      hasPlanData({
        route: route(),
        fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 10 }],
        foods: [],
        stops: [],
      }),
    ).toBe(true);
  });

  test('true once a stop stop exists', () => {
    expect(
      hasPlanData({
        route: route(),
        fills: [],
        foods: [],
        stops: [{ id: 1, at: 40, name: 'Stop' }],
      }),
    ).toBe(true);
  });
});

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('setMode reconciling existing plan items', () => {
  test('pulls a fill back onto the route when switching to time mode shrinks the domain', () => {
    useAppStore.setState({
      route: route({ mode: 'route', distance: 100, hours: 1, minutes: 0 }),
      fills: [{ fid: 1, gid: 'g1', content: 'water', from: 70, to: 90 }],
    });
    useAppStore.getState().setMode('time'); // dist() in time mode = round(hours*10) = 10
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 0, to: 10 });
  });
});

describe('setDistance (live typing) vs reconcilePlan (commit)', () => {
  test('setDistance alone does not touch existing fills, even once the new distance no longer fits them', () => {
    // This mirrors typing a new distance character by character: each keystroke calls
    // setDistance with a transient value before the field settles. Fills must not be
    // destructively clamped against those in-progress numbers.
    const fills = [{ fid: 1, gid: 'g1', content: 'water' as const, from: 70, to: 90 }];
    useAppStore.setState({ route: route({ distance: 100 }), fills });
    useAppStore.getState().setDistance(50);
    expect(useAppStore.getState().fills[0]).toEqual(fills[0]);
  });

  test('reconcilePlan pulls a fill back onto the route once the smaller distance is committed', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      fills: [{ fid: 1, gid: 'g1', content: 'water', from: 70, to: 90 }],
    });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 30, to: 50 });
  });

  test('reconcilePlan pulls a food marker and a stop stop back too', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      foods: [{ id: 1, key: 'gel', name: 'Gel', carbs: 25, from: 80, to: 80 }],
      stops: [{ id: 1, at: 95, name: 'Stop' }],
    });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    const s = useAppStore.getState();
    expect(s.foods[0].from).toBeLessThanOrEqual(50);
    expect(s.foods[0].to).toBeLessThanOrEqual(50);
    expect(s.stops[0].at).toBeLessThanOrEqual(50);
  });

  test('reconcilePlan leaves items untouched when the distance still fits them', () => {
    const fills = [{ fid: 1, gid: 'g1', content: 'water' as const, from: 10, to: 20 }];
    useAppStore.setState({ route: route({ distance: 100 }), fills });
    useAppStore.getState().setDistance(80);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0]).toEqual(fills[0]);
  });
});

describe('tour lifecycle', () => {
  test('startTour opens at step 0 and marks tourSeen', () => {
    useAppStore.getState().startTour();
    const ui = useAppStore.getState().ui;
    expect(ui.tourStep).toBe(0);
    expect(ui.tourSeen).toBe(true);
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
  test('sets a demo route and adds one fill on the first vessel', () => {
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.route.distance).toBe(90);
    expect(s.route.speed).toBe(28);
    expect(s.fills).toHaveLength(1);
    expect(s.fills[0].gid).toBe('g1');
    expect(s.ui.tourDemoFid).toBe(s.fills[0].fid);
  });

  test('is a no-op the second time it is called', () => {
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().loadTourDemoData();
    expect(useAppStore.getState().fills).toHaveLength(1);
  });

  test('replacing the plan across separate tour runs does not accumulate fills', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().startTour(); // resets tourDemoFid, simulating a footer replay
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.fills).toHaveLength(1);
    expect(s.fills[0].fid).toBe(s.ui.tourDemoFid);
  });

  test('clears pre-existing foods and stops, not just fills', () => {
    useAppStore.getState().addStop();
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.stops).toHaveLength(0);
    expect(s.foods).toHaveLength(0);
  });
});

describe('applyAutoplan', () => {
  test('replaces fills/foods, appends new stops, and advances the fid/stop id counters', () => {
    useAppStore.setState({
      route: route({ distance: 300, speed: 25 }),
      fills: [{ fid: 999, gid: 'g1', content: 'water', from: 0, to: 10 }],
      foods: [],
      stops: [{ id: 1, at: 5, name: 'Existing' }],
    });
    const before = useAppStore.getState();
    const beforeFid = before.nextFid;
    const beforeStopId = before.nextStopId;

    useAppStore.getState().applyAutoplan([], false);

    const after = useAppStore.getState();
    expect(after.fills.every((f) => f.fid >= beforeFid)).toBe(true);
    expect(after.fills.some((f) => f.fid === 999)).toBe(false); // old fill replaced
    expect(after.stops.some((s) => s.id === 1 && s.name === 'Existing')).toBe(true); // preserved
    expect(after.nextFid).toBeGreaterThan(beforeFid);
    if (after.stops.length > before.stops.length) {
      expect(after.nextStopId).toBeGreaterThan(beforeStopId);
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
      stops: [],
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
      stops: [],
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
      stops: [],
    });

    useAppStore.getState().applyAutoplan([], false);

    const after = useAppStore.getState();
    expect(after.stops.length).toBeGreaterThan(0);
    expect(after.stops.every((s) => s.autoCreated === true)).toBe(true);
  });

  describe('removePreviousAutoStops toggle', () => {
    // A manual stop id far outside the auto-assigned range (which starts at nextStopId, here
    // 501) so it can never collide with an id the store hands out to an autoplan-created stop.
    function setupWithAutoStopsAndOneManualStop() {
      useAppStore.setState({
        route: route({ distance: 300, speed: 25 }),
        fills: [],
        foods: [],
        stops: [{ id: 1, at: 40, name: 'Manual stop' }],
        nextStopId: 501,
      });
      // First run creates at least one autoCreated stop to build on top of.
      useAppStore.getState().applyAutoplan([], false);
      const s = useAppStore.getState();
      expect(s.stops.some((sh) => sh.autoCreated)).toBe(true);
      expect(s.stops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
    }

    test('false: a second run keeps prior autoplan stops and adds the new ones', () => {
      setupWithAutoStopsAndOneManualStop();
      const before = useAppStore.getState();
      const priorAutoStopIds = before.stops.filter((sh) => sh.autoCreated).map((sh) => sh.id);

      // Grow the route so the second run needs refill points beyond what the first run's
      // stops already cover — otherwise planIzoRefills would legitimately reuse the existing
      // stops and add none, which wouldn't exercise the "adds new ones" half of this test.
      useAppStore.setState({ route: route({ distance: 600, speed: 25 }) });
      useAppStore.getState().applyAutoplan([], false);

      const after = useAppStore.getState();
      expect(after.stops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
      for (const id of priorAutoStopIds) {
        expect(after.stops.some((sh) => sh.id === id)).toBe(true);
      }
      expect(after.stops.filter((sh) => sh.autoCreated).length).toBeGreaterThan(
        priorAutoStopIds.length,
      );
    });

    test('true: a second run removes prior autoplan stops but never a manually-added one', () => {
      setupWithAutoStopsAndOneManualStop();
      const before = useAppStore.getState();
      const priorAutoStopIds = before.stops.filter((sh) => sh.autoCreated).map((sh) => sh.id);
      expect(priorAutoStopIds.length).toBeGreaterThan(0);

      useAppStore.getState().applyAutoplan([], true);

      const after = useAppStore.getState();
      expect(after.stops.some((sh) => sh.id === 1 && sh.name === 'Manual stop')).toBe(true);
      for (const id of priorAutoStopIds) {
        expect(after.stops.some((sh) => sh.id === id)).toBe(false);
      }
      // The new run still needs stops at the same route positions, so it recreates them
      // (fresh ids) rather than leaving the rider with none.
      expect(after.stops.some((sh) => sh.autoCreated)).toBe(true);
    });

    /**
     * A suggestion the rider edits stops being a suggestion.
     *
     * Autoplan guesses a kilometre; the rider drags it onto the shop he knows is there and types
     * its name. From then on it is his, and the cleanup that clears "previously suggested stops"
     * — pre-ticked in the dialog — has no business deleting it.
     */
    test('a stop the rider renames or moves stops counting as autoplan’s', () => {
      useAppStore.setState({
        stops: [
          { id: 1, at: 40, name: 'Postój', autoCreated: true },
          { id: 2, at: 80, name: 'Postój', autoCreated: true },
        ],
      });

      useAppStore.getState().updateStop(1, { name: 'Żabka za mostem' });
      useAppStore.getState().updateStop(2, { at: 83 });

      const after = useAppStore.getState();
      expect(after.stops.find((sh) => sh.id === 1)?.autoCreated).toBeFalsy();
      expect(after.stops.find((sh) => sh.id === 2)?.autoCreated).toBeFalsy();
    });

    test('an adopted stop survives the cleanup that wipes the rest', () => {
      setupWithAutoStopsAndOneManualStop();
      const adopted = useAppStore.getState().stops.find((sh) => sh.autoCreated)!;
      useAppStore.getState().updateStop(adopted.id, { name: 'Źródełko' });

      useAppStore.getState().applyAutoplan([], true);

      const after = useAppStore.getState();
      expect(after.stops.some((sh) => sh.id === adopted.id && sh.name === 'Źródełko')).toBe(true);
    });
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

  test('stop sheet opens with an edit target and closes to null', () => {
    useAppStore.getState().openStopSheet(7);
    expect(useAppStore.getState().ui.stopSheet).toEqual({ editId: 7 });
    useAppStore.getState().openStopSheet(null);
    expect(useAppStore.getState().ui.stopSheet).toEqual({ editId: null });
    useAppStore.getState().closeStopSheet();
    expect(useAppStore.getState().ui.stopSheet).toBeNull();
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

  test('defaults to citric acid for both izo and gel', () => {
    expect(useAppStore.getState().mix.citricSource).toBe('citric');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('citric');
  });

  test('setCitricSource only changes the izo source', () => {
    useAppStore.getState().setCitricSource('lemon');
    expect(useAppStore.getState().mix.citricSource).toBe('lemon');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('citric');
  });

  test('setGelCitricSource only changes the gel source', () => {
    useAppStore.getState().setGelCitricSource('lime');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('lime');
    expect(useAppStore.getState().mix.citricSource).toBe('citric');
  });

  test('resetMix restores both sources to citric acid', () => {
    useAppStore.getState().setCitricSource('lemon');
    useAppStore.getState().setGelCitricSource('lime');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.citricSource).toBe('citric');
    expect(useAppStore.getState().mix.gelCitricSource).toBe('citric');
  });
});

describe('ratio setters', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  test('defaults to 2:1 for both izo and gel', () => {
    expect(useAppStore.getState().mix.ratio).toBe(2);
    expect(useAppStore.getState().mix.gelRatio).toBe(2);
  });

  test('setRatio only changes the izo ratio', () => {
    useAppStore.getState().setRatio(1, 'sugar');
    expect(useAppStore.getState().mix.ratio).toBe(1);
    expect(useAppStore.getState().mix.gelRatio).toBe(2);
  });

  test('setGelRatio only changes the gel ratio', () => {
    useAppStore.getState().setGelRatio(0.8, 'honey');
    expect(useAppStore.getState().mix.gelRatio).toBe(0.8);
    expect(useAppStore.getState().mix.ratio).toBe(2);
  });

  test('setGelRatio clamps to the 0.2-10 range', () => {
    useAppStore.getState().setGelRatio(20, 'custom');
    expect(useAppStore.getState().mix.gelRatio).toBe(10);
    useAppStore.getState().setGelRatio(0, 'custom');
    expect(useAppStore.getState().mix.gelRatio).toBe(0.2);
  });

  test('resetMix restores both ratios to 2:1', () => {
    useAppStore.getState().setRatio(1, 'sugar');
    useAppStore.getState().setGelRatio(0.8, 'honey');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.ratio).toBe(2);
    expect(useAppStore.getState().mix.gelRatio).toBe(2);
  });

  test('setRatio stores the preset tag alongside the ratio', () => {
    useAppStore.getState().setRatio(0.8, 'honey');
    expect(useAppStore.getState().mix.ratioPreset).toBe('honey');
    useAppStore.getState().setRatio(1.3, 'custom');
    expect(useAppStore.getState().mix.ratioPreset).toBe('custom');
  });

  test('setGelRatio stores the preset tag alongside the gel ratio', () => {
    useAppStore.getState().setGelRatio(1, 'sugar');
    expect(useAppStore.getState().mix.gelRatioPreset).toBe('sugar');
  });

  test('resetMix restores ratioPreset/gelRatioPreset to iso', () => {
    useAppStore.getState().setRatio(0.8, 'honey');
    useAppStore.getState().setGelRatio(1, 'sugar');
    useAppStore.getState().resetMix();
    expect(useAppStore.getState().mix.ratioPreset).toBe('iso');
    expect(useAppStore.getState().mix.gelRatioPreset).toBe('iso');
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

/**
 * The word changed; the rider's data must not.
 *
 * A marker on the route is a stop — a shop is only one thing it can be — so the field is `stops`
 * now. Every rider already has one called `shops` in his browser, holding the places he checked on
 * a map, and a rename that quietly drops them would be the worst possible way to fix a name.
 */
describe('migrate: shops -> stops (v3 -> v4)', () => {
  test("carries the rider's stops and the id counter over to the new names", () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = {
      shops: [{ id: 7, at: 42, name: 'Żabka' }],
      nextShopId: 8,
    };
    const migrated = migrate(legacy, 3) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops).toEqual([{ id: 7, at: 42, name: 'Żabka' }]);
    expect(migrated.nextStopId).toBe(8);
    expect((migrated as unknown as { shops?: unknown }).shops).toBeUndefined();
  });

  test('a rider who never placed one is left alone — the store default fills in', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    expect(migrate({}, 3)).toEqual({});
  });

  test('rescues stops even from state already stamped with the new version', () => {
    // What a rider ends up with if a build renames the field before the migration lands.
    const migrate = useAppStore.persist.getOptions().migrate!;
    const stranded = { stops: [], shops: [{ id: 4, at: 101, name: 'Żabka' }], nextShopId: 5 };
    const migrated = migrate(stranded, 4) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops).toEqual([{ id: 4, at: 101, name: 'Żabka' }]);
    expect(migrated.nextStopId).toBe(5);
  });

  test('leaves state that already speaks the new name alone', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const current = { stops: [{ id: 1, at: 10, name: 'Postój' }], nextStopId: 2 };
    const migrated = migrate(current, 4) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops).toEqual([{ id: 1, at: 10, name: 'Postój' }]);
    expect(migrated.nextStopId).toBe(2);
  });
});

/**
 * The stops a rider never named still carry the old default as their name.
 *
 * "Sklep"/"Shop" was what the app wrote into every auto-created marker, so it sits in stored data
 * as a label the rider never chose. A stop he *did* name — "Żabka", "źródełko za mostem" — is his
 * words and is left exactly as it is.
 */
describe('migrate: the old default stop name (v5 -> v6)', () => {
  test('an unnamed stop picks up the new default, in the stored language', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { stops: [{ id: 4, at: 101, name: 'Sklep' }], ui: { lang: 'pl' } };
    const migrated = migrate(legacy, 5) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops[0].name).toBe('Postój');
    expect(migrated.stops[0].at).toBe(101);
  });

  test('the English default moves too', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { stops: [{ id: 1, at: 20, name: 'Shop' }], ui: { lang: 'en' } };
    const migrated = migrate(legacy, 5) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops[0].name).toBe('Stop');
  });

  test('a name the rider typed himself is his', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const legacy = { stops: [{ id: 1, at: 20, name: 'Żabka za mostem' }], ui: { lang: 'pl' } };
    const migrated = migrate(legacy, 5) as ReturnType<typeof useAppStore.getState>;
    expect(migrated.stops[0].name).toBe('Żabka za mostem');
  });
});

/**
 * Cola was always something you stop for; the flag saying so came later.
 *
 * Until `needsStop` existed the planner treated the shipped Cola like a bar in a jersey pocket and
 * put it wherever the carbs were due. Riders who already have it stored keep that entry forever, so
 * the flag has to reach them too — but only where the entry is still exactly what the app shipped.
 * A Cola the rider retuned is his product, and a stop he never asked for is not a fix.
 */
describe('the shipped food library', () => {
  test('marks Cola as something you stop for', () => {
    const cola = useAppStore.getState().foodLib.find((f) => f.key === 'cola');
    expect(cola?.needsStop).toBe(true);
  });

  test('leaves the pocketable products carried', () => {
    const lib = useAppStore.getState().foodLib;
    for (const key of ['gel', 'chew', 'banana']) {
      expect(lib.find((f) => f.key === key)?.needsStop).toBeUndefined();
    }
  });
});

describe('migrate: cola needs a stop (v6 -> v7)', () => {
  const stockCola = { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330 };

  function migrateFoodLib(foodLib: unknown[], version = 6) {
    const migrate = useAppStore.persist.getOptions().migrate!;
    const migrated = migrate({ foodLib }, version) as ReturnType<typeof useAppStore.getState>;
    return migrated.foodLib;
  }

  test('the untouched shipped Cola picks up the flag', () => {
    expect(migrateFoodLib([stockCola])[0].needsStop).toBe(true);
  });

  test('leaves every other product alone', () => {
    const gel = { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 };
    const lib = migrateFoodLib([gel, stockCola]);
    expect(lib[0]).toEqual(gel);
    expect(lib[1].needsStop).toBe(true);
  });

  test('a Cola the rider renamed is his own product', () => {
    const lib = migrateFoodLib([{ ...stockCola, pl: 'Cola zero', en: 'Cola zero' }]);
    expect(lib[0].needsStop).toBeUndefined();
  });

  test('a Cola whose carbs or fluid he retuned is his own too', () => {
    expect(migrateFoodLib([{ ...stockCola, carbs: 39 }])[0].needsStop).toBeUndefined();
    expect(migrateFoodLib([{ ...stockCola, ml: 500 }])[0].needsStop).toBeUndefined();
    expect(migrateFoodLib([{ ...stockCola, cont: true, span: 18 }])[0].needsStop).toBeUndefined();
  });

  test('a flag he already set himself is not overwritten', () => {
    expect(migrateFoodLib([{ ...stockCola, needsStop: false }])[0].needsStop).toBe(false);
  });

  test('a rider already on the new version is left alone', () => {
    expect(migrateFoodLib([stockCola], 7)[0].needsStop).toBeUndefined();
  });

  test('does nothing when there is no persisted library at all', () => {
    const migrate = useAppStore.persist.getOptions().migrate!;
    expect(migrate({}, 6)).toEqual({});
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
