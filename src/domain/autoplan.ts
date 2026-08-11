import {
  COVERAGE_TARGET_PCT,
  carbsFill,
  cph,
  dist,
  distanceAtTime,
  planSummary,
  prof,
  sweat,
  timeAtDistance,
  totalHours,
  volOf,
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
 * Mirrors `fuel.ts`'s `HYDRATION_BUFFER_ML_PER_KG` (private there). A rider doesn't start dehydrated,
 * so a ride that never loses more than this much fluid per kg of body mass needs no water *plan* at
 * all — which is also exactly when `planSummary` reports 100% hydration. The two must stay in sync:
 * planning stops for a ride the summary already calls fully hydrated would be pure noise.
 */
const HYDRATION_BUFFER_ML_PER_KG = 15;

/**
 * Carbs are a separate, still time-based gate: under an hour there is nothing to fuel, whatever the
 * weather does to the water side. Deliberately independent of the hydration gate above — a short,
 * brutally hot ride legitimately gets water planning and no food at all.
 */
const CARB_MIN_HOURS = 1;

/** How far an existing `ShopStop` may sit from a planned stop and still be used instead of a new one. */
export const SHOP_SNAP_KM = 3;

/** Shortest leg worth its own fill — below this a stop is bookkeeping, not a refill. */
const MIN_LEG_KM = 1;

/** Safety bound on the refill search, so a pathological capacity/need ratio can't spin. */
const MAX_REFILLS = 40;

/**
 * How far before the finish the last product must be eaten. Carbs poured in at the line never drain
 * out of `gut` before the ride's absorption accounting stops, so they score as unabsorbed — the
 * exact buffer isn't formalized, this is the floor the rider's real builds support.
 */
const FINISH_GAP_FRACTION = 0.03;

/** Fallback span for a `cont` product whose library entry doesn't declare one. */
const DEFAULT_CONT_SPAN_KM = 18;

/**
 * How far into the stretch it fuels a point product is eaten. Not the middle: absorption lags
 * intake by tens of minutes (`gut` drains into `absorbed` at `absCap`), so a gel eaten a quarter of
 * the way in has the gut already working when the stretch's need arrives, which is what
 * `coverage()`'s `min(rate, needRate)` integral rewards — measured against the real curve, a quarter
 * scores several points above the midpoint on every product scenario. Not zero either: "eat this on
 * the start line" is not advice a rider can act on.
 */
const POINT_ITEM_SLOT_FRACTION = 0.25;

const MIN_STOP_X_KM = 10;

/** The coverage/hydration percentage the app itself paints green, as a 0-1 fraction. */
const GREEN = COVERAGE_TARGET_PCT / 100;

/**
 * The sanity floor for a first stop: "stop for a refill at km 1" is never useful advice. It is no
 * longer applied as a clamp — stops now fall where a load genuinely runs out, and that spacing puts
 * the first one a full leg into the route on its own — so this is the property the plan is checked
 * against rather than a correction the plan has done to it. Scaled down on very short routes so the
 * rule can't swallow the whole ride.
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

/**
 * Lays the selected products out over `[startX, D)` so that they deliver carbs at a steady rate.
 *
 * Each item gets a slice of the window proportional to **its own carb content**, not an equal slice
 * of distance: three gels and two packs of chews spread by count would dump 66g in the first few km
 * and then coast, which `coverage()` scores as mostly wasted (it credits `min(rate, needRate)`, so
 * everything poured in above the target rate is thrown away). A point item is eaten a
 * `POINT_ITEM_SLOT_FRACTION` of the way into its slice; a `cont` item starts at the top of its slice
 * and runs for its declared span, shortened to the slice when the slice is the tighter of the two —
 * which is also what keeps two packs of chews from ever overlapping.
 *
 * The window stops short of the finish line: carbs eaten in the last few percent of the route never
 * finish draining out of `gut`, so they score as unabsorbed rather than helping.
 */
export function placeItemsEvenly(
  items: FoodLibEntry[],
  startX: number,
  D: number,
  route: RouteInput,
): DraftFood[] {
  const n = items.length;
  if (n === 0) return [];

  const endX = Math.max(startX + MIN_LEG_KM, D * (1 - FINISH_GAP_FRACTION));
  const window = endX - startX;
  const totalCarbs = items.reduce((a, e) => a + e.carbs, 0);
  const climbXs = route.useGpx && route.gpxTrack ? findClimbStarts(route, startX, endX) : [];
  let climbIdx = 0;
  let cursor = startX;
  let prevTo = -Infinity;

  return items.map((entry) => {
    const share = totalCarbs > 0 ? (window * entry.carbs) / totalCarbs : window / n;
    const slotFrom = cursor;
    const slotTo = cursor + share;
    cursor = slotTo;

    if (entry.cont) {
      const length = Math.min(entry.span || DEFAULT_CONT_SPAN_KM, share);
      const from = Math.min(endX, slotFrom);
      const to = Math.min(endX, from + length);
      prevTo = to;
      return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: true, from, to };
    }

    let x = slotFrom + share * POINT_ITEM_SLOT_FRACTION;
    while (climbIdx < climbXs.length && climbXs[climbIdx] < slotFrom) climbIdx++;
    if (climbIdx < climbXs.length && climbXs[climbIdx] < slotTo) {
      x = climbXs[climbIdx];
      climbIdx++;
    }
    x = Math.min(endX, Math.max(startX, x));
    // Whole kilometres read better on a plan, but slices thinner than a kilometre would round two
    // products onto the same spot — the exact position wins over the tidy one whenever it would.
    const rounded = Math.round(x);
    const from = rounded > prevTo && rounded <= endX ? rounded : x;
    prevTo = from;
    return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: false, from, to: from };
  });
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
 * for its carb legs and plain water for everything else. Before this existed only vessels whose
 * `allowed` excluded `'izo'` could ever get a water fill, so the app's real default gear (one
 * izo-capable bidon + one gel flask) produced plans with literally zero water.
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
    if (to - from < MIN_LEG_KM) continue;
    vessels.forEach((v) => {
      freeRanges(from, to, occupiedByGid[v.gid] || []).forEach(([a, b]) => {
        if (b - a < MIN_LEG_KM) return;
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
 * only at stops the plan already has, so the flask buys extra carried water for free. A flask whose
 * gel outlasts every stop simply stays empty — no stop is invented for it.
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
      if (to - from < MIN_LEG_KM) return;
      fills.push({ gid: v.gid, content: 'water', from, to });
    });
  });
  return fills;
}

