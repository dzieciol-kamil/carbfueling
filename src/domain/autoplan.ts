import {
  absCap,
  carbsFill,
  cph,
  dist,
  distanceAtTime,
  prof,
  sweat,
  timeAtDistance,
  totalHours,
} from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  ShopStop,
  Vessel,
} from './types';

export const CONCENTRATED_MIX_THRESHOLD_G_PER_100ML = 15;

/**
 * Hard ceiling on how many izo refill legs autoplan will schedule. Autoplan is a *starting
 * suggestion*, not an optimizer: a dozen "stop and re-mix a bottle" markers on a long ride is
 * unusable advice even when the carb balance technically calls for it. Once the cap (or the
 * spacing rule below) is hit, the remaining balance is left as a visible shortfall — the design
 * explicitly sanctions that ("Running out of distance while still short is an accepted
 * best-effort outcome").
 */
export const MAX_REFILL_LEGS = 3;

/**
 * Minimum distance between the START of two consecutive refill legs. Also the reason refills are
 * *spread* over the remaining route instead of being scheduled the instant a bottle runs dry —
 * back-to-back refills crammed all the carbs into the first couple of hours and left the second
 * half of the route with nothing planned.
 */
export const MIN_REFILL_SPACING_KM = 40;

/**
 * How far ahead of a planned refill position an existing `ShopStop` may sit and still be reused
 * instead of creating a new one. Without a bound, a single far-away shop would drag a refill leg
 * across half the route and leave a huge unfuelled gap behind it.
 */
export const REFILL_SNAP_WINDOW_KM = 40;

/** How far *behind* a planned refill position an existing stop still counts as that leg's stop. */
export const REFILL_SNAP_BACK_KM = 5;

/** Shortest water leg worth emitting a fill for. */
const MIN_WATER_LEG_KM = 1;

/** Safety bound on the fluid-capacity leg walk, so a pathological capacity/sweat ratio can't spin. */
const MAX_FLUID_LEGS = 24;

const MIN_STOP_X_KM = 10;

/**
 * Nothing autoplan creates should sit essentially at the start line — "stop for a refill at km 1"
 * is never useful advice. Scaled down on very short routes so the rule can't swallow the whole
 * ride.
 */
export function minStopX(D: number): number {
  return Math.min(MIN_STOP_X_KM, D * 0.2);
}

export type DraftFill = Omit<Fill, 'fid'>;
export type DraftFood = Omit<FoodItem, 'id' | 'name'>;
export type DraftShop = Omit<ShopStop, 'id' | 'name'>;

export interface FoodSelectionEntry {
  key: string;
  count: number;
}

export interface AutoplanResult {
  fills: DraftFill[];
  foods: DraftFood[];
  newShops: DraftShop[];
}

function isAllowed(v: Vessel, content: Fill['content']): boolean {
  return (v.allowed || []).includes(content);
}

export function shortRideFills(state: PlanState): DraftFill[] {
  const { route, gear } = state;
  const D = dist(route);
  return gear
    .filter((v) => isAllowed(v, 'water'))
    .map((v) => ({ gid: v.gid, content: 'water' as const, from: 0, to: D }));
}

export function bucketVessels(
  gear: Vessel[],
  mix: MixSettings,
): {
  gelVessels: Vessel[];
  izoVessels: Vessel[];
  waterOnly: Vessel[];
  reservedWaterVessel: Vessel | null;
} {
  const gelVessels = gear.filter((v) => isAllowed(v, 'gel'));
  const gelGids = new Set(gelVessels.map((v) => v.gid));
  const nonGel = gear.filter((v) => !gelGids.has(v.gid));

  const izoCandidates = nonGel.filter((v) => isAllowed(v, 'izo'));
  const waterOnly = nonGel.filter((v) => !isAllowed(v, 'izo'));

  let reservedWaterVessel: Vessel | null = null;
  let izoVessels = izoCandidates;
  if (mix.conc > CONCENTRATED_MIX_THRESHOLD_G_PER_100ML && izoCandidates.length > 0) {
    reservedWaterVessel = izoCandidates.reduce((a, b) => (b.vol > a.vol ? b : a));
    izoVessels = izoCandidates.filter((v) => v.gid !== reservedWaterVessel!.gid);
  }

  return { gelVessels, izoVessels, waterOnly, reservedWaterVessel };
}

