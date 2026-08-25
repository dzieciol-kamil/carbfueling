import { dist, distanceAtTime, prof, totalHours } from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  Stop,
  Vessel,
} from './types';
import { plan } from './planner/index';
import { servicesToFills } from './planner/services';

export const CONCENTRATED_MIX_THRESHOLD_G_PER_100ML = 15;

/** How far an existing `Stop` may sit from a planned stop and still be used instead of a new one. */
export const STOP_SNAP_KM = 3;

/** Shortest leg worth its own fill — below this a stop is bookkeeping, not a refill. */
const MIN_LEG_KM = 1;

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
export type DraftStop = Omit<Stop, 'id' | 'name'>;

export interface FoodSelectionEntry {
  key: string;
  count: number;
}

export interface AutoplanResult {
  fills: DraftFill[];
  foods: DraftFood[];
  newStops: DraftStop[];
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
  /**
   * The bottle held back to ride alongside a concentrated mix with plain water in it. Nothing reads
   * this: the reservation *is* the removal from `izoVessels`, after which `build` finds the vessel
   * carrying no carbs and lays it out as a water bottle like any other. It is returned because a
   * bottle silently missing from a pool is the kind of thing that needs a name to be checkable.
   */
  reservedWaterVessel: Vessel | null;
} {
  const gelVessels = gear.filter((v) => isAllowed(v, 'gel'));
  const gelGids = new Set(gelVessels.map((v) => v.gid));
  const nonGel = gear.filter((v) => !gelGids.has(v.gid));

  const izoCandidates = nonGel.filter((v) => isAllowed(v, 'izo'));
  const waterOnly = nonGel.filter((v) => !isAllowed(v, 'izo'));

  // A syrup-strength mix is drunk with water on the side, so the biggest bottle is held back to
  // carry it — but only a bottle the rider allows water in can do that job. Reserving one that can
  // hold nothing but izo takes it out of the izo pool and hands it to a water side that then
  // refuses it, and the largest bottle on the bike rides the whole day empty. Where no izo bottle
  // may hold water, there is nothing to reserve and every one of them stays on izo.
  const waterCapable = izoCandidates.filter((v) => isAllowed(v, 'water'));
  let reservedWaterVessel: Vessel | null = null;
  let izoVessels = izoCandidates;
  if (mix.conc > CONCENTRATED_MIX_THRESHOLD_G_PER_100ML && waterCapable.length > 0) {
    reservedWaterVessel = waterCapable.reduce((a, b) => (b.vol > a.vol ? b : a));
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

/** `placeItemsEvenly` over an explicit window — used to fill the gaps between stop-products. */
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

/** The nearest existing stop, when one sits close enough to be this stop rather than a new one. */
function snapToStop(x: number, stops: Stop[], D: number): number {
  let best: number | null = null;
  for (const s of stops) {
    if (s.at <= 0 || s.at >= D) continue;
    if (Math.abs(s.at - x) > STOP_SNAP_KM) continue;
    if (best === null || Math.abs(s.at - x) < Math.abs(best - x)) best = s.at;
  }
  return best === null ? x : best;
}

/**
 * Whether a point on the route is somewhere a bought product could actually be eaten: out on the
 * route, and clear of the finish gap. One rule, because three things hang off it — where the
 * markers below may go, where `pinStopItems` will put the products, and whether their carbs are
 * counted at all — and a plan that counts a product it cannot place is worse than one that places
 * it badly.
 */
function isBuyableX(x: number, D: number): boolean {
  return x > 0 && x <= D * (1 - FINISH_GAP_FRACTION);
}

/** Legs are equal slices of *time*: on a hilly route that makes them unequal in km, as it should. */
export function gridXs(route: RouteInput, G: number, stops: Stop[]): number[] {
  const D = dist(route);
  const hrs = totalHours(route);
  const raws = [0];
  for (let i = 1; i < G; i++) raws.push(distanceAtTime(route, (hrs * i) / G));
  raws.push(D);
  const xs = [0];
  for (let i = 1; i < G; i++) {
    const snapped = snapToStop(raws[i], stops, D);
    // A stop only takes the boundary if it still leaves a leg on either side of it. On a climb the
    // legs are shorter in km than the 3km a snap may move a point, so without the second half of
    // this test a stop past the next boundary would pull this one in front of it and the grid — and
    // with it the fills and their stops — would run backwards.
    const fits = snapped > xs[i - 1] + MIN_LEG_KM && snapped < raws[i + 1] - MIN_LEG_KM;
    xs.push(fits ? snapped : raws[i]);
  }
  xs.push(D);
  return xs;
}

/**
 * Where the products go: the stop-products pinned to stops, everything else spread across the
 * stretches between them.
 *
 * A cola is bought, not carried, so it can only be eaten where the plan already pulls over — and
 * spread across those stops rather than bought four at a time at the first one. The rest of the
 * selection then fills the gaps in between, each gap taking a share of the items proportional to
 * how much of the route it is, which is what keeps a stop-product from splitting the ride into "all
 * the gels before it, nothing after".
 */
export function pinStopItems(items: FoodLibEntry[], stops: number[], D: number): DraftFood[] {
  const gap = Math.max(0.5, D * 0.005);
  const usable = stops.filter((x) => isBuyableX(x, D)).sort((a, b) => a - b);
  const stopItems = items.filter((e) => e.needsStop);
  const pinned: DraftFood[] = [];
  // How many products this stop has already been given. Counted per stop rather than by measuring
  // distances: the second product sits exactly `gap` away, which any distance test either misses or
  // has to be widened for, and then the third lands on top of the second.
  const takenAt = new Map<number, number>();
  stopItems.forEach((entry, j) => {
    if (usable.length === 0) return;
    const idx = Math.min(
      usable.length - 1,
      Math.floor(((j + 0.5) * usable.length) / stopItems.length),
    );
    const taken = takenAt.get(idx) || 0;
    takenAt.set(idx, taken + 1);
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

export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const draft = plan(state, selection);

  const fills = servicesToFills(draft.services, state.gear);

  // Only genuinely new stops go in `newStops` — a stop the skeleton reused (rider-placed or a
  // surviving auto stop) is already in `state.stops`, and `applyAutoplan` appends `newStops` to
  // that list rather than replacing it.
  const newStops: DraftStop[] = draft.stops.filter(
    (s) => !state.stops.some((existing) => Math.abs(existing.at - s.at) < 1e-9),
  );

  return { fills, foods: draft.foods, newStops };
}
