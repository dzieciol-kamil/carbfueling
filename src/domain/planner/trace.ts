/**
 * W16 (2026-08-29): plain console trace of the `plan()` pipeline (`index.ts`), one `console.group`
 * per stage, in pipeline order. Requested as a way for the owner to watch the engine think while
 * testing in the browser — deliberately just printing, not a frame/event data structure, and not
 * wired to anything else (no `globalThis` stash for later consumption, no animation hook). See
 * `index.ts`'s `plan()` for where each stage is called.
 *
 * **Off by default** — silent in the test suite and in production. Two ways to turn it on:
 *   - from code: `setPlannerTrace(true)`.
 *   - from a running app's DevTools console, no rebuild needed:
 *     `window.__AUTOPLAN_TRACE__ = true`
 *     then re-run autoplan. Read via `globalThis` at call time (`isPlannerTraceOn`), so it takes
 *     effect on the very next `plan()` call — no need to touch the module flag at all.
 *
 * Every `trace*` function here checks `isPlannerTraceOn()` itself and returns immediately when
 * off, so call sites in `index.ts`/`prune.ts` never need their own `if` guard.
 */
import { planSummary } from '../fuel';
import type { DraftFood, FoodSelectionEntry } from '../autoplan';
import type { FoodItem, PlanState } from '../types';
import { servicesToFills } from './services';
import type { Service, Skeleton } from './types';

let enabled = false;

/** Programmatic on/off switch. */
export function setPlannerTrace(on: boolean): void {
  enabled = on;
}

/** The DevTools escape hatch: `window.__AUTOPLAN_TRACE__ = true` (browser `window` IS
 *  `globalThis`), checked fresh on every call so flipping it takes effect immediately without a
 *  rebuild or reimport. */
