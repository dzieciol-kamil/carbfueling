/**
 * The engine's own entry point for the thinking modal: runs the climb, then `improve()`'s
 * strictly-better plans, posting each one as it arrives rather than returning a single answer.
 * Framework-free — `autoplan.worker.ts` is the only caller that knows this runs inside a Worker.
 */
import type { PlanState } from '../types';
import { improve } from './exhaustive';
import { climb } from './search';
import type { Evaluated } from './search';
import type { AutoplanResult, FoodSelectionEntry } from './types';

export type AutoplanMessage = { type: 'plan'; result: AutoplanResult } | { type: 'done' };

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
): void {
  try {
    const start = climb(state, selection);
    post({ type: 'plan', result: toResult(start) });
    for (const e of deps.improve(state, selection, start)) {
      post({ type: 'plan', result: toResult(e) });
    }
  } catch (err) {
    // The plan(s) already posted stay on the chart; `done` below is what tells the modal to stop.
    console.error('autoplan worker: engine failed', err);
  } finally {
    post({ type: 'done' });
  }
}
