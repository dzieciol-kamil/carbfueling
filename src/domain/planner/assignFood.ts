/**
 * L2 step 3 — product placement. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 3 (P1-P3, S3).
 *
 * Deterministic, no search: `needsStop` items are pinned to `skeleton.stops` first (S3), then
 * everything else ("carried" products) is spread by carb share across the gaps between them (P2).
 *
 * **This function never invents a stop.** S3 says a `needsStop` product "may create" a stop, but
 * that capacity lives in L1 (`SkeletonOpts.minStopsForProducts`, spec §3.4) — by the time `skeleton`
 * reaches here, whatever stops exist are all there is to pin to. If the selection carries more
 * `needsStop` units than `skeleton.stops` provides, several end up sharing one stop rather than
 * getting one each; see the report on this function's caller for what `minStopsForProducts` would
 * need to be for a given selection.
 */
import { dist } from '../fuel';
import type { DraftFood, FoodSelectionEntry } from '../autoplan';
import type { FoodLibEntry, PlanState } from '../types';
import type { Service, Skeleton } from './types';

/**
 * Same physiological reasoning as C6's carb-stream gut-drain buffer (spec §1.2), applied to
 * products: a gel eaten in the last couple of percent of the route never finishes draining out of
 * `gut` before the ride ends, so it scores as unabsorbed rather than helping. Distinct constant
 * from `assignCarbs.ts`'s (unexported) `CARB_STREAM_FINISH_GAP` because they bound different things
 * — a continuous stream's tail vs. a point product's last placeable km — but the same value and the
 * same reasoning.
 */
const FOOD_FINISH_GAP = 0.02;

/** How far into its own slot a point product is eaten — a quarter in, not on the start line, since
 *  absorption lags intake and `coverage()` rewards the gut already working when the need arrives.
 *  Mirrors `autoplan.ts`'s (unexported) `POINT_ITEM_SLOT_FRACTION`. */
const POINT_ITEM_SLOT_FRACTION = 0.25;

/** Fallback span for a `cont` product whose library entry doesn't declare one. Mirrors
 *  `autoplan.ts`'s (unexported) `DEFAULT_CONT_SPAN_KM`. */
const DEFAULT_CONT_SPAN_KM = 18;

/** `selection`'s counts expanded into one `FoodLibEntry` per unit, in selection order — the order
 *  P2's carb-share placement walks. Unknown keys are skipped (a stale selection referencing a
 *  removed library entry), never thrown. */
function expandSelection(selection: FoodSelectionEntry[], foodLib: FoodLibEntry[]): FoodLibEntry[] {
  const items: FoodLibEntry[] = [];
  for (const entry of selection) {
    const lib = foodLib.find((f) => f.key === entry.key);
    if (!lib) continue;
    for (let i = 0; i < entry.count; i++) items.push(lib);
  }
  return items;
}

/**
 * S3: pins each `needsStop` unit to one of `stopKms`, spreading them across the available stops
 * (`stopItems[j]` goes to `stopKms[floor((j+0.5) * stopKms.length / stopItems.length)]`) rather than
 * stacking every one at the first stop. When there are more items than stops, later units at the
 * same stop are offset by `gap` so they don't render on top of each other. When `stopKms` is empty
 * (no stop exists anywhere on the route), every `needsStop` unit is dropped — there is nowhere legal
 * to place it.
 */
function pinStopItems(stopItems: FoodLibEntry[], stopKms: number[], D: number): DraftFood[] {
  if (stopItems.length === 0 || stopKms.length === 0) return [];
  const gap = Math.max(0.5, D * 0.005);
  const takenAt = new Map<number, number>();
  const pinned: DraftFood[] = [];
  stopItems.forEach((entry, j) => {
    const idx = Math.min(
      stopKms.length - 1,
      Math.floor(((j + 0.5) * stopKms.length) / stopItems.length),
    );
    const taken = takenAt.get(idx) ?? 0;
    takenAt.set(idx, taken + 1);
    const at = stopKms[idx] + taken * gap;
    pinned.push({
      key: entry.key,
      carbs: entry.carbs,
      ml: entry.ml,
      cont: false,
      from: at,
      to: at,
    });
  });
  return pinned;
}

