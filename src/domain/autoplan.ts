import {
  COVERAGE_TARGET_PCT,
  carbsFill,
  cph,
  dist,
  distanceAtTime,
  eff,
  planSummary,
  timeAtDistance,
  prof,
  samples,
  sweat,
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
 * How far the plan may walk away from what the raw sums asked for once `coverage()` has had its
 * say. Two steps in either direction is the whole disagreement between the two measures; past that
 * the ride is short of carbs for a reason no extra bottle is going to fix, and every step costs a
 * full 160-sample absorption simulation.
 */
const MAX_COVERAGE_WALK = 2;

/**
 * How far before the finish the last product must be eaten. Carbs poured in at the line never drain
 * out of `gut` before the ride's absorption accounting stops, so they score as unabsorbed — the
 * exact buffer isn't formalized, this is the floor the rider's real builds support.
 */
const FINISH_GAP_FRACTION = 0.03;

/**
 * The same idea as `FINISH_GAP_FRACTION`, applied to a bottle rather than a product: the last
 * mouthful of izo or gel is drunk a little before the line, because carbs that arrive inside the
 * finish never drain out of `gut` in time to count. Smaller than the products' gap — a stream
 * delivers continuously, so only its last grams are at stake, where a whole gel is all-or-nothing.
 */
const CARB_STREAM_FINISH_GAP = 0.02;

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
  return spreadItems(
    items,
    startX,
    Math.max(startX + MIN_LEG_KM, D * (1 - FINISH_GAP_FRACTION)),
    route,
    POINT_ITEM_SLOT_FRACTION,
  );
}