export function isPlannerTraceOn(): boolean {
  return enabled || (globalThis as Record<string, unknown>).__AUTOPLAN_TRACE__ === true;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const r0 = (x: number) => Math.round(x);

export function traceInput(state: PlanState, selection: FoodSelectionEntry[]): void {
  if (!isPlannerTraceOn()) return;
  const { route, mix, gear } = state;
  console.groupCollapsed(
    `[autoplan] 1. Input — ${r1(route.distance)}km, ${route.hours}h${route.minutes}m, ` +
      `${route.temp}°C, ${route.intensity} intensity, ${route.weight}kg`,
  );
  console.table(
    gear.map((v) => ({ id: v.gid, name: v.name, volMl: v.vol, allowed: v.allowed.join('/') })),
  );
  console.log(
    `mix: izo ${mix.conc} g/100ml (ratio ${mix.ratio}), gel ${mix.gelConc} g/100ml (ratio ${mix.gelRatio})`,
  );
  console.table(selection.map((e) => ({ key: e.key, count: e.count })));
  console.groupEnd();
}

export function traceSkeleton(skeleton: Skeleton, latticeSize: number): void {
  if (!isPlannerTraceOn()) return;
  console.groupCollapsed(
    `[autoplan] 2. Skeleton (L1) — ${latticeSize} candidate position(s) → ${skeleton.stops.length} ` +
      `stop(s)${skeleton.shortfall ? ' — SHORTFALL' : ''}`,
  );
  console.table(skeleton.stops.map((s) => ({ km: r1(s.km), origin: s.origin })));
  console.table(
    skeleton.legs.map((l) => ({
      fromKm: r1(l.fromKm),
      toKm: r1(l.toKm),
      hours: r1(l.hours),
      fluidNeedMl: r0(l.fluidNeedMl),
      carbNeedG: r0(l.carbNeedG),
      absorbCapG: r0(l.absorbCapG),
    })),
  );
  if (skeleton.shortfall) {
    console.log('shortfall:', {
      fluidMl: skeleton.shortfall.fluidMl,
      worstLegPct: skeleton.shortfall.worstLegPct,
      carbsG: skeleton.shortfall.carbsG,
    });
  }
  console.groupEnd();
}

function traceServiceTable(services: Service[]): void {
  console.table(
    services.map((s) => ({
      vessel: s.vesselId,
      fromKm: r1(s.fromKm),
      toKm: r1(s.toKm),
      content: s.content,
      filledAtStop: s.filledAtStop ?? 'home',
      pos: s.pos ? s.pos.map(r1).join(', ') : '',
    })),
  );
}

export function traceAssignCarbs(carbs: Service[]): void {
  if (!isPlannerTraceOn()) return;
  console.groupCollapsed(`[autoplan] 3. assignCarbs — ${carbs.length} service(s)`);
  traceServiceTable(carbs);
  console.groupEnd();
}

export function traceAssignWater(added: Service[]): void {
  if (!isPlannerTraceOn()) return;
  console.groupCollapsed(`[autoplan] 4. assignWater — ${added.length} service(s) added`);
  traceServiceTable(added);
  console.groupEnd();
}

export function traceAssignFood(foods: DraftFood[], selection: FoodSelectionEntry[]): void {
  if (!isPlannerTraceOn()) return;
  const offered = selection.reduce((a, e) => a + e.count, 0);
  console.groupCollapsed(
    `[autoplan] 5. assignFood — placed ${foods.length}/${offered} offered unit(s)`,
  );
  console.table(foods.map((f) => ({ key: f.key, from: r1(f.from), to: r1(f.to) })));
  console.groupEnd();
}

export function traceTidy(
  before: { stops: number; services: number },
  after: { stops: number; services: number },
): void {
  if (!isPlannerTraceOn()) return;
  console.groupCollapsed(
    `[autoplan] 6. tidy — stops ${before.stops}→${after.stops}, services ${before.services}→${after.services}`,
  );
  console.log(
    'before/after counts only: tidy.ts runs sub-steps A–E (drop degenerate spans, S7 spent-gel ' +
      'water, F6 free top-ups, drop unused stops) internally and returns just the final result, so ' +
      'the individual sub-steps are not separately observable without restructuring it.',
  );
  console.groupEnd();
}

/** Opens the group `pruneUnneededFood`'s own per-candidate lines (`tracePruneCandidate`/
 *  `tracePruneSkipped`, called from inside `prune.ts`) print into — must be opened before that call
 *  runs and closed by `tracePruneEnd` after, so the two live in `index.ts` around the call rather
 *  than inside one function here. */
export function tracePruneStart(): void {
  if (!isPlannerTraceOn()) return;
  console.groupCollapsed('[autoplan] 7. prune');
}

export function tracePruneEnd(removed: DraftFood[], survived: DraftFood[]): void {
  if (!isPlannerTraceOn()) return;
  console.log(`removed ${removed.length}, survived ${survived.length}`);
  if (removed.length > 0) {
    console.table(removed.map((f) => ({ key: f.key, from: r1(f.from) })));
  }
  console.groupEnd();
}

/** Called from `prune.ts`'s own loop — the only way to report *why* a kept product was rejected
 *  (which of the three floors blocked its removal) without changing what `pruneUnneededFood`
 *  returns or duplicating its decision logic here. */
export function tracePruneCandidate(
  candidate: DraftFood,
  removed: boolean,
  floors: { coverageOk: boolean; hydrationOk: boolean; nominalOk: boolean },
): void {
  if (!isPlannerTraceOn()) return;
  if (removed) {
    console.log(`  removed: ${candidate.key} @ ${r1(candidate.from)}km`);
    return;
  }
  const blockedBy = [
    !floors.coverageOk && 'coverage',
    !floors.hydrationOk && 'hydration',
    !floors.nominalOk && 'nominal grams',
  ]
    .filter((x): x is string => Boolean(x))
    .join(', ');
  console.log(`  kept: ${candidate.key} @ ${r1(candidate.from)}km — blocked by ${blockedBy}`);
}

/** Called from `prune.ts` when rule 3 skips the pass outright (baseline already below a floor) —
 *  the loop that would otherwise call `tracePruneCandidate` never runs, so this is the only trace
 *  line that case gets. */
export function tracePruneSkipped(reason: string): void {
  if (!isPlannerTraceOn()) return;
  console.log(`  skipped: ${reason} — rule 3 (don't prune a short plan shorter)`);
}

export function traceResult(
  state: PlanState,
  services: Service[],
  foods: DraftFood[],
  stopCount: number,
): void {
  if (!isPlannerTraceOn()) return;
  // Same synthetic-PlanState trick `prune.ts`'s own `score()` uses — builds the real, shipped
  // `planSummary()` from a draft `(services, foods)` pair, purely for this printout.
  const draftFoods: FoodItem[] = foods.map((f, i) => ({ ...f, id: i, name: f.key }));
  const draftFills = servicesToFills(services, state.gear).map((f, i) => ({ ...f, fid: i }));
  const summary = planSummary({ ...state, fills: draftFills, foods: draftFoods });
  console.groupCollapsed(
    `[autoplan] 8. Result — coverage ${summary.coverage}%, hydration ${summary.hydrationPct}%, ${stopCount} stop(s)`,
  );
  console.table([
    {
      coverage: `${summary.coverage}%`,
      hydrationPct: `${summary.hydrationPct}%`,
      totalCarbs: `${r0(summary.totalCarbs)}g`,
      target: `${r0(summary.target)}g`,
      stops: stopCount,
    },
  ]);
  console.groupEnd();
}