/**
 * How long one bottle of izo physically lasts before it's empty: you drink it at roughly your
 * sweat rate, not at whatever pace the carb target implies. Without this, a 650ml bidon whose
 * carbs happen to be worth 2.4h of fuelling claimed to cover a 2.4h ride on 650ml of fluid, which
 * both left the vessel with no room for a water fill and planned ~30% hydration.
 *
 * Deliberately conservative: it charges the full sweat rate to the single vessel being drunk,
 * which is exact for the sequential one-bottle-at-a-time model izo uses (and for the app's real
 * default gear), and merely pessimistic — shorter izo legs, more refills — for a rider carrying an
 * extra dedicated water bottle alongside. Gel is not fluid (it's excluded from `planSummary`'s
 * fluid maths and eaten in portions), so gel fills are not clamped.
 */
export function fluidHours(vessel: Vessel, route: RouteInput): number {
  const sweatRate = sweat(route);
  return sweatRate > 0 ? vessel.vol / sweatRate : Infinity;
}

/**
 * `rate` is the g/h this stream is planned to deliver. It defaults to the route's full `cph()`
 * target, but `autoplan` passes a *share* of it when several streams (gel + izo) run in parallel
 * from the start line — two parallel streams each sized at the full target deliver 2× the target
 * rate, which front-loads the whole plan into the first couple of hours and blows past the gut's
 * absorption ceiling. See `plannedStreamRate`.
 */
export function sequentialFills(
  vessels: Vessel[],
  content: 'izo' | 'gel',
  route: RouteInput,
  gear: Vessel[],
  mix: MixSettings,
  rate: number = cph(route),
): { fills: DraftFill[]; totalCarbs: number; endX: number } {
  const D = dist(route);
  const fills: DraftFill[] = [];
  let totalCarbs = 0;
  let startHours = 0;
  let endX = 0;

  vessels.forEach((v) => {
    const carbs = carbsFill({ fid: 0, gid: v.gid, content, from: 0, to: 0 }, gear, mix);
    const carbHours = rate > 0 ? carbs / rate : 0;
    const hours = content === 'izo' ? Math.min(carbHours, fluidHours(v, route)) : carbHours;
    const fromX = distanceAtTime(route, startHours);
    const toX = Math.min(D, distanceAtTime(route, startHours + hours));
    fills.push({ gid: v.gid, content, from: fromX, to: toX });
    totalCarbs += carbs;
    startHours += hours;
    endX = toX;
  });

  return { fills, totalCarbs, endX };
}

/**
 * Schedules izo refill legs to close `balance`, **spread across the remaining route** rather than
 * scheduled back-to-back the instant a bottle empties.
 *
 * Three rules keep the output rider-usable rather than mathematically complete:
 * - at most `MAX_REFILL_LEGS` legs,
 * - at least `MIN_REFILL_SPACING_KM` between consecutive leg starts,
 * - nothing before `minStopX(D)`.
 *
 * Whatever balance those rules leave uncovered is returned as `finalBalance` and shows up as a
 * plain shortfall in the app's normal coverage figures — autoplan does not fabricate refills the
 * rider would never actually make.
 */