/** `placeItemsEvenly` over an explicit window — used to fill the gaps between shop-products. */
function spreadItems(
  items: FoodLibEntry[],
  startX: number,
  endX: number,
  route: RouteInput,
  slotFraction: number,
): DraftFood[] {
  const n = items.length;
  if (n === 0) return [];

  const window = Math.max(0, endX - startX);
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

    let x = slotFrom + share * slotFraction;
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

/* --------------------------------------------------------------------------------------------
 * The leg grid
 *
 * Everything a plan does — refill a bottle, swap izo for water, buy a cola — happens on a grid of
 * `G` equal-*time* legs. One grid, shared by every domain, is what makes a stop a stop: the water
 * refill, the izo refill and the shop-product land on the same boundary instead of each domain
 * planning its own pull-over 3km down the road from the last one.
 *
 * Each vessel tiles the route with its own number of fills, spread as evenly over the grid as its
 * count allows. Even tiling isn't tidiness — it is the rider's pointwise rule restated: a load's
 * delivery rate is `volume / leg duration`, so equal legs deliver one flat rate all day and the
 * line can only sag if the *total* is short. Any uneven arrangement of the same bottles buys a
 * surplus in one place with a dip in another, and a dip is the thing the rule forbids.
 * ------------------------------------------------------------------------------------------- */

interface Timeline {
  gid: string;
  vol: number;
  /**
   * Water fills after the carb block. Nothing before it: a bottle waiting its turn rides along full
   * of what the rider packed it with and is opened when it is needed, which is why a vessel's first
   * fill does not have to start at the line.
   */
  tailFills: number;
  /** The leg the carb block starts on: after the gel, and after any izo bottle ahead of it. */
  carbStartLeg: number;
  /** Loads of `carbContent` this vessel carries. */
  carbFills: number;
  /** Legs one load is drunk over — one, unless the grid is finer than a load actually lasts. */
  legsPerLoad: number;
  /**
   * Legs the whole carb block covers. The streams share the ride in proportion to the grams they
   * carry, so a bottle that holds two thirds of the plan's carbs is drunk over two thirds of the
   * route — stretched thinner than its natural rate when that is all there is, which costs a little
   * coverage early and buys the bottle's water for the tail.
   */
  carbBlockLegs: number;
  carbContent: 'izo' | 'gel' | null;
  /** Legs the one-shot gel fill spans — gel vessels only, and never more than one such fill. */
  gelLegs: number;
  /**
   * How long the gel lasts at the rate the ride asks for. A flask whose gel is its last fill has no
   * boundary after it to line up with a stop, so it ends honestly — this many hours after it starts,
   * wherever that is — instead of being stretched to the finish line.
   */
  gelHours: number;
  /** An izo-only bottle can never be topped up with water, however thirsty the plan is. */
  canWater: boolean;
  carbsPerFill: number;
}

interface Block {
  content: Fill['content'];
  /** Leg indices, half-open: `[fromLeg, toLeg)`. */
  fromLeg: number;
  toLeg: number;
  fills: number;
}

/**
 * A vessel's whole ride, in three possible stretches: water while something else fuels, the carb
 * loads it was packed with, then water again once they are gone.
 *
 * A bottle that can only hold izo has no water to fall back on, so its loads are stretched over
 * everything it is asked to cover instead — the same volume, drunk slower, which is what keeps the
 * fluid line up when that bottle is all the plan has.
 */
function layoutOf(t: Timeline, G: number): { lead: number; carbLegs: number; tail: number } {
  if (!t.carbContent) return { lead: 0, carbLegs: 0, tail: G };
  const lead = Math.min(t.carbStartLeg, G - 1);
  // A bottle that cannot hold water has nothing else to do, so its loads cover everything left to
  // it; every other stream takes the share of the route its grams are worth.
  const carbLegs = t.canWater ? Math.min(G - lead, Math.max(1, t.carbBlockLegs)) : G - lead;
  return { lead, carbLegs, tail: G - lead - carbLegs };
}

function blocksOf(t: Timeline, G: number): Block[] {
  const out: Block[] = [];
  const { lead, carbLegs, tail } = layoutOf(t, G);
  if (carbLegs > 0 && t.carbContent) {
    out.push({
      content: t.carbContent,
      fromLeg: lead,
      toLeg: lead + carbLegs,
      fills: t.carbContent === 'gel' ? 1 : clamp(t.carbFills, 1, carbLegs),
    });
  }
  if (tail > 0 && (t.tailFills > 0 || !t.carbContent)) {
    out.push({ content: 'water', fromLeg: G - tail, toLeg: G, fills: clamp(t.tailFills, 1, tail) });
  }
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** The leg indices a vessel's fills start/end on — every block split as evenly as its count allows. */
function legBounds(t: Timeline, G: number): number[] {
  const raw = [0];
  for (const b of blocksOf(t, G)) {
    const span = b.toLeg - b.fromLeg;
    for (let i = 1; i <= b.fills; i++) raw.push(b.fromLeg + Math.round((i * span) / b.fills));
  }
  const out: number[] = [];
  raw.forEach((b) => {
    const v = Math.min(G, b);
    if (out.length === 0 || v > out[out.length - 1]) out.push(v);
  });
  return out;
}

function timelineFills(t: Timeline, G: number, xs: number[], route: RouteInput): DraftFill[] {
  const D = xs[G];
  // A bottle whose last drop is carbs empties a little before the line: sugar swallowed in the
  // final minutes is still in the gut at the finish, so it counts as carried, not eaten. Water has
  // no such deadline and runs all the way in.
  const carbEnd = D * (1 - CARB_STREAM_FINISH_GAP);
  const blocks = blocksOf(t, G);
  const out: DraftFill[] = [];
  blocks.forEach((b, bi) => {
    const span = b.toLeg - b.fromLeg;
    // A gel the flask never refills out of has no boundary to line up with a stop, so it keeps the
    // honest end: the point where its carbs are gone.
    const unsnapped = b.content === 'gel' && bi === blocks.length - 1;
    for (let i = 0; i < b.fills; i++) {
      const from = xs[b.fromLeg + Math.round((i * span) / b.fills)];
      let to = xs[b.fromLeg + Math.round(((i + 1) * span) / b.fills)];
      if (unsnapped && i === b.fills - 1) {
        to = Math.min(to, distanceAtTime(route, timeAtDistance(route, from) + t.gelHours));
      }
      // Only for a bottle that has nothing else to switch to and more than one load to space out.
      // A bottle that can carry water keeps drinking to the line — there is no reason to stop —
      // and a single load stretched across the whole ride is already delivering below the rate the
      // ride asks for, so pulling it in early would leave the last kilometres dry for nothing.
      const dryTailWorthIt = !t.canWater && b.fills > 1;
      if (
        bi === blocks.length - 1 &&
        i === b.fills - 1 &&
        b.content !== 'water' &&
        dryTailWorthIt
      ) {
        to = Math.min(to, carbEnd);
      }
      if (to > from) out.push({ gid: t.gid, content: b.content, from, to });
    }
  });
  return out;
}

/**
 * How much fluid each leg gets, per unit of **effort** — the same axis `fuel.ts` pours it out on.
 *
 * This is the rider's floor made checkable without paying for a 160-sample simulation: the ratio is
 * constant inside a fill, so the lowest leg *is* the lowest point of the chart's line. It has to be
 * effort and not the clock, because an hour of climbing costs more sweat than an hour of descending
 * and empties the bottle faster too — measuring equal-*time* legs against a flat sweat rate puts the
 * error exactly where it hurts, on the climb, where the rider is thirstiest.
 *
 * Gel carries no water, so a flask's gel legs count for nothing here — which is why a plan whose gel
 * outlasts the first stop has to make the water up elsewhere.
 */
function legFluidRates(timelines: Timeline[], G: number, effs: number[]): number[] {
  const rates = new Array<number>(G).fill(0);
  for (const t of timelines) {
    for (const b of blocksOf(t, G)) {
      if (b.content === 'gel') continue;
      const span = b.toLeg - b.fromLeg;
      for (let i = 0; i < b.fills; i++) {
        const from = b.fromLeg + Math.round((i * span) / b.fills);
        const to = b.fromLeg + Math.round(((i + 1) * span) / b.fills);
        if (to <= from) continue;
        const effSpan = effs[to] - effs[from];
        if (effSpan <= 0) continue;
        const rate = t.vol / effSpan;
        for (let leg = from; leg < to; leg++) rates[leg] += rate;
      }
    }
  }
  return rates;
}

/** The interior grid points some vessel refills at — the plan's stops, in leg indices. */
function stopLegs(timelines: Timeline[], G: number): Set<number> {
  const legs = new Set<number>();
  for (const t of timelines) {
    // Only the boundaries a *next* fill starts at: a flask that simply runs dry is not a stop.
    const bounds = legBounds(t, G);
    for (let i = 1; i < bounds.length - 1; i++) if (bounds[i] < G) legs.add(bounds[i]);
  }
  return legs;
}

/** Legs are equal slices of *time*: on a hilly route that makes them unequal in km, as it should. */
function gridXs(route: RouteInput, G: number, shops: ShopStop[]): number[] {
  const D = dist(route);
  const hrs = totalHours(route);
  const xs = [0];
  for (let i = 1; i < G; i++) {
    const raw = distanceAtTime(route, (hrs * i) / G);
    const snapped = snapToShop(raw, shops, D);
    xs.push(snapped > xs[i - 1] + MIN_LEG_KM ? snapped : raw);
  }
  xs.push(D);
  return xs;
}

/**
 * Where the products go: the shop-products pinned to stops, everything else spread across the
 * stretches between them.
 *
 * A cola is bought, not carried, so it can only be eaten where the plan already pulls over — and
 * spread across those stops rather than bought four at a time at the first one. The rest of the
 * selection then fills the gaps in between, each gap taking a share of the items proportional to
 * how much of the route it is, which is what keeps a stop-product from splitting the ride into "all
 * the gels before it, nothing after".
 */
function pinShopItems(items: FoodLibEntry[], stops: number[], D: number): DraftFood[] {
  const endX = D * (1 - FINISH_GAP_FRACTION);
  const gap = Math.max(0.5, D * 0.005);
  const usable = stops.filter((x) => x > 0 && x <= endX).sort((a, b) => a - b);
  const shopItems = items.filter((e) => e.needsStop);
  const pinned: DraftFood[] = [];
  shopItems.forEach((entry, j) => {
    if (usable.length === 0) return;
    const idx = Math.min(
      usable.length - 1,
      Math.floor(((j + 0.5) * usable.length) / shopItems.length),
    );
    const taken = pinned.filter((p) => Math.abs(p.from - usable[idx]) < gap).length;
    const at = usable[idx] + taken * gap;
    pinned.push({
      key: entry.key,
      carbs: entry.carbs,
      ml: entry.ml,
      cont: false,
      from: at,
      to: at,
    });
  });
  return pinned.sort((a, b) => a.from - b.from);
}

function placeProducts(
  items: FoodLibEntry[],
  stops: number[],
  D: number,
  route: RouteInput,
  slotFraction: number,
  endX: number,
): DraftFood[] {
  const gap = Math.max(0.5, D * 0.005);
  const carried = items.filter((e) => !e.needsStop);
  const pinned = pinShopItems(items, stops, D);

  const edges = [0, ...pinned.map((p) => p.from), endX];
  const windows: [number, number][] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    windows.push([
      i === 0 ? 0 : edges[i] + gap,
      i === edges.length - 2 ? endX : edges[i + 1] - gap,
    ]);
  }
  const spans = windows.map(([a, b]) => Math.max(0, b - a));
  const totalSpan = spans.reduce((a, b) => a + b, 0);
  const totalCarbs = carried.reduce((a, e) => a + e.carbs, 0);

  // Each window takes the items whose place in the selection's own carb sequence falls inside it —
  // so a long stretch gets proportionally more of the food, and one item never lands in a window
  // just because the one before it filled the previous window's share.
  const cumSpan: number[] = [];
  spans.reduce((a, s, i) => (cumSpan[i] = a + s), 0);
  const perWindow: FoodLibEntry[][] = windows.map(() => []);
  let eaten = 0;
  for (const entry of carried) {
    const at = totalCarbs > 0 ? (eaten + entry.carbs / 2) / totalCarbs : 0;
    eaten += entry.carbs;
    let w = windows.findIndex((_, i) => spans[i] > 0 && at * totalSpan <= cumSpan[i] + 1e-9);
    if (w < 0) for (let i = spans.length - 1; i >= 0 && w < 0; i--) if (spans[i] > 0) w = i;
    if (w >= 0) perWindow[w].push(entry);
  }

  const spread = perWindow.flatMap((list, i) =>
    spreadItems(list, windows[i][0], windows[i][1], route, slotFraction),
  );
  return [...pinned, ...spread].sort((a, b) => a.from - b.from);
}

/**
 * The other way to lay the food out: each item goes where the plan is furthest behind.
 *
 * Spreading by carb share assumes the bottles deliver evenly, which stops being true the moment a
 * shop-product pins carbs to a stop or a one-shot gel front-loads them — then an even spread puts
 * food where the ride is already fed and leaves the real hole (usually the stretch before the first
 * stop) empty. This walks the plan's own delivery curve against the target and drops each item at
 * the first point the gap has grown to a whole item's worth.
 *
 * Which of the two wins is not decidable from first principles — it depends on how the bottles
 * happen to fall — so `autoplan` builds both and keeps whichever the app's own coverage scores
 * higher, which is also what "exhaust the arrangement before reaching for another item" means.
 */
function deficitProducts(
  state: PlanState,
  fills: DraftFill[],
  items: FoodLibEntry[],
  stops: number[],
  D: number,
): DraftFood[] {
  const endX = D * (1 - FINISH_GAP_FRACTION);
  const gap = Math.max(0.5, D * 0.005);
  const pinned = pinShopItems(items, stops, D);
  const carried = items.filter((e) => !e.needsStop);
  if (carried.length === 0) return pinned;

  const S = samples({
    ...state,
    fills: fills.map((f, i) => ({ ...f, fid: i + 1 })),
    foods: pinned.map((f, i) => ({ ...f, id: i + 1, name: f.key })),
  });

  const out: DraftFood[] = [...pinned];
  let placed = 0;
  let cursor = 0;
  for (const entry of carried) {
    const span = entry.cont ? Math.min(entry.span || DEFAULT_CONT_SPAN_KM, D) : 0;
    let at = -1;
    let bestDeficit = -Infinity;
    let bestX = cursor;
    for (const p of S) {
      if (p.x < cursor || p.x + span > endX) continue;
      const deficit = p.need - p.intake - placed;
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestX = p.x;
      }
      if (deficit >= entry.carbs) {
        at = p.x;
        break;
      }
    }
    if (at < 0) at = bestX;
    // Never on top of a shop-product: that stop is already delivering.
    const clash = pinned.find((p) => at < p.from + gap && at + span > p.from - gap);
    if (clash) at = clash.from + gap;
    at = Math.max(cursor, Math.min(Math.max(0, endX - span), at));
    out.push({
      key: entry.key,
      carbs: entry.carbs,
      ml: entry.ml,
      cont: !!entry.cont,
      from: at,
      to: at + span,
    });
    placed += entry.carbs;
    cursor = at + span + gap;
  }
  return out.sort((a, b) => a.from - b.from);
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

interface Candidate {
  G: number;
  timelines: Timeline[];
  fills: DraftFill[];
  stops: number[];
  carbs: number;
  fluid: number;
  /** The lowest leg's fluid rate as a percentage of the sweat rate — the rider's pointwise floor. */
  worstLegPct: number;
  refills: number;
  /** How far it falls short: [fluid floor pct, fluid ml, usable carb g, carb rate, shop stops]. */
  shortfall: number[];
  /**
   * How unevenly the fills fall, in hours of difference between a vessel's longest and shortest
   * leg. Three loads on a four-leg grid means one of them is drunk over twice the distance of the
   * others — the same bottles, delivering worse, so it only ever breaks a tie.
   */
  raggedness: number;
}

/**
 * How close two plans have to be before they count as equally short. Only used to compare plans
 * that all fall short: a plan that fully covers the ride has a zero shortfall and needs no
 * tolerance to win.
 */
const SHORTFALL_TOLERANCE = [0.5, 25, 3, 1, 0];

/**
 * Falls as little short as possible of what the ride needs; among equals, the plan that costs the
 * rider least — and only then the one that delivers most evenly.
 *
 * Stops rank above the sagging line on the rider's own ruling: shown the ladder on a 200km ride (7
 * stops with the line dipping to 39%, 8 stops dipping to 77%, 9 stops with no dip at all) he took
 * the middle one, and the thing that separates it is not the dip but that its bottles finally hold
 * the whole sweat loss. The greedy stops buying water there; this only sorts what it built.
 */
function compareCandidates(a: Candidate, b: Candidate): number {
  return (
    compareShortfall(a.shortfall, b.shortfall) ||
    a.stops.length - b.stops.length ||
    a.refills - b.refills ||
    b.worstLegPct - a.worstLegPct ||
    a.raggedness - b.raggedness
  );
}

function compareShortfall(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i] - SHORTFALL_TOLERANCE[i]) return -1;
    if (a[i] > b[i] + SHORTFALL_TOLERANCE[i]) return 1;
  }
  return 0;
}

