/**
 * Timing probe for the pruned search on the rider's 194km pacing ride (task 3b, checkpoint for
 * the owner) — not a correctness test. `improve()`'s space on this fixture is in the millions, so
 * this is off unless `MEASURE=1`, the same pattern `oracleExpect.ts` uses for `ORACLE_ON`.
 *
 *   MEASURE=1 npx vitest run --testTimeout=0 src/domain/autoplan/exhaustive.measure.test.ts
 */
import { test } from 'vitest';
import { foodLib, gear, mix, route, selection } from '../__fixtures__/pacing194';
import type { PlanState } from '../types';
import { improve } from './exhaustive';
import { climb, space } from './search';

// The app's tsconfig carries no Node types, so the environment is read without them.
const env =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const MEASURE_ON = env.MEASURE === '1';

const state: PlanState = { route, mix, gear, fills: [], foods: [], foodLib };

test.runIf(MEASURE_ON)(
  '194 km: how long the pruned search takes',
  () => {
    const t0 = performance.now();
    const start = climb(state, selection);
    const climbMs = performance.now() - t0;
    const size = space(state, selection).size;
    console.log({ climbMs, size, startScore: start.score });

    const seen = { n: 0 };
    let best = start;
    let found = 0;
    for (const e of improve(state, selection, start, seen)) {
      best = e;
      found += 1;
      const elapsedMs = performance.now() - t0;
      console.log({ elapsedMs, visited: seen.n, found, score: e.score });
    }
    const totalMs = performance.now() - t0;

    console.log({
      climbMs,
      totalMs,
      visited: seen.n,
      size,
      found,
      start: start.score,
      best: best.score,
    });
  },
  0,
);
