import { partArray, partsOf } from './fuel';
import type { Fill, FoodItem, ShopStop, Vessel } from './types';

export interface Bounds {
  lo: number;
  hi: number;
}

export function fillBounds(fill: Fill, siblings: Fill[], distanceKm: number): Bounds {
  let lo = 0;
  let hi = distanceKm;
  siblings.forEach((x) => {
    if (x.fid === fill.fid) return;
    if (x.to <= fill.from) lo = Math.max(lo, x.to);
    else if (x.from >= fill.to) hi = Math.min(hi, x.from);
  });
  return { lo, hi };
}

export interface FillMove {
  from: number;
  to: number;
  /** The neighbour that traded places with the dragged fill, at its new position. */
  swap?: { fid: number; from: number; to: number };
}

/**
 * The neighbour a fill would trade places with: the closest sibling on the side it is
 * being dragged towards, or null when nothing is in the way.
 */
function neighbourInDirection(fill: Fill, siblings: Fill[], dir: 1 | -1): Fill | null {
  let best: Fill | null = null;
  siblings.forEach((o) => {
    if (o.fid === fill.fid) return;
    if (dir > 0) {
      if (o.from < fill.to) return;
      if (!best || o.from < best.from) best = o;
    } else {
      if (o.to > fill.from) return;
      if (!best || o.to > best.to) best = o;
    }
  });
  return best;
}

/**
 * Trade places with `other`: both keep their width and the pair keeps its outer span,
 * so only the two starts change and any gap between them survives untouched.
 */
function swapWith(fill: Fill, other: Fill, dir: 1 | -1): FillMove {
  const width = fill.to - fill.from;
  const otherWidth = other.to - other.from;
  if (dir > 0) {
    return {
      from: other.to - width,
      to: other.to,
      swap: { fid: other.fid, from: fill.from, to: fill.from + otherWidth },
    };
  }
  return {
    from: other.from,
    to: other.from + width,
    swap: { fid: other.fid, from: fill.to - otherWidth, to: fill.to },
  };
}

export function moveFill(
  fill: Fill,
  siblings: Fill[],
  distanceKm: number,
  deltaKm: number,
): FillMove {
  const width = fill.to - fill.from;
  const want = Math.max(0, Math.min(distanceKm - width, Math.round(fill.from + deltaKm)));
  const min = Math.max(2, Math.round(distanceKm * 0.01));

  // Dragged far enough past the neighbour's midpoint? Then the two swap places instead
  // of the dragged fill piling up against it.
  const dir = want > fill.from ? 1 : want < fill.from ? -1 : 0;
  if (dir !== 0) {
    const other = neighbourInDirection(fill, siblings, dir);
    if (other) {
      const mid = (other.from + other.to) / 2;
      const leadingEdge = dir > 0 ? want + width : want;
      if (dir > 0 ? leadingEdge >= mid : leadingEdge <= mid) return swapWith(fill, other, dir);
    }
  }

  let lo = 0;
  let hi = distanceKm;
  siblings.forEach((o) => {
    if (o.fid === fill.fid) return;
    if (o.to <= want) lo = Math.max(lo, o.to);
    else if (o.from >= want + width) hi = Math.min(hi, o.from);
    else if (o.from <= want) lo = Math.max(lo, o.to);
    else hi = Math.min(hi, o.from);
  });
  const room = hi - lo;
  if (room >= width) {
    const from = Math.max(lo, Math.min(hi - width, want));
    return { from, to: from + width };
  }
  if (room >= min) return { from: lo, to: hi };
  return { from: fill.from, to: fill.to };
}

export function resizeFillLeft(
  fill: Fill,
  bounds: Bounds,
  deltaKm: number,
  originalFrom: number,
): number {
  return Math.max(bounds.lo, Math.min(fill.to - 2, Math.round(originalFrom + deltaKm)));
}

export function resizeFillRight(
  fill: Fill,
  bounds: Bounds,
  deltaKm: number,
  originalTo: number,
): number {
  return Math.min(bounds.hi, Math.max(fill.from + 2, Math.round(originalTo + deltaKm)));
}

export function rescalePositions(
  pos: number[] | undefined,
  oldFrom: number,
  oldTo: number,
  newFrom: number,
  newTo: number,
): number[] | undefined {
  if (!pos) return undefined;
  const span = Math.max(0.001, oldTo - oldFrom);
  return pos.map((v) => newFrom + ((v - oldFrom) * (newTo - newFrom)) / span);
}