/**
 * The distance one full load of a vessel's content is *meant* to last: the point at which it runs
 * out if it's consumed at the rate the ride actually asks for — the carb target for izo/gel, the
 * sweat rate for water. Everything else in this file is built on it, because it's the honest
 * definition of "the bottle is empty, this is where you stop".
 */
function loadHours(carbs: number, ml: number, content: Fill['content'], route: RouteInput): number {
  if (content === 'water') {
    const sweatRate = sweat(route);
    return sweatRate > 0 ? ml / sweatRate : Infinity;
  }
  const rate = cph(route);
  return rate > 0 ? carbs / rate : Infinity;
}

/**
 * The carb stream: the gel flask(s) first, then `izoCount` bottles of izo, laid end to end from the
 * start line with each fill sized to deliver at exactly the route's `cph()` target.
 *
 * Sequential, never parallel: two streams running from km 0 each sized at the full target deliver
 * 2× the target rate, and `coverage()` throws away everything above `needRate`. Gel leads because
 * it's a single one-shot fill the rider prepares at home, and getting it out of the way early is
 * what frees the flask to carry water for the rest of the route.
 *
 * The last fill runs to the finish line only when stretching it that far still delivers at ≥ the
 * app's own green threshold; past that the stretch is just dilution and the honest answer is a dry
 * tail. That's the difference between a bottle that comfortably covers a short ride (izo-4 — one
 * fill, start to finish) and one that doesn't (izo-6 — three fills that stop short of the line).
 */
