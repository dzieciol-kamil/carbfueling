import { describe, expect, test } from 'vitest';
import { carbsFill, cph, distanceAtTime, timeAtDistance } from '../fuel';
import type { FoodSelectionEntry } from '../autoplan';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assignCarbs } from './assignCarbs';
import { assertInvariantV1 } from './assignWater';
import { deliveredShare } from './deliveredShare';
import type { Leg, Skeleton, StopNode } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    sport: 'cycling',
    mode: 'route',
    distance: 100,
    speed: 25,
    hours: 0,
    minutes: 0,
    weight: 75,
    preMealCarbs: 0,
    preMealMinutes: 0,
    intensity: 'mid',
    temp: 20,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

const MIX: MixSettings = {
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

function izoBottle(vol: number, gid: string): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water', 'izo'], gelParts: 4 };
}

function gelFlask(vol: number, gid: string): Vessel {
  return { gid, name: 'Flask', vol, allowed: ['gel'], gelParts: 6 };
}

function makeState(route: RouteInput, gear: Vessel[], foodLib: FoodLibEntry[] = []): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib, stops: [] };
}

/** Builds a Skeleton by hand from a list of leg boundaries, so `carbNeedG`/`absorbCapG` can be
 *  picked deliberately instead of reverse-engineered out of `buildSkeleton`'s fluid-driven search —
 *  the same approach `assignWater.test.ts` uses for its non-fluid-derived cases. `hours` is left at
 *  a placeholder since izo's legality math reads `absorbCapG` directly, never `leg.hours` itself. */
function buildHandSkeleton(bounds: number[], carbNeedG: number[], absorbCapG: number[]): Skeleton {
  const legs: Leg[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    legs.push({
      fromKm: bounds[i],
      toKm: bounds[i + 1],
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: carbNeedG[i],
      absorbCapG: absorbCapG[i],
    });
  }
  const stops: StopNode[] = bounds.slice(1, -1).map((km): StopNode => ({ km, origin: 'planned' }));
  return { stops, legs, shortfall: null };
}

const NO_SELECTION: FoodSelectionEntry[] = [];

