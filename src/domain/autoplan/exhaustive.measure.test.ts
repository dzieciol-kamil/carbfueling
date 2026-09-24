/**
 * Timing probe for the pruned search on the rider's 194km pacing ride (task 3b, checkpoint for
 * the owner) — not a correctness test. `improve()`'s space on this fixture is in the millions, so
 * this is off unless `MEASURE=1`, the same pattern `oracleExpect.ts` uses for `ORACLE_ON`.
 *
 *   MEASURE=1 npx vitest run --testTimeout=0 src/domain/autoplan/exhaustive.measure.test.ts
 *
 * Split into two `test()`s on purpose. `climb()`/`space()` are cheap, but the search that follows
 * can run long enough to need killing on a wall-clock cap; a synchronous test's `console.log`s
 * only reach the log once the whole test function returns (Vitest ships worker stdout to the main
 * process between tests, not mid-loop), so a kill mid-search would lose everything, including the
 * climb/space numbers, if they were logged from inside the same test. Logging them from their own
 * short test first means they are already on disk before the long one even starts. The long test
 * is `async` and awaits a zero-delay `setTimeout` after each yield so that line, too, gets flushed
 * as it happens rather than waiting for the whole run to finish.
 */
import { expect, test } from 'vitest';
import { foodLib, gear, mix, route, selection } from '../__fixtures__/pacing194';
import type { PlanState } from '../types';
import { improve } from './exhaustive';
import { climb, space } from './search';
import type { Evaluated } from './search';

// The app's tsconfig carries no Node types, so the environment is read without them.
const env =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const MEASURE_ON = env.MEASURE === '1';

const state: PlanState = { route, mix, gear, fills: [], foods: [], foodLib };

// Filled in by the first test, read by the second — both run in the same module instance, in
// order, so this is safe.
let climbStart: Evaluated | undefined;

test.runIf(MEASURE_ON)('194 km: climb() and the space size', () => {
  const t0 = performance.now();
  climbStart = climb(state, selection);
  const climbMs = performance.now() - t0;
  const size = space(state, selection).size;
  console.log({ climbMs, size, startScore: climbStart.score });
  expect(climbStart).toBeDefined();
});

test.runIf(MEASURE_ON)(
  '194 km: how long the pruned search takes',
  async () => {
    const start = climbStart!;
    const t0 = performance.now();
    const seen = { n: 0 };
    let best = start;
    let found = 0;
    for (const e of improve(state, selection, start, seen)) {
      best = e;
      found += 1;
      const elapsedMs = performance.now() - t0;
      console.log({ elapsedMs, visited: seen.n, found, score: e.score });
      // Give the event loop a tick so this line reaches the log now, not only when the run ends.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const totalMs = performance.now() - t0;
    console.log({ totalMs, visited: seen.n, found, start: start.score, best: best.score });
  },
  0,
);
