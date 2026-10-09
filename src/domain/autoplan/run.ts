/**
 * The engine's own entry point for the thinking modal: runs the climb, then `improve()`'s
 * strictly-better plans, posting each one as it arrives rather than returning a single answer.
 * Framework-free — `autoplan.worker.ts` is the only caller that knows this runs inside a Worker.
 *
 * A run is spread over several workers, each searching its own `Share` of the space, so each plan
 * is posted with its score and its place in the search's order: that is what `replaces` needs to
 * merge them back into the answer a single worker would have given.
 */
import type { PlanState } from '../types';
import { improve, WHOLE } from './exhaustive';
import type { Share } from './exhaustive';
import { compareScore } from './score';
import type { Score } from './score';
import { climb } from './search';
import type { Evaluated } from './search';
import { FREE_STOPS } from './types';
import type { AutoplanResult, FoodSelectionEntry, StopRules } from './types';

/** `order` is the plan's place in `improve()`'s order; the climb, which every worker posts first,
 *  comes before all of them. */
export type AutoplanMessage =
  { type: 'plan'; result: AutoplanResult; score: Score; order: number } | { type: 'done' };

export const CLIMB_ORDER = -1;

/**
 * Whether a posted plan takes the place of the one already shown: strictly better, or tied and
 * earlier in the search's order. A single search over the whole space ends on exactly that plan —
 * it keeps the climb's answer on a tie, and otherwise the first plan to reach the best score, since
 * a later tie is not an improvement — so however the shares' posts interleave, the run ends where
 * one worker would have.
 */
export function replaces(
  candidate: { score: Score; order: number },
  shown: { score: Score; order: number } | null,
): boolean {
  if (shown === null) return true;
  const c = compareScore(candidate.score, shown.score);
  return c < 0 || (c === 0 && candidate.order < shown.order);
}

const toResult = (e: Evaluated): AutoplanResult => ({
  fills: e.draft.fills,
  foods: e.draft.foods,
  newStops: e.draft.stops,
});

/**
 * `deps` is a test-only seam: it lets a test force `improve()` to throw without having to find a
 * real state that makes the engine itself blow up. If the engine throws, the modal's job is to
 * close and keep the best plan already posted, not to spin forever or crash the worker — so the
 * error is caught here rather than left to propagate, and `finally` is what guarantees `done`
 * always follows, exception or not, whether it came from the climb or partway through
 * `improve()`. It's logged rather than silently dropped: this also catches a `post()` itself
 * throwing (e.g. `DataCloneError` from `postMessage`), which is a bug worth seeing, not just an
 * engine result worth discarding.
 */
export function runAutoplan(
  state: PlanState,
  selection: FoodSelectionEntry[],
  post: (m: AutoplanMessage) => void,
  deps: { improve: typeof improve } = { improve },
  rules: StopRules = FREE_STOPS,
  share: Share = WHOLE,
): void {
  try {
    const start = climb(state, selection, rules);
    post({ type: 'plan', result: toResult(start), score: start.score, order: CLIMB_ORDER });
    for (const e of deps.improve(state, selection, start, { n: 0 }, rules, share)) {
      post({ type: 'plan', result: toResult(e), score: e.score, order: e.order });
    }
  } catch (err) {
    // The plan(s) already posted stay on the chart; `done` below is what tells the modal to stop.
    console.error('autoplan worker: engine failed', err);
  } finally {
    post({ type: 'done' });
  }
}