/** Free stretches narrower than this are slivers, not somewhere a fill can go. */
export const MIN_GAP_KM = 4;

/**
 * The free stretches on a vessel's lane, walking it left to right. Sorts first because
 * fills keep their slot in the `fills` array no matter where they sit on the lane: a
 * fill added into the widest gap lands left of older ones, so stored order stops
 * matching lane order. Walking it unsorted would step backwards and report a "gap"
 * straddling an existing fill.
 */
export function gaps(fillsOfVessel: Fill[], distanceKm: number): [number, number][] {
  const out: [number, number][] = [];
  let cur = 0;
  fillsOfVessel
    .slice()
    .sort((a, b) => a.from - b.from)
    .forEach((f) => {
      if (f.from - cur > MIN_GAP_KM) out.push([cur, f.from]);
      cur = Math.max(cur, f.to);
    });
  if (distanceKm - cur > MIN_GAP_KM) out.push([cur, distanceKm]);
  return out;
}

export function bestGapSpan(
  gapsArr: [number, number][],
  distanceKm: number,
): { from: number; to: number } | null {
  if (!gapsArr.length) return null;
  const best = gapsArr.slice().sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const span = Math.min(best[1] - best[0], Math.max(20, Math.round(distanceKm * 0.28)));
  return { from: Math.round(best[0]), to: Math.round(best[0] + span) };
}

export function dragGelPart(
  fill: Fill,
  gear: Vessel[],
  k: number,
  deltaKm: number,
  distanceKm: number,
): number[] {
  const n = partsOf(fill, gear);
  const arr0 = partArray(fill, gear);
  const p0 = arr0[k];
  const min = Math.max(1, Math.round(distanceKm * 0.004));
  const arr = fill.pos && fill.pos.length === n ? fill.pos.slice() : arr0.slice();
  const lo = k > 0 ? arr[k - 1] + min : fill.from;
  const hi = k < arr.length - 1 ? arr[k + 1] - min : fill.to;
  arr[k] = Math.max(lo, Math.min(hi, Math.round(p0 + deltaKm)));
  return arr;
}

export function moveFood(
  food: FoodItem,
  distanceKm: number,
  deltaKm: number,
): { from: number; to: number } {
  const width = food.to - food.from;
  const from = Math.max(0, Math.min(distanceKm - width, Math.round(food.from + deltaKm)));
  return { from, to: from + width };
}

export function resizeFoodLeft(food: FoodItem, deltaKm: number, originalFrom: number): number {
  return Math.max(0, Math.min(food.to - 1, Math.round(originalFrom + deltaKm)));
}

export function resizeFoodRight(
  food: FoodItem,
  distanceKm: number,
  deltaKm: number,
  originalTo: number,
): number {
  return Math.min(distanceKm, Math.max(food.from + 1, Math.round(originalTo + deltaKm)));
}

export function moveShop(shop: ShopStop, distanceKm: number, deltaKm: number): number {
  return Math.max(0, Math.min(distanceKm, Math.round(shop.at + deltaKm)));
}

export function clampFillToDistance(fill: Fill, distanceKm: number): Fill {
  if (fill.to <= distanceKm) return fill;
  const width = Math.min(fill.to - fill.from, distanceKm);
  const to = distanceKm;
  const from = to - width;
  return { ...fill, from, to, pos: rescalePositions(fill.pos, fill.from, fill.to, from, to) };
}

export function clampFoodToDistance(food: FoodItem, distanceKm: number): FoodItem {
  if (food.to <= distanceKm) return food;
  const width = Math.min(food.to - food.from, distanceKm);
  const to = distanceKm;
  const from = to - width;
  return { ...food, from, to };
}

export function clampShopToDistance(shop: ShopStop, distanceKm: number): ShopStop {
  if (shop.at <= distanceKm) return shop;
  return { ...shop, at: distanceKm };
}

export function nextShopAt(shops: ShopStop[], distanceKm: number): number {
  const lastAt = shops.length ? Math.max(...shops.map((s) => s.at)) : 0;
  return Math.round((lastAt + distanceKm) / 2);
}

export function moveListItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