describe('assignCarbs — izo relay (C4)', () => {
  // W5c-1 (2026-08-24): both tests below rewritten for the duration-sized span model — a service
  // now spans as long as its fill lasts at the ride's rate (`fillG / cph`), not "one vessel per leg,
  // clipped to that leg's span" (the old, all-or-nothing model this task replaces). See
  // `docs/superpowers/specs/2026-08-23-autoplan-v2-subagent-prompts.md` "W5c-1".
  test('relay spans are sized by duration, not clipped to one leg; neither vessel is drained early and carried empty', () => {
    // D=180km, 18 equal 10km legs/stops — dense enough that the relay's own duration-sized turns
    // (well under 10km each, see below) always find a legal next stop before running dry, so this
    // fixture still exercises the autoplanPacing.test.ts shape ("no vessel's last service ends
    // before 80% of D") that the old, leg-clipped model satisfied for free by construction. Generous
    // carbNeedG/absorbCapG so relay is never blocked by C1 or cut short by the total-need ceiling.
    const bounds: number[] = [];
    for (let km = 0; km <= 180; km += 10) bounds.push(km);
    const skeleton = buildHandSkeleton(
      bounds,
      new Array(bounds.length - 1).fill(50),
      new Array(bounds.length - 1).fill(100),
    );
    const route = makeRoute({ distance: 180, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1'), izoBottle(300, 'v2')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services.every((s) => s.content === 'izo')).toBe(true);

    // Every span is sized by duration (fillG / cph at the ride's own speed), independent of the
    // 10km leg width — the exact bug this task fixes (every service used to be exactly one leg
    // wide). The very first service is the clean case (nothing to clip it); later ones match it too,
    // except the very last, which C6 trims short of `carbEndKm` same as any other.
    const fillG = carbsFill({ fid: 0, gid: 'v1', content: 'izo', from: 0, to: 0 }, state.gear, MIX);
    const hours = fillG / cph(route);
    const expectedSpanKm = distanceAtTime(route, timeAtDistance(route, 0) + hours);
    expect(services[0].toKm - services[0].fromKm).toBeCloseTo(expectedSpanKm, 6);
    for (const s of services) {
      expect(s.toKm - s.fromKm).toBeLessThanOrEqual(expectedSpanKm + 1e-6);
      expect(s.toKm - s.fromKm).toBeLessThan(10); // never a whole leg (finding 2's old shape)
    }

    // Relay alternation still holds: v1/v2 trade off, back-to-back at first (S4), then reused.
    expect(services).toHaveLength(18);
    services.forEach((s, i) => expect(s.vesselId).toBe(i % 2 === 0 ? 'v1' : 'v2'));
    for (const gid of ['v1', 'v2']) {
      expect(services.filter((s) => s.vesselId === gid).length).toBeGreaterThan(1);
    }

    // The exact failing autoplanPacing.test.ts shape: no vessel's last service ends before 80% of D.
    const D = 180;
    for (const gid of ['v1', 'v2']) {
      const mine = services.filter((s) => s.vesselId === gid).sort((a, b) => a.toKm - b.toKm);
      const last = mine[mine.length - 1].toKm;
      expect(last).toBeGreaterThan(D * 0.8);
    }

    // C6: no service ever reaches all the way to D (2% gut-drain buffer respected throughout).
    for (const s of services) {
      expect(s.toKm).toBeLessThanOrEqual(D * 0.98 + 1e-6);
    }

    assertInvariantV1(services, skeleton);
  });

  test("V1 holds on the relay output: each vessel's own first fill is unanchored (S4); every reuse is anchored to the stop at its fromKm", () => {
    const bounds = [0, 40, 80, 120];
    const skeleton = buildHandSkeleton(bounds, [40, 40, 40], [80, 80, 80]);
    const route = makeRoute({ distance: 120, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1'), izoBottle(300, 'v2')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(() => assertInvariantV1(services, skeleton)).not.toThrow();

    const byVessel = (gid: string) =>
      services.filter((s) => s.vesselId === gid).sort((a, b) => a.fromKm - b.fromKm);

    // Phase 1 (S4): both vessels' own first fill are laid back-to-back from km 0, unanchored — v2's
    // first turn starts mid-route (not km 0) but is still unanchored, since S4 means "this vessel's
    // own first use", not "whichever service happens to start at km 0".
    expect(byVessel('v1')[0].filledAtStop).toBeNull();
    expect(byVessel('v2')[0].filledAtStop).toBeNull();
    expect(byVessel('v2')[0].fromKm).toBeGreaterThan(0);

    // Phase 2: each vessel's second service is anchored to the stop sitting exactly at its fromKm.
    const v1Second = byVessel('v1')[1];
    expect(v1Second.filledAtStop).toBe(0);
    expect(skeleton.stops[0].km).toBe(v1Second.fromKm);

    const v2Second = byVessel('v2')[1];
    expect(v2Second.filledAtStop).toBe(1);
    expect(skeleton.stops[1].km).toBe(v2Second.fromKm);
  });
});

describe('assignCarbs — C1 hard ceiling', () => {
  // W5c-1 (2026-08-24): rewritten. The old test proved a fill exceeding ONE leg's absorbCapG got
  // skipped outright ("clipped to a leg" — izo-4's real-world 0% bug: 97.5g > 72g on every leg, so
  // nothing was ever placed). The fix prorates a service's delivered share per leg (deliveredShare,
  // same mechanism the gel branch already used), so this test now proves the opposite: a fill bigger
  // than any single leg's cap still gets placed, spanning every leg it needs to, as long as each
  // leg's own *prorated share* stays under that leg's absorbCapG.
  test("a fill bigger than any single leg's absorbCapG still gets placed, prorated across every leg it spans (kills finding 2)", () => {
    // 3 legs of 20km each, absorbCapG=60g on every leg — deliberately below the vessel's own fill.
    const bounds = [0, 20, 40, 60];
    const skeleton = buildHandSkeleton(bounds, [50, 50, 50], [60, 60, 60]);
    const route = makeRoute({ distance: 60, speed: 25 });
    const state = makeState(route, [izoBottle(1050, 'v1')]); // 1050ml @ 8.4% = 88.2g

    const fillG = carbsFill({ fid: 0, gid: 'v1', content: 'izo', from: 0, to: 0 }, state.gear, MIX);
    expect(fillG).toBeGreaterThan(60); // bigger than every leg's own absorbCapG

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services).toHaveLength(1);
    const [s] = services;
    expect(s.content).toBe('izo');
    expect(s.fromKm).toBe(0);
    expect(s.filledAtStop).toBeNull(); // S4: this vessel's own first service

    // Sized by duration, not clipped to one leg — crosses both interior stops (20, 40).
    const hours = fillG / cph(route);
    const expectedToKm = distanceAtTime(route, timeAtDistance(route, 0) + hours);
    expect(s.toKm).toBeCloseTo(expectedToKm, 6);
    expect(s.toKm).toBeGreaterThan(40);

    // C1 still holds: every leg's prorated share — not the whole 88.2g — stays under its own cap.
    skeleton.legs.forEach((leg) => {
      const share = fillG * deliveredShare(s, leg, state.gear, route);
      expect(share).toBeLessThanOrEqual(leg.absorbCapG + 1e-6);
    });

    assertInvariantV1(services, skeleton);
  });
});

describe('assignCarbs — selection sizes the vessel ceiling (C2: real total, not a threshold)', () => {
  const bounds = [0, 40, 80, 120];
  const skeleton = () => buildHandSkeleton(bounds, [40, 40, 40], [100, 100, 100]);
  const route = makeRoute({ distance: 120, speed: 25 });
  const foodLib: FoodLibEntry[] = [{ key: 'meal', pl: '', en: '', carbs: 100 }];

  test('an empty selection leaves the full ride total for vessels — relay covers every leg', () => {
    const state = makeState(route, [izoBottle(300, 'v1')], foodLib); // 25.2g/fill, total need 120g

    const services = assignCarbs(skeleton(), state, []);

    expect(services).toHaveLength(3); // 3 * 25.2 = 75.6g, well under the full 120g total
  });

  test('a selection that already covers the ride total leaves nothing for vessels to add', () => {
    const state = makeState(route, [izoBottle(300, 'v1')], foodLib); // total need 120g
    const selection: FoodSelectionEntry[] = [{ key: 'meal', count: 2 }]; // 200g >= 120g need

    const services = assignCarbs(skeleton(), state, selection);

    expect(services).toHaveLength(0);
  });
});

describe('assignCarbs — gel (one-shot, never relayed)', () => {
  test('a gel vessel gets exactly one continuous service, sized to its own duration, S4-anchored', () => {
    const route = makeRoute({ distance: 150, speed: 25, intensity: 'mid' });
    const bounds = [0, 50, 100, 150];
    const skeleton = buildHandSkeleton(bounds, [50, 50, 50], [200, 200, 200]);
    const state = makeState(route, [gelFlask(250, 'flask')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services).toHaveLength(1);
    const [s] = services;
    expect(s.vesselId).toBe('flask');
    expect(s.content).toBe('gel');
    expect(s.fromKm).toBe(0);
    expect(s.filledAtStop).toBeNull(); // S4: left home with it, no stop implied

    // Sized to exactly how long its carbs are meant to last at the ride's own cph — not stretched,
    // not chopped short.
    const fillG = carbsFill(
      { fid: 0, gid: 'flask', content: 'gel', from: 0, to: 0 },
      state.gear,
      MIX,
    );
    const hours = fillG / cph(route);
    const expectedToKm = distanceAtTime(route, timeAtDistance(route, 0) + hours);
    expect(s.toKm).toBeCloseTo(expectedToKm, 6);
  });

  test('two gel vessels stagger back-to-back — never stacked on top of each other', () => {
    const route = makeRoute({ distance: 200, speed: 25, intensity: 'mid' });
    const bounds = [0, 100, 200];
    // Generous absorbCapG: this test is about staggering, not C1 — that has its own test group.
    const skeleton = buildHandSkeleton(bounds, [80, 80], [500, 500]);
    const state = makeState(route, [gelFlask(250, 'a'), gelFlask(150, 'b')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services).toHaveLength(2);
    const [first, second] = [...services].sort((x, y) => x.fromKm - y.fromKm);
    expect(first.fromKm).toBe(0);
    expect(second.fromKm).toBe(first.toKm); // back-to-back, no overlap
    expect(second.filledAtStop).toBeNull(); // still S4: each vessel's own first (only) use
  });
});