function carbStreamFills(
  route: RouteInput,
  gear: Vessel[],
  mix: MixSettings,
  gelVessels: Vessel[],
  izoVessels: Vessel[],
  izoCount: number,
  shops: ShopStop[],
): { fills: DraftFill[]; endX: number } {
  const D = dist(route);
  const totHours = totalHours(route);
  const fills: DraftFill[] = [];
  const queue: { vessel: Vessel; content: 'gel' | 'izo' }[] = [
    ...gelVessels.map((vessel) => ({ vessel, content: 'gel' as const })),
    ...Array.from({ length: izoCount }, (_, i) => ({
      vessel: izoVessels[i % Math.max(1, izoVessels.length)],
      content: 'izo' as const,
    })),
  ];

  let cursor = 0;
  let lastLoadHours = 0;
  for (const { vessel, content } of queue) {
    if (!vessel) break;
    const carbs = carbsFill({ fid: 0, gid: vessel.gid, content, from: 0, to: 0 }, gear, mix);
    if (carbs <= 0) continue;
    const hours = loadHours(carbs, vessel.vol, content, route);
    if (!Number.isFinite(hours) || hours <= 0) continue;
    const fromX = distanceAtTime(route, cursor);
    if (D - fromX < MIN_LEG_KM) break;
    const toX = snapToShop(Math.min(D, distanceAtTime(route, cursor + hours)), shops, D);
    if (toX - fromX < MIN_LEG_KM) break;
    fills.push({ gid: vessel.gid, content, from: fromX, to: toX });
    cursor = timeAtDistance(route, toX);
    lastLoadHours = hours;
  }

  const last = fills[fills.length - 1];
  if (last && last.to < D) {
    const stretched = totHours - timeAtDistance(route, last.from);
    if (stretched * GREEN <= lastLoadHours) last.to = D;
  }

  return { fills, endX: last ? last.to : 0 };
}

/**
 * Where the water stops fall: one every time the *combined* carried water capacity would run out at
 * the sweat rate. Combined, not per bottle — the rider's rule is that splitting one 1000ml bidon
 * into two 500ml bottles must not change where or how often they stop, only total volume matters.
 */
function waterStopXs(route: RouteInput, capacityMl: number, count: number): number[] {
  const D = dist(route);
  const legHours = loadHours(0, capacityMl, 'water', route);
  if (!Number.isFinite(legHours) || legHours <= 0) return [];
  const out: number[] = [];
  for (let i = 1; i <= count; i++) {
    const x = distanceAtTime(route, legHours * i);
    if (D - x < MIN_LEG_KM || x < MIN_LEG_KM) break;
    out.push(x);
  }
  return out;
}

/** How many water legs are worth planning at all — past this the bottle outlasts the leg. */
function maxWaterStops(route: RouteInput, capacityMl: number): number {
  const legHours = loadHours(0, capacityMl, 'water', route);
  if (!Number.isFinite(legHours) || legHours <= 0) return 0;
  return Math.min(MAX_REFILLS, Math.max(0, Math.ceil(totalHours(route) / legHours) - 1));
}

/** The nearest existing shop, when one sits close enough to be this stop rather than a new one. */
function snapToShop(x: number, shops: ShopStop[], D: number): number {
  let best: number | null = null;
  for (const s of shops) {
    if (s.at <= 0 || s.at >= D) continue;
    if (Math.abs(s.at - x) > SHOP_SNAP_KM) continue;
    if (best === null || Math.abs(s.at - x) < Math.abs(best - x)) best = s.at;
  }
  return best === null ? x : best;
}

