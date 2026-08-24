import { describe, expect, test } from 'vitest';
import { carbsFill } from '../fuel';
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
  // W5c-1b (2026-08-24): both tests below rewritten again. W5c-1's `fillG / cph` duration span is
  // withdrawn — it fixed izo-4 but broke rides needing a full leg from one bottle (mix-2, izo-5,
  // mix-3). The span is topological instead: a service runs for exactly one leg, from where it
  // starts to the next refill point (the next stop, or `carbEndKm`/`D` on the last leg it reaches).
  // See `docs/superpowers/specs/2026-08-24-w5c1b-measurements.md`.
  test('relay alternates one vessel per leg (span is topological, not duration-sized); neither vessel is drained early and carried empty', () => {
    // D=180km, 18 equal 10km legs/stops — dense enough to exercise the autoplanPacing.test.ts shape
    // ("no vessel's last service ends before 80% of D"). Generous carbNeedG/absorbCapG so relay is
    // never cut short by the total-need ceiling (C1 no longer vetoes placement at all, W5c-1b).
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
    expect(services).toHaveLength(18);

    // Every span is exactly one leg wide (10km) — "a bottle lasts until the next refill point", not
    // a duration formula. Only the very last placed service is shorter, clipped by C6's gut-drain
    // buffer (carbEndKm = 180 * 0.98 = 176.4).
    for (const s of services.slice(0, -1)) {
      expect(s.toKm - s.fromKm).toBe(10);
    }
    const lastService = services[services.length - 1];
    expect(lastService.toKm).toBeCloseTo(180 * 0.98, 6);

    // Relay alternation: v1/v2 trade off every leg, one active vessel at a time.
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

  test("V1 holds on the relay output: each vessel's own first fill is unanchored (S4), wherever it lands; every reuse is anchored to the stop at its leg's start", () => {
    // 4 legs so BOTH vessels demonstrate the full shape: their own first (unanchored) turn, then a
    // reuse (anchored). Generous carbNeedG/absorbCapG so all 4 legs get a turn.
    const bounds = [0, 30, 60, 90, 120];
    const skeleton = buildHandSkeleton(bounds, [100, 100, 100, 100], [200, 200, 200, 200]);
    const route = makeRoute({ distance: 120, speed: 25 });
    const state = makeState(route, [izoBottle(300, 'v1'), izoBottle(300, 'v2')]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(() => assertInvariantV1(services, skeleton)).not.toThrow();

    const byVessel = (gid: string) =>
      services.filter((s) => s.vesselId === gid).sort((a, b) => a.fromKm - b.fromKm);

    // Round robin over legs: leg0 -> v1, leg1 -> v2, leg2 -> v1 (reuse), leg3 -> v2 (reuse). v2's
    // own first use starts mid-route (leg1, km 30) — not km 0 — but is still unanchored: S4 means
    // "this vessel's own first use", not "whichever service happens to start at km 0".
    expect(byVessel('v1')[0].filledAtStop).toBeNull();
    expect(byVessel('v1')[0].fromKm).toBe(0);
    expect(byVessel('v2')[0].filledAtStop).toBeNull();
    expect(byVessel('v2')[0].fromKm).toBeGreaterThan(0);

    // Each vessel's second (reuse) service is anchored to the stop sitting exactly at its fromKm.
    const v1Second = byVessel('v1')[1];
    expect(v1Second.filledAtStop).toBe(1);
    expect(skeleton.stops[1].km).toBe(v1Second.fromKm);

    const v2Second = byVessel('v2')[1];
    expect(v2Second.filledAtStop).toBe(2);
    expect(skeleton.stops[2].km).toBe(v2Second.fromKm);
  });
});

describe('assignCarbs — C1 no longer vetoes placement', () => {
  // W5c-1b (2026-08-24): rewritten again. W5c-1 read "kills finding 2" into this test by having one
  // service span multiple legs; that formula is withdrawn (see the izo-relay describe block above).
  // The actual bug C1's veto caused (izo-4 scoring 0%: 97.5g > every leg's 72g cap, so nothing was
  // ever placed) is fixed differently: C1 stops refusing a service at all. A fill bigger than its
  // own leg's absorbCapG is still placed, one leg wide, and the excess is wasted rather than
  // dropped — `coverage()`'s own integral caps benefit at the need rate, so nothing further is
  // needed here to keep the metric honest.
  test("a fill bigger than a single leg's absorbCapG still gets placed — C1 is no longer a placement veto", () => {
    // 2 legs of 20km, absorbCapG deliberately tiny (5g) — far below the vessel's own fill (88.2g).
    const bounds = [0, 20, 40];
    const skeleton = buildHandSkeleton(bounds, [10, 10], [5, 5]);
    const route = makeRoute({ distance: 40, speed: 25 });
    const state = makeState(route, [izoBottle(1050, 'v1')]); // 1050ml @ 8.4% = 88.2g

    const fillG = carbsFill({ fid: 0, gid: 'v1', content: 'izo', from: 0, to: 0 }, state.gear, MIX);
    expect(fillG).toBeGreaterThan(5); // bigger than the leg's own absorbCapG

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    // Placed anyway. The one fill already exceeds the ride's whole carb total (20g), so no second
    // leg gets a turn — this is the ordinary runningTotal/vesselTargetG break, not a C1 veto.
    expect(services).toHaveLength(1);
    const [s] = services;
    expect(s.content).toBe('izo');
    expect(s.fromKm).toBe(0);
    expect(s.toKm).toBe(20); // exactly one leg wide — span is topological, not duration-sized
    expect(s.filledAtStop).toBeNull(); // S4: this vessel's own first service

    // C1 does not veto: the leg's actual credited share exceeds that leg's own absorbCapG.
    const share = fillG * deliveredShare(s, skeleton.legs[0], state.gear, route);
    expect(share).toBeGreaterThan(skeleton.legs[0].absorbCapG);

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

describe("assignCarbs — gel (fixed dose budget, fills izo's gaps — Ruling B/C, W5c-2)", () => {
  // W5c-2 (2026-08-24): rewritten. The old model treated every gel vessel as ONE continuous stream,
  // staggered back-to-back from a cursor starting at km 0 — the two tests below encoded exactly that
  // ("gets exactly one continuous service, sized to its own duration" / "stagger back-to-back").
  // Ruling B inverts the order (gel now runs after izo, so it can see where izo already reached) and
  // Ruling C replaces the continuous stream with `n` discrete point doses (n = the vessel's own
  // `gelParts`) scattered one at a time into whichever leg has the largest remaining deficit. See
  // `docs/superpowers/specs/2026-08-24-w5c2-measurements.md`.

  test('a multi-part flask scatters its doses by leg deficit, not evenly and not from km 0', () => {
    // 4 legs of 40km; leg2 needs far more than its siblings (100g vs 10g each) — the greedy exhausts
    // leg2's deficit before touching anything else, then splits the remaining two doses between
    // leg0 and leg1 (tied at 10g each; the earliest leg wins ties).
    const bounds = [0, 40, 80, 120, 160];
    const skeleton = buildHandSkeleton(bounds, [10, 10, 100, 10], [500, 500, 500, 500]);
    const route = makeRoute({ distance: 160, speed: 25 });
    const state = makeState(route, [gelFlask(250, 'flask')]); // 250ml @ gelConc 60 = 150g, 6 doses of 25g each

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    expect(services).toHaveLength(1);
    const [s] = services;
    expect(s.vesselId).toBe('flask');
    expect(s.content).toBe('gel');
    expect(s.filledAtStop).toBeNull(); // S2: filled at home, never refilled

    // Hand-computed dose order: 1-4 exhaust leg2's 100g deficit (25g each, landing it at 0g); dose 5
    // ties leg0/leg1/leg3 at 10g and picks leg0 (earliest); dose 6 then picks leg1 (still 10g, now
    // the largest remaining). Position within a leg is `fromKm + span * (seen+1)/(total+1)`, so
    // leg2's four doses spread evenly across [80,120) and leg0/leg1's single doses land at their own
    // midpoint — never at the same km as a sibling dose in the same leg.
    expect(s.pos).toEqual([20, 60, 88, 96, 104, 112]);
    expect(s.fromKm).toBe(20); // the envelope, pos[0]..pos[n-1] — not "where I drink"
    expect(s.toKm).toBe(112);

    assertInvariantV1(services, skeleton);
  });

  test('gel fills the leg izo left thin — not a restart from km 0', () => {
    // izo covers leg0 only (its vesselTargetG break fires right after, since the food selection
    // nets most of the ride's total out of the vessel budget) — leg1 is left with the whole deficit
    // for gel's 6 doses to find.
    const bounds = [0, 80, 160];
    const skeleton = buildHandSkeleton(bounds, [80, 80], [500, 500]);
    const route = makeRoute({ distance: 160, speed: 25 });
    const foodLib: FoodLibEntry[] = [{ key: 'meal', pl: '', en: '', carbs: 80 }];
    const state = makeState(route, [izoBottle(1000, 'v1'), gelFlask(300, 'g')], foodLib);
    const selection: FoodSelectionEntry[] = [{ key: 'meal', count: 1 }]; // nets vesselTargetG to 80g

    const services = assignCarbs(skeleton, state, selection);

    const izoServices = services.filter((s) => s.content === 'izo');
    expect(izoServices).toHaveLength(1);
    expect(izoServices[0]).toMatchObject({ fromKm: 0, toKm: 80 }); // vesselTargetG break after leg0

    const gelServices = services.filter((s) => s.content === 'gel');
    expect(gelServices).toHaveLength(1);
    const [gel] = gelServices;
    expect(gel.pos).toHaveLength(6);
    const inLeg0 = gel.pos!.filter((x) => x < 80).length;
    const inLeg1 = gel.pos!.filter((x) => x >= 80).length;
    // Most doses land in leg1, which izo never reached — not split evenly, and not clustered at km 0
    // the way the old cursor-from-0 model would have placed them.
    expect(inLeg1).toBeGreaterThan(inLeg0);
    expect(inLeg0).toBeGreaterThan(0); // some spillover once leg1's own deficit dips low enough

    assertInvariantV1(services, skeleton);
  });

  test('a single-part flask keeps the old continuous model (trap: pos is meaningless when gelParts rounds to 1)', () => {
    // fracFill's n<=1 branch ignores `pos` entirely and delivers continuously over [from, to], so a
    // zero-width envelope here would just get dropped by tidy's degenerate-span guard. This vessel's
    // own gelParts is 1, so it must stay on the pre-W5c-2 continuous model — just starting wherever
    // izo left the largest deficit (Ruling B) instead of always at km 0.
    const bounds = [0, 60, 120];
    const skeleton = buildHandSkeleton(bounds, [60, 60], [500, 500]);
    const route = makeRoute({ distance: 120, speed: 25 });
    const oneDoseFlask: Vessel = {
      gid: 'flask',
      name: 'Flask',
      vol: 100,
      allowed: ['gel'],
      gelParts: 1,
    };
    // izoBottle(2000) @ 8.4% = 168g: bigger than leg0's 60g need alone, but the relay's own
    // vesselTargetG break (120g ride total) stops it from ever reaching leg1.
    const state = makeState(route, [izoBottle(2000, 'v1'), oneDoseFlask]);

    const services = assignCarbs(skeleton, state, NO_SELECTION);

    const gelServices = services.filter((s) => s.content === 'gel');
    expect(gelServices).toHaveLength(1);
    const [gel] = gelServices;
    expect(gel.pos).toBeUndefined(); // n<=1: no envelope, just a continuous span
    expect(gel.filledAtStop).toBeNull();
    expect(gel.fromKm).toBe(60); // starts at leg1, which izo never reached
    expect(gel.toKm).toBeGreaterThan(60);

    assertInvariantV1(services, skeleton);
  });
});