export function planIzoRefills(
  route: RouteInput,
  gear: Vessel[],
  mix: MixSettings,
  izoVessels: Vessel[],
  izoStartEndX: number,
  balance: number,
  existingShops: ShopStop[],
  rate: number = cph(route),
): { fills: DraftFill[]; newShops: DraftShop[]; finalBalance: number; stopXs: number[] } {
  const D = dist(route);
  const fills: DraftFill[] = [];
  const newShops: DraftShop[] = [];
  const stopXs: number[] = [];
  const nothing = { fills, newShops, finalBalance: Math.max(0, balance), stopXs };

  if (balance <= 0 || izoVessels.length === 0 || rate <= 0) return nothing;

  const perLegCarbs = izoVessels.reduce(
    (a, v) => a + carbsFill({ fid: 0, gid: v.gid, content: 'izo', from: 0, to: 0 }, gear, mix),
    0,
  );
  if (perLegCarbs <= 0) return nothing;

  const startX = Math.min(D, Math.max(izoStartEndX, minStopX(D)));
  const span = D - startX;
  if (span <= 0) return nothing;

  // Refill legs are spread evenly over the whole route rather than scheduled the moment the
  // previous bottle runs dry: the start-phase bottle is leg 0 at x=0, so `legs` refills sit at
  // D/(legs+1), 2D/(legs+1), … That is the concrete "spread the carbs across the route instead of
  // front-loading them" rule. Consecutive legs are then D/(legs+1) apart, so honouring
  // MIN_REFILL_SPACING_KM means legs <= D / MIN_REFILL_SPACING_KM - 1 (at least one is always
  // allowed — the first has nothing to be spaced from).
  const spacingLimit = Math.max(1, Math.floor(D / MIN_REFILL_SPACING_KM) - 1);
  // Rounded, not ceiled: a refill leg means a real stop and a whole bottle re-mixed, so a deficit
  // worth less than half a bottle is not worth sending the rider into a shop for — that shortfall
  // shows up in the normal coverage figure like any other.
  const legs = Math.min(MAX_REFILL_LEGS, Math.round(balance / perLegCarbs), spacingLimit);
  if (legs <= 0) return nothing;
  const step = D / (legs + 1);

  let remaining = balance;
  // Tracked in hours (not km) so consecutive fills for the same vessel can never overlap: both
  // ends come from the same monotone distanceAtTime() mapping, with no rounding in between.
  let cursorHours = timeAtDistance(route, izoStartEndX);
  let prevStopX = -Infinity;

  for (let i = 0; i < legs && remaining > 0; i++) {
    const targetX = Math.max(startX, step * (i + 1), prevStopX + MIN_REFILL_SPACING_KM);
    // A shop a few km short of the planned position is still that leg's shop — reusing it beats
    // dropping a second marker right next to one the rider already has.
    const earliest = Math.max(startX, targetX - REFILL_SNAP_BACK_KM);
    const reusable = existingShops
      .filter(
        (s) =>
          s.at >= earliest &&
          s.at - targetX <= REFILL_SNAP_WINDOW_KM &&
          s.at - prevStopX >= MIN_REFILL_SPACING_KM &&
          s.at < D,
      )
      .sort((a, b) => a.at - b.at)[0];

    // Math.ceil, never Math.round: rounding down would place the new stop (and the fill starting
    // there) before the end of the previous fill on the same vessel — an overlap nothing else in
    // this app produces.
    const stopX = reusable ? reusable.at : Math.ceil(targetX);
    if (stopX >= D) break;
    if (!reusable) newShops.push({ at: stopX });
    stopXs.push(stopX);
    prevStopX = stopX;

    let legCarbs = 0;
    let legHours = Math.max(timeAtDistance(route, stopX), cursorHours);
    izoVessels.forEach((v) => {
      const maxCarbs = carbsFill({ fid: 0, gid: v.gid, content: 'izo', from: 0, to: 0 }, gear, mix);
      if (maxCarbs <= 0 || remaining - legCarbs <= 0) return;
      // A refill fills the bottle, so the leg carries the vessel's full carb load — sizing the
      // segment by the leftover deficit instead produced 3km-long fills that silently delivered a
      // whole 650ml bottle's worth of carbs in one gulp.
      const hours = Math.min(maxCarbs / rate, fluidHours(v, route));
      const fromX = distanceAtTime(route, legHours);
      const toX = Math.min(D, distanceAtTime(route, legHours + hours));
      if (toX <= fromX) return;
      fills.push({ gid: v.gid, content: 'izo', from: fromX, to: toX });
      legCarbs += maxCarbs;
      legHours += hours;
    });

    if (legCarbs <= 0) break; // no vessel had spare capacity — stop rather than loop forever
    remaining -= legCarbs;
    cursorHours = legHours;
  }

  return { fills, newShops, finalBalance: Math.max(0, remaining), stopXs };
}

const CLIMB_GRAD_THRESHOLD_PCT = 4;
const CLIMB_MIN_LENGTH_KM = 1;

export function findClimbStarts(route: RouteInput, fromX: number, toX: number): number[] {
  const P = prof(route);
  const starts: number[] = [];
  let runStart: number | null = null;

  for (const p of P.pts) {
    const inWindow = p.x >= fromX && p.x <= toX;
    const climbing = inWindow && p.grad >= CLIMB_GRAD_THRESHOLD_PCT;
    if (climbing && runStart === null) runStart = p.x;
    if (!climbing && runStart !== null) {
      if (p.x - runStart >= CLIMB_MIN_LENGTH_KM) starts.push(runStart);
      runStart = null;
    }
  }
  if (runStart !== null && P.D - runStart >= CLIMB_MIN_LENGTH_KM) starts.push(runStart);

  return starts;
}