/**
 * `planSummary`'s `fluidPlanned` for a draft, without paying for the 160-sample absorption
 * simulation the rest of that summary runs — hydration is a plain ratio of carried volume to sweat
 * loss, so the water search can afford to ask after every candidate top-up. Must stay in step with
 * `planSummary`: every non-gel fill counts its vessel's **full** volume, plus whatever the products
 * bring along.
 */
function fluidPlannedOf(fills: DraftFill[], gear: Vessel[], foods: DraftFood[]): number {
  const fromFills = fills
    .filter((f) => f.content !== 'gel')
    .reduce((a, f) => a + volOf({ ...f, fid: 0 }, gear), 0);
  return fromFills + foods.reduce((a, f) => a + (f.ml || 0), 0);
}

/** Coverage the app would report for a carb plan, without building the water side it ignores. */
function coverageOf(state: PlanState, fills: DraftFill[], foods: DraftFood[]): number {
  const applied: PlanState = {
    ...state,
    fills: fills.map((f, i) => ({ ...f, fid: i + 1 })),
    foods: foods.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
  };
  return planSummary(applied).coverage;
}

export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const { route, mix, gear, foodLib, shops } = state;
  const D = dist(route);
  const hrs = totalHours(route);
  const sweatLoss = sweat(route) * hrs;

  const carbsOn = hrs >= CARB_MIN_HOURS;
  const waterOn = sweatLoss >= route.weight * HYDRATION_BUFFER_ML_PER_KG;

  const { gelVessels, izoVessels } = bucketVessels(gear, mix);

  // --- carbs: the smallest number of izo bottles that gets the plan green ------------------
  const target = hrs * cph(route);
  const perFill = izoVessels.length
    ? carbsFill({ fid: 0, gid: izoVessels[0].gid, content: 'izo', from: 0, to: 0 }, gear, mix)
    : 0;
  // A rider carrying izo-capable bottles leaves home with them mixed, exactly like the gel flask is
  // filled once at home. So one load per izo bottle is the floor — a generous food selection buys
  // back refill *stops*, not the bottles the rider is already carrying anyway.
  const floor = perFill > 0 ? izoVessels.length : 0;
  const gelCarbs = gelVessels.reduce(
    (a, v) => a + carbsFill({ fid: 0, gid: v.gid, content: 'gel', from: 0, to: 0 }, gear, mix),
    0,
  );
  // What the selection has to cover is measured against the load the rider leaves home with, never
  // against however many refills the search below happens to be trying. Products cost no stop, so
  // letting an extra refill leg eat into the food budget would trade a free gram for a paid one —
  // and it made the search unstable, since each extra leg then removed food and undid its own gain.
  const items = carbsOn
    ? selectItemsForAmount(selection, foodLib, Math.max(0, GREEN * target - gelCarbs - perFill))
    : [];
  const carbPlanFor = (izoCount: number) => {
    const stream = carbStreamFills(route, gear, mix, gelVessels, izoVessels, izoCount, shops);
    return { ...stream, foods: placeItemsEvenly(items, stream.endX, D, route) };
  };

  let carbs = { fills: [] as DraftFill[], endX: 0, foods: [] as DraftFood[] };
  if (carbsOn) {
    const ceiling = perFill > 0 ? MAX_REFILLS : 0;
    const carried = gelCarbs + items.reduce((a, e) => a + e.carbs, 0);

    // The raw sums say how many bottles it takes to *pour in* 85% of the target, but `coverage()`
    // integrates absorption rather than dividing totals and comes out about one bottle more
    // generous — the rider's own hand-built izo plans land exactly one refill below what the ratio
    // demands. So the search starts a bottle below the ratio and walks: up while the plan isn't
    // green, back down while it still is. What it converges on is the *fewest* refills that clear
    // the threshold the app itself paints green, which is what the rider asked for — not the most
    // coverage. Starting on the generous side keeps that to two `coverage()` evaluations in the
    // common case, and each one is a full 160-sample absorption simulation.
    const fromRatio = perFill > 0 ? Math.ceil((GREEN * target - carried) / perFill) - 1 : 0;
    let count = Math.max(floor, Math.min(ceiling, fromRatio));
    carbs = carbPlanFor(count);
    let green = count === 0 || coverageOf(state, carbs.fills, carbs.foods) >= COVERAGE_TARGET_PCT;
    let grew = false;
    while (!green && count < ceiling) {
      const richer = carbPlanFor(count + 1);
      if (richer.endX <= carbs.endX) break; // no room left on the route
      count += 1;
      carbs = richer;
      grew = true;
      green = coverageOf(state, carbs.fills, carbs.foods) >= COVERAGE_TARGET_PCT;
    }
    // Only worth walking down if we never walked up: the count below is the one the up-walk just
    // rejected, and re-running a 160-sample simulation to learn that again is pure cost.
    while (!grew && green && count > floor) {
      const leaner = carbPlanFor(count - 1);
      if (coverageOf(state, leaner.fills, leaner.foods) < COVERAGE_TARGET_PCT) break;
      count -= 1;
      carbs = leaner;
    }
  }

  const occupiedByGid: Record<string, [number, number][]> = {};
  carbs.fills.forEach((f) => {
    (occupiedByGid[f.gid] ||= []).push([f.from, f.to]);
  });

  // --- water: the smallest number of top-ups that gets hydration green ---------------------
  // Only a vessel that actually ended up carrying gel is held back for the piggyback path below —
  // a gel flask on a ride too short to fuel (or with no gel mix worth carrying) is just another
  // water bottle, and leaving it empty would throw away carrying capacity for nothing.
  const gelFilledGids = new Set(carbs.fills.filter((f) => f.content === 'gel').map((f) => f.gid));
  const waterVessels = gear.filter((v) => !gelFilledGids.has(v.gid) && isAllowed(v, 'water'));
  const capacity = waterVessels.reduce((a, v) => a + v.vol, 0);
  const waterFor = (stopCount: number) =>
    waterFillsForVessels(
      waterVessels,
      [0, ...waterStopXs(route, capacity, stopCount).map((x) => snapToShop(x, shops, D)), D],
      occupiedByGid,
    );

  let waterFills = waterFor(0);
  if (waterOn && capacity > 0 && sweatLoss > 0) {
    const limit = maxWaterStops(route, capacity);
    for (let n = 0; n <= limit; n++) {
      waterFills = waterFor(n);
      const planned = fluidPlannedOf([...carbs.fills, ...waterFills], gear, carbs.foods);
      if (planned >= GREEN * sweatLoss) break;
    }
  }

  // Stops are exactly the refill events the plan asks for: every fill that doesn't start at the
  // start line begins at one, and no stop exists that isn't a refill. Water is not a free tap.
  const stopXs = [
    ...new Set(
      [...carbs.fills, ...waterFills].map((f) => f.from).filter((x) => x > 0 && x < D - 1e-9),
    ),
  ].sort((a, b) => a - b);

  const gelEndByGid: Record<string, number> = {};
  carbs.fills
    .filter((f) => f.content === 'gel')
    .forEach((f) => {
      gelEndByGid[f.gid] = Math.max(gelEndByGid[f.gid] || 0, f.to);
    });
  const gelWaterFills = gelVesselWaterFills(
    gelVessels.filter((v) => gelFilledGids.has(v.gid)),
    gelEndByGid,
    [...stopXs, ...shops.map((s) => s.at)],
    D,
  );

  const newShops: DraftShop[] = stopXs
    .filter((x) => !shops.some((s) => Math.abs(s.at - x) < 1e-9))
    .map((x) => ({ at: x }));

  return {
    fills: [...carbs.fills, ...waterFills, ...gelWaterFills],
    foods: carbs.foods,
    newShops,
  };
}
