/**
 * L3's first narrow application — a post-fact pruning pass over what `assignFood` placed. See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §5 ("verify, repair"). This is
 * deliberately NOT L1/L2 rework: the owner rejected inverting the pipeline (bottles before
 * products) in favour of a smaller idea of his own — build the plan exactly as today, then try
 * removing placed products one at a time and drop any whose removal leaves the plan still green
 * ("może zamiast odwracać układanie, to może zróbmy post fact sprawdzenie i ewentualne usuwanie
 * produktów, czy jak usunę to czy tamto, to czy nadal jest zielono"). Nothing about `assignCarbs`,
 * `assignFood`'s placement cap, `placedSelection()`, or L1 changes.
 *
 * Scores with the REAL `planSummary()` — the same function the app's summary cards read, not an
 * internal estimate and not `legContribution`. That is the whole point of a post-fact check: the
 * question is whether the *shipped metric* still reads green, so ask the shipped metric.
 *
 * Lives as its own module (not a `tidy.ts` step) because it operates one level up from tidy's other
 * steps: A–D there reason entirely in the internal `Skeleton`/`Leg` proxy (`FLUID_FLOOR_FRACTION`
 * against `Leg.fluidNeedMl`, `deliveredShare`) and never call into `fuel.ts`'s top-level summary —
 * this pass does nothing BUT call into it, converting `Service[]`/`DraftFood[]` into a synthetic
 * `PlanState` the way the rest of the app eventually does (`servicesToFills`) purely so it can ask
 * the same question the UI's coverage/hydration cards ask. Keeping that black-box, shipped-metric
 * check separate from tidy's structural repairs (S7, F6, dropping unused stops, V1/S1 asserts) keeps
 * each module answerable to one question.
 */
import { COVERAGE_TARGET_PCT, HYDRATION_TARGET_PCT, planSummary } from '../fuel';
import type { DraftFood, FoodSelectionEntry } from '../autoplan';
import type { FoodItem, PlanState } from '../types';
import { expandSelection } from './assignFood';
import { servicesToFills } from './services';
import type { Service } from './types';

/** Scores a candidate `(services, foods)` pair with the real, shipped `planSummary()`.
 *  `state.fills`/`state.foods` (the rider's CURRENT saved plan) are never read here — only
 *  `route`/`mix`/`gear` are borrowed from `state`, the same way `index.ts`'s pipeline itself only
 *  ever treats those as the fixed environment a draft is built against. */
function score(state: PlanState, services: Service[], foods: DraftFood[]) {
  const draftFoods: FoodItem[] = foods.map((f, i) => ({ ...f, id: i, name: f.key }));
  const draftFills = servicesToFills(services, state.gear).map((f, i) => ({ ...f, fid: i }));
  return planSummary({ ...state, fills: draftFills, foods: draftFoods });
}

/**
 * Later in the rider's own selection order = lower priority — his own ruling: the order reflects
 * his reasons (a banana placed before chews because it spoils), not carb density, so it must not be
 * re-derived from anything about the items themselves. Keyed by product, not by individual unit:
 * duplicate units of the same product are fungible for priority purposes (nothing distinguishes
 * "gel #2" from "gel #3" other than where `assignFood` happened to place it).
 */
function keyPriority(
  selection: FoodSelectionEntry[],
  foodLib: PlanState['foodLib'],
): Map<string, number> {
  const expanded = expandSelection(selection, foodLib);
  const priority = new Map<string, number>();
  expanded.forEach((item, i) => priority.set(item.key, i));
  return priority;
}

/**
 * Post-fact pruning: try removing `foods` one at a time, lowest selection-priority first (the
 * rider's last pick tried first, working backwards), re-scoring the WHOLE remaining plan with
 * `planSummary()` after each removal. A removal is kept only if the plan is still green afterward.
 * Greedy and sequential — never evaluate-all-then-drop-all — because removing two products can cost
 * more than the sum of removing each alone. The traversal order is fixed up front from the original
 * `foods`/`selection` and never revisited (never reorders what survives).
 *
 * Never touches `services` or stops — only `foods` shrinks — so V1 (vessel refill anchoring) and S1
 * (stop spacing), both already asserted by `tidy()`, cannot be disturbed by this pass.
 *
 * "Still green":
 *  - `coverage >= COVERAGE_TARGET_PCT` always — this is the rider's own "czy nadal jest zielono".
 *  - for a `needsStop` item specifically, ALSO `hydrationPct >= HYDRATION_TARGET_PCT` (S3: a cola
 *    buys fluid as well as carbs, so removing one can cost hydration, not just carb coverage) — but
 *    only when the plan started hydration-green. A plan that was already hydration-short before
 *    pruning touched anything is not this pass's fault to fix or to be blocked by.
 *  - ALSO `totalCarbs / target >= COVERAGE_TARGET_PCT / 100` — the plan's *nominal* carb ratio.
 *    `coverage` is absorption-adjusted and saturates at 100 once the gut ceiling is reached, so past
 *    that point it stops rewarding extra placed grams and is blind to how much food the plan
 *    actually tells the rider to carry; the nominal ratio is the number that answers that question.
 *
 * Rule 3 (don't prune a short plan shorter): if `foods` is already below `COVERAGE_TARGET_PCT`,
 * or already below the nominal floor, before pruning starts, this removes nothing at all.
 */
export function pruneUnneededFood(
  state: PlanState,
  services: Service[],
  foods: DraftFood[],
  selection: FoodSelectionEntry[],
): DraftFood[] {
  if (foods.length === 0) return foods;

  const baseline = score(state, services, foods);
  if (baseline.coverage < COVERAGE_TARGET_PCT) return foods; // rule 3
  if (baseline.totalCarbs / baseline.target < COVERAGE_TARGET_PCT / 100) return foods; // rule 3, nominal floor

  const hydrationStartedGreen = baseline.hydrationPct >= HYDRATION_TARGET_PCT;
  const priority = keyPriority(selection, state.foodLib);
  const needsStopKeys = new Set(state.foodLib.filter((f) => f.needsStop).map((f) => f.key));

  // Lowest priority (last selected) first; ties (same product) keep `foods`' own relative order,
  // since `Array.prototype.sort` is a stable sort.
  const order = [...foods].sort(
    (a, b) => (priority.get(b.key) ?? -1) - (priority.get(a.key) ?? -1),
  );

  let remaining = foods;
  for (const candidate of order) {
    const trial = remaining.filter((f) => f !== candidate);
    const trialScore = score(state, services, trial);

    const coverageOk = trialScore.coverage >= COVERAGE_TARGET_PCT;
    const hydrationOk =
      !needsStopKeys.has(candidate.key) ||
      !hydrationStartedGreen ||
      trialScore.hydrationPct >= HYDRATION_TARGET_PCT;
    const nominalOk = trialScore.totalCarbs / trialScore.target >= COVERAGE_TARGET_PCT / 100;

    if (coverageOk && hydrationOk && nominalOk) remaining = trial;
  }

  return remaining;
}