export function selectItemsForAmount(
  selection: FoodSelectionEntry[],
  foodLib: FoodLibEntry[],
  amountToPlace: number,
): FoodLibEntry[] {
  const items: FoodLibEntry[] = [];
  let total = 0;

  for (const entry of selection) {
    for (let i = 0; i < entry.count; i++) {
      const libEntry = foodLib.find((f) => f.key === entry.key);
      if (!libEntry) break;
      items.push(libEntry);
      total += libEntry.carbs;
      if (total >= amountToPlace) return items;
    }
  }

  return items;
}

export function placeItemsEvenly(
  items: FoodLibEntry[],
  startX: number,
  D: number,
  route: RouteInput,
): DraftFood[] {
  const n = items.length;
  if (n === 0) return [];

  const span = Math.max(1, D - startX);
  const slotWidth = span / n;
  const climbXs = route.useGpx && route.gpxTrack ? findClimbStarts(route, startX, D) : [];
  let climbIdx = 0;

  return items.map((entry, i) => {
    let x = startX + slotWidth * (i + 0.5);
    while (climbIdx < climbXs.length && climbXs[climbIdx] < x - slotWidth / 2) climbIdx++;
    if (climbIdx < climbXs.length && climbXs[climbIdx] < x + slotWidth / 2) {
      x = climbXs[climbIdx];
      climbIdx++;
    }
    const from = Math.round(Math.max(startX, Math.min(D, x)));
    const to = entry.cont ? Math.min(D, from + (entry.span || 18)) : from;
    return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: !!entry.cont, from, to };
  });
}

export function fluidCapacityStopX(
  route: RouteInput,
  waterVessels: Vessel[],
  firstPlannedStopX: number,
): number | null {
  const totalCapacityMl = waterVessels.reduce((a, v) => a + v.vol, 0);
  const sweatRate = sweat(route);
  if (sweatRate <= 0 || totalCapacityMl <= 0) return null;
  const maxHours = totalCapacityMl / sweatRate;
  const maxX = distanceAtTime(route, maxHours);
  return maxX < firstPlannedStopX ? Math.round(maxX) : null;
}

/**
 * How long the water-capable vessels' combined volume lasts at the route's sweat rate — i.e. how
 * far one "round" of full bottles gets the rider. The design's step-5 fluid pass sizes water legs
 * by this: a single `water 0→D` fill would otherwise claim one 650ml bidon covers a whole day's
 * sweat, which is how the plan ended up with ~30% hydration.
 */
export function fluidLegHours(route: RouteInput, waterVessels: Vessel[]): number {
  const capacity = waterVessels.reduce((a, v) => a + v.vol, 0);
  const sweatRate = sweat(route);
  if (capacity <= 0 || sweatRate <= 0) return Infinity;
  return capacity / sweatRate;
}

/**
 * Splits one long water fill into as many bottle-sized legs as the stretch actually needs.
 *
 * Rounds rather than ceils on purpose: a trailing sliver of a leg is absorbed into the previous
 * one instead of becoming its own fill, because `planSummary` counts every fill as a **full**
 * vessel volume, so stub fills inflate the reported hydration without representing a real bottle.
 */
export function splitWaterFillByCapacity(
  fill: DraftFill,
  route: RouteInput,
  legHours: number,
): DraftFill[] {
  const h0 = timeAtDistance(route, fill.from);
  const h1 = timeAtDistance(route, fill.to);
  const span = h1 - h0;
  if (!(legHours > 0) || !Number.isFinite(legHours) || span <= 0) return [fill];

  const n = Math.max(1, Math.min(MAX_FLUID_LEGS, Math.round(span / legHours)));
  if (n === 1) return [fill];

  const out: DraftFill[] = [];
  for (let i = 0; i < n; i++) {
    const from = i === 0 ? fill.from : distanceAtTime(route, h0 + (span * i) / n);
    const to = i === n - 1 ? fill.to : distanceAtTime(route, h0 + (span * (i + 1)) / n);
    if (to - from >= MIN_WATER_LEG_KM) out.push({ ...fill, from, to });
  }
  return out.length ? out : [fill];
}

/** The sub-ranges of [from, to) not already taken by one of `occupied`. */
function freeRanges(from: number, to: number, occupied: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  let cur = from;
  occupied
    .slice()
    .sort((a, b) => a[0] - b[0])
    .forEach(([a, b]) => {
      if (b <= cur || a >= to) return;
      if (a > cur) out.push([cur, Math.min(a, to)]);
      cur = Math.max(cur, b);
    });
  if (cur < to) out.push([cur, to]);
  return out.filter(([a, b]) => b > a);
}

