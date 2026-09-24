/**
 * Test-only reference: every Decision the search could reach, laid out and scored, and the best
 * of them. Nothing in the app imports this.
 *
 * It exists to tell two failures apart. When a scenario is red, either the climb in `search.ts`
 * stopped short of a better Decision (a search defect), or no Decision on the board is any better
 * (the rules or the test are wrong). Measured on 2026-09-23: mix-1, mix-3, mix-7 and mix-8 are the
 * first kind — mix-7 and mix-8 each use four stops where three read green on both badges.
 *
 * It models nothing of its own. The space is the search's own — `usableGear`, `offersFor` — and
 * each point goes through the search's own `evaluate`, so `layout()` and `score()` answer exactly
 * as they do for the climb, and `compareScore` ranks them.
 *
 * The space is `search.ts`'s own `space()`.
 */
import type { PlanState } from '../types';
import { compareScore } from './score';
import { decisionAt, evaluate, space } from './search';
import type { Evaluated } from './search';
import type { FoodSelectionEntry } from './types';

export type OracleResult = {
  size: number;
  best: Evaluated;
  /** How many Decisions score strictly better than `than`, if it was given. */
  better: number;
};

/** The best Decision in the space, or `null` when the space is larger than `limit`. */
export function oracle(
  state: PlanState,
  selection: FoodSelectionEntry[],
  limit: number,
  than?: Evaluated['score'],
): OracleResult | null {
  const s = space(state, selection);
  if (s.size > limit) return null;
  let best: Evaluated | null = null;
  let better = 0;
  for (let n = 0; n < s.size; n++) {
    const e = evaluate(state, s.offers, decisionAt(s, n));
    if (than && compareScore(e.score, than) < 0) better += 1;
    if (best === null || compareScore(e.score, best.score) < 0) best = e;
  }
  return { size: s.size, best: best as Evaluated, better };
}
