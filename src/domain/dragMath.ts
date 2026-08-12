import { partArray, partsOf } from './fuel';
import type { Fill, FoodItem, Stop, Vessel } from './types';

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

export function moveFill(
  fill: Fill,
  siblings: Fill[],
  distanceKm: number,
  deltaKm: number,
): { from: number; to: number } {
  const width = fill.to - fill.from;
  const want = Math.max(0, Math.min(distanceKm - width, Math.round(fill.from + deltaKm)));
  const min = Math.max(2, Math.round(distanceKm * 0.01));
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

export function gaps(fillsOfVessel: Fill[], distanceKm: number): [number, number][] {
  const out: [number, number][] = [];
  let cur = 0;
  fillsOfVessel.forEach((f) => {
    if (f.from - cur > 4) out.push([cur, f.from]);
    cur = Math.max(cur, f.to);
  });
  if (distanceKm - cur > 4) out.push([cur, distanceKm]);
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

export function moveStop(stop: Stop, distanceKm: number, deltaKm: number): number {
  return Math.max(0, Math.min(distanceKm, Math.round(stop.at + deltaKm)));
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

export function clampStopToDistance(stop: Stop, distanceKm: number): Stop {
  if (stop.at <= distanceKm) return stop;
  return { ...stop, at: distanceKm };
}

export function nextStopAt(stops: Stop[], distanceKm: number): number {
  const lastAt = stops.length ? Math.max(...stops.map((s) => s.at)) : 0;
  return Math.round((lastAt + distanceKm) / 2);
}

export function moveListItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