/**
 * Water fills for every water-capable vessel, one per leg, **skipping the stretches that vessel is
 * already carrying izo/gel over**.
 *
 * The per-vessel `occupied` map is the whole point: a bidon flagged `['water','izo']` carries izo
 * for its start phase and any refill leg, and plain water for everything else. Before this existed
 * only vessels whose `allowed` excluded `'izo'` could ever get a water fill, so the app's real
 * default gear (one izo-capable bidon + one gel flask) produced plans with literally zero water.
 */
export function waterFillsForVessels(
  vessels: Vessel[],
  bounds: number[],
  occupiedByGid: Record<string, [number, number][]>,
): DraftFill[] {
  const sorted = bounds.slice().sort((a, b) => a - b);
  const fills: DraftFill[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i];
    const to = sorted[i + 1];
    if (to - from < MIN_WATER_LEG_KM) continue;
    vessels.forEach((v) => {
      freeRanges(from, to, occupiedByGid[v.gid] || []).forEach(([a, b]) => {
        if (b - a < MIN_WATER_LEG_KM) return;
        fills.push({ gid: v.gid, content: 'water', from: a, to: b });
      });
    });
  }
  return fills;
}

export function assignWaterLegs(waterVessels: Vessel[], stopXs: number[], D: number): DraftFill[] {
  return waterFillsForVessels(waterVessels, [0, ...stopXs, D], {});
}

/**
 * Water fills for a gel flask **after** its one-shot gel is gone.
 *
 * The gel content itself stays strictly one-shot (never a second `'gel'` fill) — but an empty
 * 250ml flask riding along for the back half of the route is wasted carrying capacity, so it gets
 * topped up with water. The hard constraint is that this must never cost a stop: fills are placed
 * only at stops the plan already has (izo refill stops, the rider's own shop stops), so the flask
 * buys extra carried water for free. A flask whose gel outlasts every stop simply stays empty —
 * no stop is invented for it.
 *
 * A leg whose stop falls while the gel is still in the flask starts at the gel's end instead of
 * the stop, so the flask isn't left dry between "gel finished" and "next stop"; the *refill event*
 * still lands on a real stop, which is what the no-new-stops rule is about.
 */
export function gelVesselWaterFills(
  gelVessels: Vessel[],
  gelEndByGid: Record<string, number>,
  stopXs: number[],
  D: number,
): DraftFill[] {
  const stops = [...new Set(stopXs)].sort((a, b) => a - b).filter((x) => x > 0 && x < D);
  const fills: DraftFill[] = [];
  gelVessels.forEach((v) => {
    if (!isAllowed(v, 'water')) return;
    const gelEnd = gelEndByGid[v.gid] || 0;
    stops.forEach((s, i) => {
      const from = Math.max(s, gelEnd);
      const to = i + 1 < stops.length ? stops[i + 1] : D;
      if (to - from < MIN_WATER_LEG_KM) return;
      fills.push({ gid: v.gid, content: 'water', from, to });
    });
  });
  return fills;
}

function capacityCarbs(
  vessels: Vessel[],
  content: 'izo' | 'gel',
  gear: Vessel[],
  mix: MixSettings,
): number {
  return vessels.reduce(
    (a, v) => a + carbsFill({ fid: 0, gid: v.gid, content, from: 0, to: 0 }, gear, mix),
    0,
  );
}

/**
 * The g/h a single start-phase stream is planned to deliver.
 *
 * The route target is `cph(route)` g/h **in total**, and the gut can't take more than
 * `absCap(mix, ...)` g/h no matter what the target says. Gel and izo both start at x=0 and run in
 * parallel (that's the design's intent), so sizing each of them at the *full* target meant the
 * plan asked for 2× the target rate — ~157 g/h on a 100km/default-gear ride against a 90 g/h
 * ceiling — burning the whole carb budget in the first two hours and leaving the back half of the
 * route empty. Splitting the budget across the concurrent streams keeps the combined planned rate
 * at the target and stretches each stream over the distance it's actually meant to cover.
 */
export function plannedStreamRate(route: RouteInput, cap: number, streams: number): number {
  const total = Math.min(cph(route), cap);
  return streams > 1 ? total / streams : total;
}

