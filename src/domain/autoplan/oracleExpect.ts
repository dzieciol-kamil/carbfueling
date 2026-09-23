/**
 * The scenario suites' hook into the oracle — test-only, nothing in the app imports this.
 *
 * Off unless `ORACLE=1`: the whole space of every scenario takes minutes (mix-9 alone is ~3 min),
 * far too slow for `npm test`. `ORACLE_LIMIT` (default 20 000) skips a scenario whose space is
 * larger; mix-8 needs 150 480 and ~20 min, the 194 km pacing ride millions.
 *
 *   ORACLE=1 npx vitest run --testTimeout=0 src/domain/autoplanScenarios.test.ts src/domain/autoplanMixScenarios.test.ts
 */
import { expect } from 'vitest';
import type { PlanState } from '../types';
import { oracle } from './oracle';
import { compareScore, score } from './score';
import { search } from './search';
import type { FoodSelectionEntry } from './types';

// The app's tsconfig carries no Node types, so the environment is read without them.
const env =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
export const ORACLE_ON = env.ORACLE === '1';
const LIMIT = Number(env.ORACLE_LIMIT ?? 20000);

/** The climb may tie the best Decision on the board, never lose to it. */
export function expectNotBeatenByOracle(state: PlanState, selection: FoodSelectionEntry[]): void {
  if (!ORACLE_ON) return;
  const engine = score(state, search(state, selection));
  const r = oracle(state, selection, LIMIT, engine);
  if (r === null) return;
  const d = r.best.decision;
  const best = `${d.assignment.map((a) => `${a.gid}:${a.content}x${a.loads}`).join(' ')} products ${d.counts.join(',')}`;
  expect(
    compareScore(engine, r.best.score),
    `${r.better} of ${r.size} Decisions beat the engine; best is ${best} ` +
      `(toGreen ${r.best.score.toGreen.toFixed(3)}, ${r.best.score.stops} stops, ` +
      `${r.best.score.powderCarried} sachets) vs engine (toGreen ${engine.toGreen.toFixed(3)}, ` +
      `${engine.stops} stops, ${engine.powderCarried} sachets)`,
  ).toBeLessThanOrEqual(0);
}
