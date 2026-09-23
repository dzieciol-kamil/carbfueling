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
 * **The space.** Every usable vessel takes every content its `allowed` list permits, with `1..cap`
 * loads, times every product count `0..max`. `loads: 0` is left out because the search cannot
 * reach it (it starts every vessel at one load and never removes one). `cap` is the number of loads
 * that would cover the whole ride's need from that vessel alone, plus one, and never more than
 * `MAX_LOADS` — more than that pours past the finish and adds nothing the layout keeps.
 */
import { carbsFill, cph, sweat, totalHours } from '../fuel';
import type { PlanState, Vessel } from '../types';
import type { VesselAssignment } from './layout';
import { compareScore } from './score';
import { evaluate, offersFor, usableGear } from './search';
import type { Decision, Evaluated, Offer } from './search';
import type { FoodSelectionEntry } from './types';

const MAX_LOADS = 14;

function loadCap(state: PlanState, v: Vessel, content: VesselAssignment['content']): number {
  const hrs = totalHours(state.route);
  if (content === 'water') {
    return Math.min(MAX_LOADS, Math.ceil((sweat(state.route) * hrs) / v.vol) + 1);
  }
  const perLoad = carbsFill({ fid: 0, gid: v.gid, content, from: 0, to: 1 }, state.gear, state.mix);
  if (!(perLoad > 0)) return 1;
  return Math.min(MAX_LOADS, Math.ceil((cph(state.route) * hrs) / perLoad) + 1);
}

export type Space = { vessels: VesselAssignment[][]; offers: Offer[]; size: number };

export function space(state: PlanState, selection: FoodSelectionEntry[]): Space {
  const vessels = usableGear(state.gear).map((v) =>
    v.allowed.flatMap((content) =>
      Array.from({ length: loadCap(state, v, content) }, (_, i) => ({
        gid: v.gid,
        content,
        loads: i + 1,
      })),
    ),
  );
  const offers = offersFor(state, selection);
  const size =
    vessels.reduce((n, opts) => n * opts.length, 1) * offers.reduce((n, o) => n * (o.max + 1), 1);
  return { vessels, offers, size };
}

/** The `n`-th Decision of the space, read as a mixed-radix number. */
function decisionAt(s: Space, n: number): Decision {
  let r = n;
  const assignment = s.vessels.map((opts) => {
    const a = opts[r % opts.length];
    r = Math.floor(r / opts.length);
    return a;
  });
  const counts = s.offers.map((o) => {
    const c = r % (o.max + 1);
    r = Math.floor(r / (o.max + 1));
    return c;
  });
  return { assignment, counts };
}

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