export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const { route, mix, gear, foodLib, shops } = state;
  const D = dist(route);

  if (totalHours(route) < 1) {
    return { fills: shortRideFills(state), foods: [], newShops: [] };
  }

  const { gelVessels, izoVessels } = bucketVessels(gear, mix);

  const cap = absCap(
    mix,
    capacityCarbs(izoVessels, 'izo', gear, mix),
    capacityCarbs(gelVessels, 'gel', gear, mix),
  );
  const streams = (gelVessels.length ? 1 : 0) + (izoVessels.length ? 1 : 0);
  const streamRate = plannedStreamRate(route, cap, streams);

  const gel = sequentialFills(gelVessels, 'gel', route, gear, mix, streamRate);
  const izoStart = sequentialFills(izoVessels, 'izo', route, gear, mix, streamRate);
  const startCarbs = gel.totalCarbs + izoStart.totalCarbs;

  const target = totalHours(route) * cph(route);
  const selectedFoodCarbs = selection.reduce((a, s) => {
    const entry = foodLib.find((f) => f.key === s.key);
    return a + (entry ? entry.carbs * s.count : 0);
  }, 0);
  const balance = target - startCarbs - selectedFoodCarbs;

  const refill =
    balance > 0 && izoVessels.length > 0
      ? planIzoRefills(route, gear, mix, izoVessels, izoStart.endX, balance, shops, streamRate)
      : {
          fills: [] as DraftFill[],
          newShops: [] as DraftShop[],
          finalBalance: 0,
          stopXs: [] as number[],
        };

  const refillAmount = balance > 0 && izoVessels.length > 0 ? balance - refill.finalBalance : 0;
  const totalBottleCarbs = startCarbs + refillAmount;
  const foodTarget = Math.max(0, target - totalBottleCarbs);
  const items = selectItemsForAmount(selection, foodLib, foodTarget);
  const foods = placeItemsEvenly(items, izoStart.endX, D, route);

  // Every water-capable vessel except the gel flask(s) — gel vessels are one-shot by design and
  // are never revisited, not even for water. `waterOnly`/`reservedWaterVessel` alone would exclude
  // the izo-capable bidon, which is exactly the bug that left the app's default gear with no water
  // fills at all; izo-capable vessels carry water over whatever they aren't carrying izo over.
  const gelGids = new Set(gelVessels.map((v) => v.gid));
  const waterVessels = gear.filter((v) => !gelGids.has(v.gid) && isAllowed(v, 'water'));

  let stopXs = refill.stopXs;
  let extraShops: DraftShop[] = [];
  // Only worth a marker of its own when the plan has no stops at all: with refill stops already
  // on the route the rider is stopping anyway, and the water fills below show where to top up.
  // Water comes from any tap or fountain, so a water leg boundary is not itself a shop.
  const firstStopX = stopXs.length ? Math.min(...stopXs) : D;
  const fluidStopX = stopXs.length ? null : fluidCapacityStopX(route, waterVessels, firstStopX);
  if (fluidStopX !== null && fluidStopX >= minStopX(D)) {
    const nearExisting = shops.find((s) => Math.abs(s.at - fluidStopX) < 3);
    if (nearExisting) {
      stopXs = [...stopXs, nearExisting.at];
    } else {
      stopXs = [...stopXs, fluidStopX];
      extraShops = [{ at: fluidStopX }];
    }
  }

  const carbFills = [...gel.fills, ...izoStart.fills, ...refill.fills];
  const occupiedByGid: Record<string, [number, number][]> = {};
  carbFills.forEach((f) => {
    (occupiedByGid[f.gid] ||= []).push([f.from, f.to]);
  });

  // Water goes wherever a vessel isn't already carrying izo/gel, then each stretch is cut into
  // bottle-sized legs. Those cuts deliberately do NOT spawn shop markers: topping up water needs a
  // tap or a fountain, not a shop, and marker spam is exactly what the refill cap above avoids.
  const legHours = fluidLegHours(route, waterVessels);
  const waterFills = waterFillsForVessels(waterVessels, [0, D], occupiedByGid).flatMap((f) =>
    splitWaterFillByCapacity(f, route, legHours),
  );

  const gelEndByGid: Record<string, number> = {};
  gel.fills.forEach((f) => {
    gelEndByGid[f.gid] = Math.max(gelEndByGid[f.gid] || 0, f.to);
  });
  const gelWaterFills = gelVesselWaterFills(
    gelVessels,
    gelEndByGid,
    [...stopXs, ...shops.map((s) => s.at)],
    D,
  );

  return {
    fills: [...carbFills, ...waterFills, ...gelWaterFills],
    foods,
    newShops: [...refill.newShops, ...extraShops],
  };
}
