import { describe, expect, test } from 'vitest';
import { fracFill, timeAtDistance } from '../fuel';
import type { Fill, MixSettings, PlanState, RouteInput, Vessel } from '../types';
import { assignWater } from './assignWater';
import { deliveredShare } from './deliveredShare';
import type { Leg, Service } from './types';

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

function dualVessel(vol: number, gid: string): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water', 'izo', 'gel'], gelParts: 1 };
}

function water(vol: number, gid: string): Vessel {
  return { gid, name: 'Bidon', vol, allowed: ['water'], gelParts: 1 };
}

function gelFlask(vol: number, gid: string, gelParts: number): Vessel {
  return { gid, name: 'Flask', vol, allowed: ['gel'], gelParts };
}

function makeState(route: RouteInput, gear: Vessel[]): PlanState {
  return { route, mix: MIX, gear, fills: [], foods: [], foodLib: [], stops: [] };
}

// A short, steep ramp in the first ~13% of the route, flat afterward — real gradient, not the
// synthetic terrain used when useGpx is on with no track.
const HILLY_TRACK = { id: 1, ele: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000] };

describe('deliveredShare', () => {
  test('matches fracFill at the leg boundaries exactly, for a continuous (izo) service', () => {
    const route = makeRoute({ distance: 150, useGpx: true, gpxTrack: HILLY_TRACK });
    const gear = [dualVessel(900, 'v')];
    const service: Service = {
      vesselId: 'v',
      fromKm: 0,
      toKm: 60,
      content: 'izo',
      filledAtStop: null,
    };
    const leg: Leg = { fromKm: 0, toKm: 20, hours: 1, fluidNeedMl: 0, carbNeedG: 0, absorbCapG: 0 };

    const fill: Fill = { fid: 0, gid: 'v', content: 'izo', from: 0, to: 60 };
    const expected = fracFill(fill, 20, gear, route) - fracFill(fill, 0, gear, route);

    expect(deliveredShare(service, leg, gear, route)).toBeCloseTo(expected, 12);
  });

  test('a leg with no km overlap with the service delivers exactly 0', () => {
    const route = makeRoute({ distance: 150, useGpx: true, gpxTrack: HILLY_TRACK });
    const gear = [dualVessel(900, 'v')];
    const service: Service = {
      vesselId: 'v',
      fromKm: 0,
      toKm: 60,
      content: 'izo',
      filledAtStop: null,
    };
    const leg: Leg = {
      fromKm: 60,
      toKm: 150,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };

    expect(deliveredShare(service, leg, gear, route)).toBe(0);
  });

  test('a leg that fully contains the service delivers exactly 1', () => {
    const route = makeRoute({ distance: 150, useGpx: true, gpxTrack: HILLY_TRACK });
    const gear = [dualVessel(900, 'v')];
    const service: Service = {
      vesselId: 'v',
      fromKm: 10,
      toKm: 30,
      content: 'izo',
      filledAtStop: null,
    };
    const leg: Leg = {
      fromKm: 0,
      toKm: 150,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };

    expect(deliveredShare(service, leg, gear, route)).toBeCloseTo(1, 12);
  });

  test('bug (a): on a real gradient, the time-based share and the fracFill (effort) share genuinely diverge', () => {
    // This is the exact fixture the old legOverlapHours() would have gotten wrong: a climb inside
    // the service's span means gradEffort (fracFill's basis) and timeWeight (the old basis) disagree
    // on how much of the fill's load a leg boundary sitting mid-climb should get.
    const route = makeRoute({ distance: 150, useGpx: true, gpxTrack: HILLY_TRACK });
    const gear = [dualVessel(900, 'v')];
    const service: Service = {
      vesselId: 'v',
      fromKm: 0,
      toKm: 60,
      content: 'izo',
      filledAtStop: null,
    };
    const leg: Leg = { fromKm: 0, toKm: 20, hours: 1, fluidNeedMl: 0, carbNeedG: 0, absorbCapG: 0 };

    const hours = timeAtDistance(route, service.toKm) - timeAtDistance(route, service.fromKm);
    const overlapH = timeAtDistance(route, leg.toKm) - timeAtDistance(route, leg.fromKm);
    const oldTimeBasedShare = overlapH / hours;

    const correctShare = deliveredShare(service, leg, gear, route);

    // Both readings are real, positive fractions — and they disagree by more than 10%, so this
    // fixture actually exercises the divergence rather than accidentally landing on flat terrain.
    expect(correctShare).toBeGreaterThan(0);
    expect(oldTimeBasedShare).toBeGreaterThan(0);
    const relativeError = Math.abs(oldTimeBasedShare - correctShare) / correctShare;
    expect(relativeError).toBeGreaterThan(0.1);
  });

  test('bug (b): gel is delivered in discrete doses, not a continuous ratio — a leg between two doses gets exactly 0, even though it spatially overlaps the service', () => {
    const route = makeRoute({ distance: 100, useGpx: false });
    const gear = [gelFlask(500, 'flask', 6)]; // 6 doses, evenly spaced across the service span
    const service: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 100,
      content: 'gel',
      filledAtStop: null,
    };
    // Doses land at 0, 20, 40, 60, 80, 100. A leg strictly between two doses (25->35) overlaps the
    // service in km-space but contains no dose position.
    const leg: Leg = {
      fromKm: 25,
      toKm: 35,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };

    expect(deliveredShare(service, leg, gear, route)).toBe(0);
  });

  test('bug (b): a leg landing exactly on a dose position gets that dose credited, not a distance-proportional slice', () => {
    const route = makeRoute({ distance: 100, useGpx: false });
    const gear = [gelFlask(500, 'flask', 6)]; // doses at 0, 20, 40, 60, 80, 100
    const service: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 100,
      content: 'gel',
      filledAtStop: null,
    };
    const leg: Leg = {
      fromKm: 15,
      toKm: 20,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };

    // A distance-proportional (old, wrong) reading would give 5/100 = 5%. The real delivery is one
    // whole dose (1/6) landing exactly at km 20.
    expect(deliveredShare(service, leg, gear, route)).toBeCloseTo(1 / 6, 12);
  });

  test('a gel service with explicit non-uniform dose positions is prorated against those real positions, not an evenly-spaced fallback', () => {
    const route = makeRoute({ distance: 100, useGpx: false });
    const gear = [gelFlask(500, 'flask', 6)]; // 6 doses
    // 5 of 6 doses bunched in the envelope's first third (3,6,9,12,15 km); the 6th sits at the
    // envelope's far end (90 km) — mirroring how assignCarbs.ts sets toKm to the last dose's
    // position. Evenly spacing 6 doses across [0,90] (the fallback deliveredShare used before it
    // carried `pos` through) would put them at 0,18,36,54,72,90 instead — a materially different
    // layout, so this fixture actually exercises the fix rather than coincidentally landing on a
    // layout the fallback would also produce.
    const pos = [3, 6, 9, 12, 15, 90];
    const service: Service = {
      vesselId: 'flask',
      fromKm: 0,
      toKm: 90,
      content: 'gel',
      filledAtStop: null,
      pos,
    };
    const front: Leg = {
      fromKm: 0,
      toKm: 45,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };
    const back: Leg = {
      fromKm: 45,
      toKm: 90,
      hours: 1,
      fluidNeedMl: 0,
      carbNeedG: 0,
      absorbCapG: 0,
    };

    // By hand from `pos`: the front half [0,45) contains doses at 3,6,9,12,15 -> 5/6. The back
    // half [45,90] contains only the dose at 90 -> 1/6.
    const frontShare = deliveredShare(service, front, gear, route);
    const backShare = deliveredShare(service, back, gear, route);

    expect(frontShare).toBeCloseTo(5 / 6, 12);
    expect(backShare).toBeCloseTo(1 / 6, 12);
    expect(frontShare + backShare).toBeCloseTo(1, 12);
  });

  test("bug (a), end to end: assignWater's P3 credit uses the fracFill share, not elapsed time, so a leg the old basis would have (wrongly) called covered still gets a top-up", () => {
    const route = makeRoute({ distance: 150, useGpx: true, gpxTrack: HILLY_TRACK });
    const gear = [dualVessel(900, 'carb'), water(500, 'spare')];
    const state = makeState(route, gear);
    const carbs: Service[] = [
      { vesselId: 'carb', fromKm: 0, toKm: 60, content: 'izo', filledAtStop: null },
    ];
    const legFrom = 0;
    const legTo = 20;

    // Derive both readings the same way the two implementations would have, then pick a floor
    // strictly between them — so the test fails if assignWater silently reverts to the time basis.
    const hours = timeAtDistance(route, 60) - timeAtDistance(route, 0);
    const overlapH = timeAtDistance(route, legTo) - timeAtDistance(route, legFrom);
    const oldCarried = 900 * (overlapH / hours);
    const fill: Fill = { fid: 0, gid: 'carb', content: 'izo', from: 0, to: 60 };
    const correctCarried =
      900 * (fracFill(fill, legTo, gear, route) - fracFill(fill, legFrom, gear, route));
    expect(correctCarried).toBeLessThan(oldCarried); // sanity: fixture really does diverge
    const floorMl = (oldCarried + correctCarried) / 2;

    const skeleton = {
      stops: [{ km: legTo, origin: 'planned' as const }],
      legs: [
        {
          fromKm: legFrom,
          toKm: legTo,
          hours: 1,
          fluidNeedMl: floorMl / 0.85,
          carbNeedG: 0,
          absorbCapG: 0,
        },
        { fromKm: legTo, toKm: 150, hours: 1, fluidNeedMl: 0, carbNeedG: 0, absorbCapG: 0 },
      ],
      shortfall: null,
    };

    const services = assignWater(skeleton, state, carbs);

    // Under the old time-based credit (257ml-ish) leg 0 would already clear this floor and open
    // nothing. The correct fracFill-based credit (228ml-ish) falls short, so a top-up must appear.
    const leg0Topups = services.filter((s) => s.fromKm === legFrom && s.toKm === legTo);
    expect(leg0Topups).toHaveLength(1);
    expect(leg0Topups[0].vesselId).toBe('spare');
  });
});