/**
 * Lays `items` out over `[startX, endX)` so each gets a slice proportional to **its own carb
 * content**, not an equal slice of distance — three gels and two packs of chews spread by count
 * would dump most of their carbs in the first few km. A point item is eaten
 * `POINT_ITEM_SLOT_FRACTION` into its own slice; a `cont` item starts at the top of its slice and
 * runs for its declared span (or the slice, whichever is shorter).
 */
function spreadInWindow(items: FoodLibEntry[], startX: number, endX: number): DraftFood[] {
  const n = items.length;
  if (n === 0) return [];
  const window = Math.max(0, endX - startX);
  const totalCarbs = items.reduce((a, e) => a + e.carbs, 0);
  let cursor = startX;

  return items.map((entry) => {
    const share = totalCarbs > 0 ? (window * entry.carbs) / totalCarbs : window / n;
    const slotFrom = cursor;
    cursor = slotFrom + share;

    if (entry.cont) {
      const length = Math.min(entry.span || DEFAULT_CONT_SPAN_KM, share);
      const from = Math.min(endX, slotFrom);
      const to = Math.min(endX, from + length);
      return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: true, from, to };
    }

    const x = Math.min(endX, Math.max(startX, slotFrom + share * POINT_ITEM_SLOT_FRACTION));
    return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: false, from: x, to: x };
  });
}

/**
 * P2's "carried" half: split `[0, endX)` into the gaps left by `pinned`'s stop-products (so a
 * carried item is never dropped on top of one), then hand each gap the items whose position in the
 * selection's own cumulative-carb sequence falls inside that gap's share of the total span — a long
 * gap gets proportionally more of the food, so a stop-product never splits the ride into "all the
 * carried items before it, nothing after" (the exact failure P1 exists to catch).
 */
function spreadCarried(
  carried: FoodLibEntry[],
  pinned: DraftFood[],
  D: number,
  endX: number,
): DraftFood[] {
  if (carried.length === 0) return [];
  const gap = Math.max(0.5, D * 0.005);

  const edges = [0, ...pinned.map((p) => p.from).sort((a, b) => a - b), endX];
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

  return perWindow.flatMap((list, i) => spreadInWindow(list, windows[i][0], windows[i][1]));
}

/**
 * Preference order for which `skeleton.stops` host `needsStop` items: stops a carb/water `Service`
 * is already anchored to (`filledAtStop`) first — piggybacking a product onto a stop the plan is
 * already making is the S1 spirit (merge, don't multiply stops) — falling back to every stop only
 * when there are more `needsStop` units than serviced stops to hold them. Order is preserved
 * (ascending km) either way, since `pinStopItems` spreads by position in that order.
 */
function candidateStopKms(skeleton: Skeleton, services: Service[], neededCount: number): number[] {
  const allKms = skeleton.stops.map((s) => s.km);
  const servicedKms = new Set(
    services
      .filter((s): s is Service & { filledAtStop: number } => s.filledAtStop !== null)
      .map((s) => skeleton.stops[s.filledAtStop]?.km)
      .filter((km): km is number => km !== undefined),
  );
  const preferred = allKms.filter((km) => servicedKms.has(km));
  return preferred.length > 0 && neededCount <= preferred.length ? preferred : allKms;
}

/**
 * Places `selection` onto the route: `needsStop` units pin to `skeleton.stops` (S3), everything
 * else spreads by carb share across the gaps between them (P2), stopping short of the finish
 * (same reasoning as C6). See the module doc for what this function does **not** do — invent a
 * stop for a `needsStop` item that doesn't have one.
 */
export function assignFood(
  skeleton: Skeleton,
  services: Service[],
  state: PlanState,
  selection: FoodSelectionEntry[],
): DraftFood[] {
  const { route, foodLib } = state;
  const D = dist(route);
  const endX = D * (1 - FOOD_FINISH_GAP);

  const items = expandSelection(selection, foodLib);
  if (items.length === 0) return [];

  const stopItems = items.filter((e) => e.needsStop);
  const carried = items.filter((e) => !e.needsStop);

  const stopKms = candidateStopKms(skeleton, services, stopItems.length);
  const pinned = pinStopItems(stopItems, stopKms, D);
  const spread = spreadCarried(carried, pinned, D, endX);

  return [...pinned, ...spread].sort((a, b) => a.from - b.from);
}
