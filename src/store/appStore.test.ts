import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { hasPlanData, shouldConfirmViewModeChange, useAppStore } from './appStore';
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

  test('reconcilePlan pulls a food marker and a shop stop back too', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      foods: [{ id: 1, key: 'gel', name: 'Gel', carbs: 25, from: 80, to: 80 }],
      shops: [{ id: 1, at: 95, name: 'Shop' }],
    });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    const s = useAppStore.getState();
    expect(s.foods[0].from).toBeLessThanOrEqual(50);
    expect(s.foods[0].to).toBeLessThanOrEqual(50);
    expect(s.shops[0].at).toBeLessThanOrEqual(50);
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

  test('clears pre-existing foods and shops, not just fills', () => {
    useAppStore.getState().addShop();
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.shops).toHaveLength(0);
    expect(s.foods).toHaveLength(0);
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

  // tourSeen is the opposite case: it is a genuine preference, and resetting it would replay
  // the tour on every visit.
  test('but tourSeen is a preference and is still restored', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, tourSeen: true } },
      { ...currentState, ui: { ...currentState.ui, tourSeen: false } },
    ) as typeof currentState;
    expect(merged.ui.tourSeen).toBe(true);
  });

  // The tour is the one overlay that must survive, and it survives as a pair: startTour sets
  // tourSeen at step 0, so dropping the step while keeping tourSeen would leave a first-time
  // visitor who reloaded mid-tour with no tour and no way back to it.
  test('a tour interrupted mid-way resumes where it was', () => {
    const merge = useAppStore.persist.getOptions().merge!;
    const currentState = useAppStore.getState();
    const merged = merge(
      { ui: { ...currentState.ui, tourStep: 2, tourSeen: true } },
      currentState,
    ) as typeof currentState;
    expect(merged.ui.tourStep).toBe(2);
    expect(merged.ui.tourSeen).toBe(true);
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