export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const { route, mix, gear, foodLib, shops } = state;
  const D = dist(route);
  const hrs = totalHours(route);
  const sweatRate = sweat(route);
  const sweatLoss = sweatRate * hrs;

  const carbsOn = hrs >= CARB_MIN_HOURS;
  const waterOn = sweatLoss >= route.weight * HYDRATION_BUFFER_ML_PER_KG;

  const { gelVessels, izoVessels } = bucketVessels(gear, mix);

  const target = hrs * cph(route);
  const perFill = izoVessels.length
    ? carbsFill({ fid: 0, gid: izoVessels[0].gid, content: 'izo', from: 0, to: 0 }, gear, mix)
    : 0;
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
  const itemCarbs = items.reduce((a, e) => a + e.carbs, 0);
  const itemMl = items.reduce((a, e) => a + (e.ml || 0), 0);
  /**
   * What the food itself pours in, counted against the line the bottles have to hold.
   *
   * Only what the rider *carries* counts: a bottle of cola in the jersey gets drunk somewhere along
   * the ride, so it genuinely thins out the bottles' job. A cola that has to be bought at a shop
   * cannot do that — it arrives at its stop and nowhere else, so the stretch before the first stop
   * is still on the bottles alone, and pretending otherwise is how a plan ends up with one bottle
   * stretched across a hot 70km.
   */
  const carriedMl = items.filter((e) => !e.needsStop).reduce((a, e) => a + (e.ml || 0), 0);
  const shopItemCount = items.filter((e) => e.needsStop).length;

  // Two stops closer than the merge window are the same stop, so the window is also the shortest
  // leg worth cutting the route into — which is what bounds how fine the grid may get.
  const legCap = Math.max(1, Math.min(MAX_REFILLS, Math.floor(D / minStopX(D))));
  // Every shop-product needs a stop to be bought at, and buying two at the same shop while riding
  // past four others is the arrangement nobody wants.
  const minLegs = Math.max(1, Math.min(legCap, shopItemCount + 1));
  const needFluid = waterOn ? Math.max(0, GREEN * sweatLoss - itemMl) : 0;

  const gelUsed = carbsOn
    ? gelVessels.filter(
        (v) => carbsFill({ fid: 0, gid: v.gid, content: 'gel', from: 0, to: 0 }, gear, mix) > 0,
      )
    : [];
  const izoUsed = carbsOn ? izoVessels.filter(() => perFill > 0) : [];
  const gelGids = new Set(gelUsed.map((v) => v.gid));
  const izoGids = new Set(izoUsed.map((v) => v.gid));

  /**
   * One plan on a grid of `G` legs: every vessel's loads laid out over it, the carb loads the
   * target asks for placed one stream after another, then water top-ups until the fluid line clears
   * the floor everywhere — cheapest first, where "cheap" means the stops it does not add.
   */
  function build(G: number, extraLoads: number, stretch: boolean): Candidate {
    const legHours = hrs / G;
    const xs = gridXs(route, G, shops);
    // The effort each grid point sits at, which is the axis the fluid line lives on.
    const effs = xs.map((x) => eff(route, x));
    const effTotal = effs[G] || 1;
    const timelines: Timeline[] = [];

    const line = (v: Vessel, content: 'izo' | 'gel' | null): Timeline => ({
      gid: v.gid,
      vol: v.vol,
      tailFills: content ? 0 : 1,
      carbStartLeg: 0,
      carbFills: content ? 1 : 0,
      legsPerLoad: 1,
      carbBlockLegs: 1,
      carbContent: content,
      gelLegs: 0,
      gelHours: 0,
      canWater: isAllowed(v, 'water'),
      carbsPerFill: content
        ? carbsFill({ fid: 0, gid: v.gid, content, from: 0, to: 0 }, gear, mix)
        : 0,
    });

    for (const v of gear) {
      if (gelGids.has(v.gid)) {
        const t = line(v, 'gel');
        // The gel lasts as long as its carbs are meant to last, snapped to the grid — long enough
        // to be a real leg, short enough to leave the flask free to carry water afterwards.
        const gelHours = cph(route) > 0 ? t.carbsPerFill / cph(route) : hrs;
        t.gelLegs = Math.max(1, Math.min(G, Math.round(gelHours / legHours)));
        t.gelHours = gelHours;
        timelines.push(t);
      } else if (izoGids.has(v.gid)) {
        const t = line(v, 'izo');
        // One load lasts as long as its carbs are meant to; on a grid finer than that, it spans
        // more than one leg rather than being poured in at twice the rate the ride can use.
        const loadHours = cph(route) > 0 ? t.carbsPerFill / cph(route) : hrs;
        t.legsPerLoad = Math.max(1, Math.round(loadHours / legHours));
        timelines.push(t);
      } else if (isAllowed(v, 'water')) {
        timelines.push(line(v, null));
      }
    }

    /**
     * Carbs the ride can actually use, not the grams on board.
     *
     * Anything arriving faster than `cph()` is thrown away by the same integral the app's coverage
     * bar runs, so two streams overlapping deliver far less than their sum — which is exactly the
     * mistake a coarse grid invites, when a bottle's loads need more legs than the route has left
     * and the gel ends up pouring on top of them. Counting the usable part instead makes the search
     * reject that grid on its own, without a rule about overlaps.
     */
    const usefulCarbs = () => {
      const rate = new Array<number>(G).fill(0);
      for (const t of timelines) {
        for (const b of blocksOf(t, G)) {
          if (b.content === 'water') continue;
          const span = b.toLeg - b.fromLeg;
          if (span <= 0) continue;
          const perLeg = (b.fills * t.carbsPerFill) / (span * legHours);
          for (let leg = b.fromLeg; leg < b.toLeg; leg++) rate[leg] += perLeg;
        }
      }
      const cap = cph(route);
      return rate.reduce((a, r) => a + Math.min(r, cap) * legHours, 0);
    };

    const sequenceCarbs = () => {
      const streams = timelines.filter((t) => t.carbContent && t.canWater);
      // What each stream would take at the rate the ride asks for, in legs.
      const natural = (t: Timeline) =>
        t.carbContent === 'gel'
          ? t.gelHours / legHours
          : (t.carbFills * t.carbsPerFill) / Math.max(1e-9, cph(route)) / legHours;
      const total = streams.reduce((a, t) => a + natural(t), 0);
      // Two ways to lay a short carb stream out, and which one is better is not decidable here: run
      // the loads at the rate the ride asks for and leave the rest of the route to water, or stretch
      // them thinner so they cover it all. The first keeps the bottle free to carry water — the only
      // thing holding the fluid line up when it is the plan's one bottle; the second feeds the whole
      // ride at a lower rate, which `coverage()` prefers whenever some other bottle can do the
      // carrying. So `autoplan` builds both and scores them.
      const scale = stretch && total > 0 && total < G ? G / total : 1;
      // The izo bottles go first and the gel last: the gel is the one load that cannot be refilled,
      // so the ride is better off drinking what *can* be replaced while shops are still being passed,
      // and the flask that carried it is then free to take water for whatever is left.
      let cursor = 0;
      for (const t of streams) {
        if (t.carbContent !== 'izo') continue;
        t.carbStartLeg = Math.min(cursor, Math.max(0, G - 1));
        const perLoad = natural(t) / Math.max(1, t.carbFills);
        t.legsPerLoad = clamp(Math.round(perLoad * scale), 1, Math.max(1, Math.ceil(perLoad)));
        t.carbBlockLegs = t.carbFills * t.legsPerLoad;
        cursor = Math.min(G, t.carbStartLeg + t.carbBlockLegs);
      }
      for (const t of streams) {
        if (t.carbContent !== 'gel') continue;
        t.carbBlockLegs = Math.max(1, Math.round(natural(t) * scale));
        t.carbStartLeg = Math.min(cursor, Math.max(0, G - t.carbBlockLegs));
        t.gelLegs = t.carbBlockLegs;
      }
      // A bottle with no water setting starts on its carbs at the line and stretches them over
      // everything it is asked to cover.
      for (const t of timelines) {
        if (t.carbContent && !t.canWater) t.carbStartLeg = 0;
      }
    };

    // --- carbs: izo loads until the ride is fuelled ------------------------------------------
    // A rider carrying izo-capable bottles leaves home with them mixed, exactly like the gel flask
    // is filled once at home, so one load per izo bottle is the floor. Past that, loads go to the
    // bottle carrying the fewest — a plan that empties one bottle five times while the other rides
    // along full pays for stops it could have shared.
    const needCarbs = Math.max(0, GREEN * target - itemCarbs);
    const izoLines = timelines.filter((t) => t.carbContent === 'izo');
    sequenceCarbs();
    for (let guard = 0; guard < G * Math.max(1, izoLines.length); guard++) {
      if (usefulCarbs() >= needCarbs) break;
      const pick = izoLines
        .filter((t) => t.carbFills < G)
        .sort((a, b) => a.carbFills - b.carbFills || b.carbsPerFill - a.carbsPerFill)[0];
      if (!pick) break;
      const before = usefulCarbs();
      pick.carbFills += 1;
      sequenceCarbs();
      if (usefulCarbs() <= before) {
        pick.carbFills -= 1;
        sequenceCarbs();
        break; // no room left on the route for another load
      }
    }
    for (let i = 0; i < Math.abs(extraLoads); i++) {
      const pick =
        extraLoads > 0
          ? izoLines.filter((t) => t.carbFills < G).sort((a, b) => a.carbFills - b.carbFills)[0]
          : izoLines.filter((t) => t.carbFills > 1).sort((a, b) => b.carbFills - a.carbFills)[0];
      if (!pick) break;
      pick.carbFills += extraLoads > 0 ? 1 : -1;
      sequenceCarbs();
    }

    // --- fluid: top-ups until the line holds the floor everywhere -----------------------------
    const fluidOf = () =>
      timelines.reduce(
        (a, t) =>
          a +
          blocksOf(t, G)
            .filter((b) => b.content !== 'gel')
            .reduce((n, b) => n + b.fills, 0) *
            t.vol,
        0,
      ) + itemMl;
    /** What the bottles carry, ignoring what the rider will buy and drink along the way. */
    const bottleFluid = () => fluidOf() - itemMl;
    const worstOf = () => {
      if (sweatLoss <= 0) return 100;
      const rates = legFluidRates(timelines, G, effs);
      const needPerEffort = sweatLoss / effTotal;
      const carriedPerEffort = carriedMl / effTotal;
      return ((Math.min(...rates) + carriedPerEffort) / needPerEffort) * 100;
    };
    // Only a vessel that may hold water can answer a thirst: an izo-only bottle carries exactly
    // the loads the carbs called for, and mixing another one just to have something to drink is
    // not a plan the rider asked for.
    // The two water stretches of every water-capable vessel are the only things a top-up can buy.
    type Knob = { t: Timeline };
    const knobs: Knob[] = timelines.filter((t) => t.canWater).map((t) => ({ t }));
    const capacityOf = (k: Knob) => layoutOf(k.t, G).tail;
    const countOf = (k: Knob) => k.t.tailFills;
    const setCount = (k: Knob, n: number) => {
      k.t.tailFills = n;
    };

    if (waterOn) {
      for (let guard = 0; guard < G * Math.max(1, knobs.length); guard++) {
        const fluid = fluidOf();
        const worst = worstOf();
        const floorHolds = worst >= COVERAGE_TARGET_PCT;
        // Two ways to be done, and the rider will take whichever comes first: the line never dips,
        // or the bottles already hold every millilitre the ride is going to sweat out. Past that
        // second one another stop buys nothing — the water would ride to the finish unopened — so a
        // shallow dip where one load hands over to the next is the honest price of not stopping.
        const sumHolds = fluid >= needFluid + itemMl;
        if (floorHolds && sumHolds) break;
        // A top-up at a stop the plan already makes is free; one that lands between them costs the
        // rider a pull-over, which is the thing to be stingy with, so each move is scored by the
        // stops it actually adds.
        const stopsNow = stopLegs(timelines, G).size;
        const measure = (k: Knob, n: number) => {
          const was = countOf(k);
          setCount(k, n);
          const move = {
            k,
            n,
            worst: worstOf(),
            fluid: fluidOf(),
            addedStops: stopLegs(timelines, G).size - stopsNow,
          };
          setCount(k, was);
          return move;
        };
        // The next count that actually lifts the *lowest* leg, which is not always one more fill:
        // cutting a 7-leg stretch into 5 pieces instead of 4 leaves the longest piece exactly as
        // long as it was, so the line sags in the same place and the rider stopped for nothing.
        // Going straight to the count that shortens it is what "the legs are too long" really costs.
        const raiseFloor = (k: Knob) => {
          const span = capacityOf(k);
          const m = countOf(k);
          if (span <= 0 || m >= span) return null;
          // Cutting a stretch into more pieces only lifts its lowest leg when the *longest* piece
          // gets shorter, so the next count worth trying is the one that shortens it — computed,
          // not searched, because this runs inside two loops that are already O(grid²).
          const longest = m > 0 ? Math.ceil(span / m) : span;
          const next = m === 0 ? 1 : longest <= 1 ? 0 : Math.ceil(span / (longest - 1));
          if (next <= m || next > span) return null;
          const move = measure(k, next);
          return move.worst > worst + 1e-9 ? move : null;
        };
        const addVolume = (k: Knob) =>
          countOf(k) < capacityOf(k) ? measure(k, countOf(k) + 1) : null;
        const usable = knobs.filter((k) => capacityOf(k) > 0);
        let moves = floorHolds
          ? []
          : (usable.map(raiseFloor).filter(Boolean) as ReturnType<typeof measure>[]);
        // Once the line holds, what is left is a plain volume shortfall — and the cheapest bottle
        // to top up is the one already stopping there.
        if (moves.length === 0 && fluid < needFluid + itemMl) {
          moves = usable.map(addVolume).filter(Boolean) as ReturnType<typeof measure>[];
        }
        // While the line is sagging, the move that lifts it highest wins, even if it costs a stop:
        // a 250ml flask top-up that adds no stop but barely moves the lowest leg is how a plan ends
        // up carrying more water than the ride can drink and still sagging.
        const pick = moves.sort((a, b) =>
          floorHolds
            ? a.addedStops - b.addedStops ||
              a.n - countOf(a.k) - (b.n - countOf(b.k)) ||
              b.fluid - a.fluid
            : b.worst - a.worst ||
              a.addedStops - b.addedStops ||
              a.n - countOf(a.k) - (b.n - countOf(b.k)),
        )[0];
        if (!pick) break;
        // The other way to be done: the bottles already hold every millilitre the ride will sweat
        // out, so the only thing left to buy is a flatter line — worth taking while it is free, not
        // worth a stop. A shallow dip where one load hands over to the next is the honest price.
        const everyLegFed = Math.min(...legFluidRates(timelines, G, effs)) > 0;
        if (sumHolds && everyLegFed && bottleFluid() >= sweatLoss && pick.addedStops > 0) break;
        setCount(pick.k, pick.n);
      }

      // R2: a product the rider can only buy needs a shop to buy it at, and if the bottles never run
      // dry the plan has to make one. Topping a bottle up there is what turns a grid point into a
      // real stop — and it costs the rider nothing they weren't already paying, since they are
      // standing at the shop either way.
      for (let guard = 0; guard < G * Math.max(1, knobs.length); guard++) {
        const want = Math.min(shopItemCount, G - 1);
        const have = stopLegs(timelines, G).size;
        if (have >= want) break;
        const gain = (k: Knob) => {
          if (countOf(k) >= capacityOf(k)) return -1;
          const was = countOf(k);
          setCount(k, was + 1);
          const after = stopLegs(timelines, G).size;
          setCount(k, was);
          return after - have;
        };
        const pick = timelines
          .filter((t) => t.canWater)
          .map((t) => ({ k: { t } as Knob, gain: gain({ t } as Knob) }))
          .filter((m) => m.gain > 0)
          .sort((a, b) => b.gain - a.gain || b.k.t.vol - a.k.t.vol)[0];
        if (!pick) break;
        setCount(pick.k, countOf(pick.k) + 1);
      }

      // Every bottle gets topped up at a stop the plan is already making — that is what standing at
      // a shop is for, and it costs the rider nothing but the seconds to fill. Only there, though:
      // never a stop of its own, and never more water than the ride is going to sweat out. The flask
      // the gel came out of is the clearest case, since an empty flask is pure dead weight, so it
      // gets its first bottle's worth even on a ride that is already carrying enough.
      for (const k of knobs) {
        for (let guard = 0; guard < G; guard++) {
          // The first bottle's worth is free: an empty flask is dead weight, and the stop is one
          // the plan is making anyway. Past that, only while the ride can still drink it.
          const emptyFlask = k.t.carbContent === 'gel' && countOf(k) === 0;
          if (countOf(k) >= capacityOf(k)) break;
          if (!emptyFlask && fluidOf() + k.t.vol > sweatLoss) break;
          const stopsNow = stopLegs(timelines, G).size;
          setCount(k, countOf(k) + 1);
          if (stopLegs(timelines, G).size > stopsNow) {
            setCount(k, countOf(k) - 1);
            break;
          }
        }
      }
    }

    /**
     * How far below the rate the ride asks for a bottle's carbs are being drunk.
     *
     * A load is meant to last `carbs / cph`. On a grid coarser than that a bottle carrying izo
     * trickles: it fuels at two thirds of the rate the ride wants while sitting on water it could
     * have been carrying instead. A bottle that *has* water to fall back on is not allowed to
     * trickle; one that doesn't is, because stretching its loads is the only thing holding the
     * fluid line up when that bottle is all the plan has.
     */
    function carbRateDeficit(): number {
      let worst = 0;
      for (const t of timelines) {
        if (t.carbContent !== 'izo' || !t.canWater) continue;
        const l = layoutOf(t, G);
        if (l.carbLegs <= 0) continue;
        const rate = t.carbsPerFill / ((l.carbLegs / t.carbFills) * legHours);
        worst = Math.max(worst, GREEN * cph(route) - rate);
      }
      return worst;
    }

    const fills = timelines.flatMap((t) => timelineFills(t, G, xs, route));
    // Opening a bottle the rider set off with is not a stop — only refilling one is. So a vessel's
    // *first* fill never asks for a shop, wherever along the route it happens to start.
    const refills: number[] = [];
    for (const t of timelines) {
      fills
        .filter((f) => f.gid === t.gid)
        .sort((a, b) => a.from - b.from)
        .slice(1)
        .forEach((f) => refills.push(f.from));
    }
    const stops = [...new Set(refills.filter((x) => x > 0 && x < D - 1e-9))].sort((a, b) => a - b);
    const carbs = usefulCarbs();
    const fluid = fluidOf();
    const worstLegPct = worstOf();
    return {
      G,
      timelines,
      fills,
      stops,
      carbs,
      fluid,
      worstLegPct,
      refills: fills.length - new Set(fills.map((f) => f.gid)).size,
      raggedness: timelines.reduce((worst, t) => {
        let own = 0;
        for (const b of blocksOf(t, G)) {
          const span = b.toLeg - b.fromLeg;
          let lo = Infinity;
          let hi = 0;
          for (let i = 0; i < b.fills; i++) {
            const len = Math.round(((i + 1) * span) / b.fills) - Math.round((i * span) / b.fills);
            lo = Math.min(lo, len);
            hi = Math.max(hi, len);
          }
          if (b.fills > 0) own += (hi - lo) * legHours;
        }
        return worst + own;
      }, 0),
      shortfall: [
        waterOn ? Math.max(0, COVERAGE_TARGET_PCT - worstLegPct) : 0,
        waterOn ? Math.max(0, needFluid + itemMl - fluid) : 0,
        Math.max(0, needCarbs - carbs),
        carbRateDeficit(),
        Math.max(0, Math.min(shopItemCount, legCap - 1) - stops.length),
      ],
    };
  }

  /**
   * The coarsest grid that carries the ride.
   *
   * Where no grid does — one bottle against a 30°C century — the answer is the coarsest grid that
   * falls as little short as any grid can, not the finest one available. Both are equally honest
   * about the shortfall; only one of them stops the rider eight times to keep a bottle they were
   * never going to fill often enough anyway.
   */
  function search(extraLoads: number): Candidate {
    const tried: Candidate[] = [];
    for (let G = minLegs; G <= legCap; G++) {
      for (const stretch of [false, true]) {
        const cand = build(G, extraLoads, stretch);
        tried.push(cand);
        if (cand.shortfall.every((x) => x <= 1e-9)) return cand;
      }
    }
    const best = tried.reduce((a, b) => (compareCandidates(b, a) < 0 ? b : a));
    return best;
  }

  // Food eaten in the last half hour is food the ride never gets: `rate` lags intake by about that
  // much (`fuel.ts` smooths it with a ~30min time constant, on top of the gut's own drain), so a
  // gel swallowed inside that window still counts as carried, not delivered. One of the layouts
  // below therefore works in a window that stops short of it.
  const ABSORPTION_TAIL_HOURS = 0.5;
  const lateEnd = D * (1 - FINISH_GAP_FRACTION);
  const earlyEnd = Math.max(
    D / 2,
    Math.min(lateEnd, distanceAtTime(route, Math.max(0, hrs - ABSORPTION_TAIL_HOURS))),
  );

  /**
   * The best arrangement of the food the rider already agreed to carry, by the app's own measure.
   * Placement is settled before quantity: a plan that scores badly with the food spread one way may
   * score fine with it spread another, and reaching for one more item from the selection to paper
   * over a bad layout is the thing R5 forbids.
   */
  function evenFoods(cand: Candidate): DraftFood[] {
    return items.length === 0
      ? []
      : placeProducts(items, cand.stops, D, route, POINT_ITEM_SLOT_FRACTION, lateEnd);
  }

  function bestFoods(cand: Candidate, from: DraftFood[]): { foods: DraftFood[]; coverage: number } {
    let best = { foods: from, coverage: coverageOf(state, cand.fills, from) };
    if (items.length === 0) return best;
    const layouts = [
      placeProducts(items, cand.stops, D, route, 0.5, earlyEnd),
      // Only worth asking where the delivery is lumpy to begin with. With nothing but bottles
      // tiling the route evenly, "where is the plan furthest behind" has the same answer
      // everywhere, and the even spread already is that answer.
      ...(shopItemCount > 0 || gelUsed.length > 0
        ? [deficitProducts(state, cand.fills, items, cand.stops, D)]
        : []),
    ];
    for (const foods of layouts) {
      const coverage = coverageOf(state, cand.fills, foods);
      if (coverage > best.coverage) best = { foods, coverage };
    }
    return best;
  }

  let cand = search(0);
  let foods = evenFoods(cand);

  // The sums say how many bottles it takes to *pour in* 85% of the target, but `coverage()`
  // integrates absorption rather than dividing totals, and the two disagree by about a bottle in
  // either direction depending on how the ride is shaped. So the ratio picks the starting plan and
  // the app's own metric settles it: one load up while it still reads short, one down while it
  // stays green. Each of those is a full 160-sample simulation, so the walk is deliberately short.
  if (carbsOn && perFill > 0) {
    let cov = coverageOf(state, cand.fills, foods);
    for (let extra = 1; extra <= MAX_COVERAGE_WALK && cov < COVERAGE_TARGET_PCT; extra++) {
      const richer = search(extra);
      if (richer.carbs <= cand.carbs) break; // no room left on the route
      const richerFoods = evenFoods(richer);
      const richerCov = coverageOf(state, richer.fills, richerFoods);
      if (richerCov <= cov) break;
      cand = richer;
      foods = richerFoods;
      cov = richerCov;
    }
    if (cov >= COVERAGE_TARGET_PCT) {
      const leaner = search(-1);
      if (leaner.carbs < cand.carbs) {
        const leanerFoods = evenFoods(leaner);
        if (coverageOf(state, leaner.fills, leanerFoods) >= COVERAGE_TARGET_PCT) {
          cand = leaner;
          foods = leanerFoods;
        }
      }
    }
  }

  // The bottles are settled; now spend the remaining evaluations on how the food is laid out over
  // them, which costs nothing to change and is the last thing standing between a plan and the best
  // it can do with what the rider packed.
  if (carbsOn) foods = bestFoods(cand, foods).foods;

  const newShops: DraftShop[] = cand.stops
    .filter((x) => !shops.some((s) => Math.abs(s.at - x) < 1e-9))
    .map((x) => ({ at: x }));

  return { fills: cand.fills, foods, newShops };
}
