import { describe, expect, test } from 'vitest';
import { carbsFill, cph, distanceAtTime, timeAtDistance } from '../fuel';
import type { FoodSelectionEntry } from '../autoplan';
import type { FoodLibEntry, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assignCarbs } from './assignCarbs';
import { assertInvariantV1 } from './assignWater';
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
  test('two izo vessels alternate leg by leg; neither is drained early and carried empty', () => {
    // D=180km, 6 equal 30km legs, 5 stops at 30/60/90/120/150. Two 300ml/8.4% bottles
    // (carbsFillOf = 25.2g each). carbNeedG/absorbCapG set generously so relay is never blocked or
    // cut short by C1 or by the total-need ceiling (6 * 25.2 = 151.2g, well under the 300g budget).
    const bounds = [0, 30, 60, 90, 120, 150, 180];
    const skeleton = buildHandSkeleton(
      bounds,
      new Array(6).fill(50), // carbNeedG per leg -> total 300g
      new Array(6).fill(100), // absorbCapG per leg, plenty of headroom
    );
    const route = makeRoute({ distance: 180, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1'), izoBottle(300, 'v2')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services).toHaveLength(6); // every leg gets a carb service (budget never runs out)
    expect(services.every((s) => s.content === 'izo')).toBe(true);

    // Alternation: v1 on legs 0/2/4, v2 on legs 1/3/5.
    expect(services.map((s) => s.vesselId)).toEqual(['v1', 'v2', 'v1', 'v2', 'v1', 'v2']);

    // Relay, not sequential-cursor: each vessel is reused, not spent once and abandoned.
    for (const gid of ['v1', 'v2']) {
      const mine = services.filter((s) => s.vesselId === gid);
      expect(mine.length).toBeGreaterThan(1);
    }

    // The exact failing autoplanPacing.test.ts shape: no vessel's last service ends before 80% of D.
    const D = 180;
    for (const gid of ['v1', 'v2']) {
      const mine = services.filter((s) => s.vesselId === gid).sort((a, b) => a.toKm - b.toKm);
      const last = mine[mine.length - 1].toKm;
      expect(last).toBeGreaterThan(D * 0.8);
    }

    // C6: the very last service stops short of D itself (2% gut-drain buffer), not stretched to it.
    const finalService = services[services.length - 1];
    expect(finalService.toKm).toBeLessThan(D);
    expect(finalService.toKm).toBeCloseTo(D * 0.98, 6);

    assertInvariantV1(services, skeleton);
  });

  test('V1 holds on the relay output: every reused service is anchored to the stop at its fromKm', () => {
    const bounds = [0, 40, 80, 120];
    const skeleton = buildHandSkeleton(bounds, [40, 40, 40], [80, 80, 80]);
    const route = makeRoute({ distance: 120, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1'), izoBottle(300, 'v2')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(() => assertInvariantV1(services, skeleton)).not.toThrow();
    // Concretely: v1's second service (leg index 2) is anchored to skeleton.stops[1].
    const v1Second = services
      .filter((s) => s.vesselId === 'v1')
      .sort((a, b) => a.fromKm - b.fromKm)[1];
    expect(v1Second.filledAtStop).toBe(1);
    expect(skeleton.stops[1].km).toBe(v1Second.fromKm);
  });
});

describe('assignCarbs — C1 hard ceiling', () => {
  test('a leg whose absorbCapG is below the vessel load is skipped, never overfilled', () => {
    // 3 legs; the middle one's absorbCapG (10g) is far below the vessel's carbsFillOf (25.2g), the
    // outer two (100g) have plenty of room.
    const bounds = [0, 50, 100, 150];
    const skeleton = buildHandSkeleton(bounds, [50, 50, 50], [100, 10, 100]);
    const route = makeRoute({ distance: 150, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1')]); // single vessel, 25.2g/fill

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    // Legs 0 and 2 get a service; the too-tight middle leg (index 1) does not. Leg 2's own service
    // stops at D*0.98=147, not 150 — C6's gut-drain buffer, incidental to this test but still real.
    expect(services).toHaveLength(2);
    expect(services.map((s) => [s.fromKm, s.toKm])).toEqual([
      [0, 50],
      [100, 147],
    ]);

    // Never crosses the ceiling on any leg, including the one that had to be skipped.
    const fillG = carbsFill({ fid: 0, gid: 'v1', content: 'izo', from: 0, to: 0 }, state.gear, MIX);
    skeleton.legs.forEach((leg, i) => {
      const legFrom = bounds[i];
      const legTo = bounds[i + 1];
      const delivered = services
        .filter((s) => s.fromKm >= legFrom && s.toKm <= legTo)
        .reduce((a) => a + fillG, 0);
      expect(delivered).toBeLessThanOrEqual(leg.absorbCapG + 1e-6);
    });

    // Reused on leg 2, correctly anchored to the stop at km 100 (index 1).
    const second = services[1];
    expect(second.filledAtStop).toBe(1);
    expect(skeleton.stops[1].km).toBe(100);

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
