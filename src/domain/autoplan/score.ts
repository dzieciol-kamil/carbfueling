/**
 * How good a draft plan is.
 *
 * The objective, in the owner's words, is that **both of the app's badges read green**:
 * `coverageStatus(...) === 'good'` for carbs and `hydrationStatus(...) === 'good'` for water. So
 * this module does not grade a plan — `fuel.ts` does. It calls `planSummary()` on the draft exactly
 * as the app would once the plan were applied, and measures how far the resulting summary sits from
 * the two badges' own green conditions. There is deliberately no second model of the objective
 * here; the previous engine had one, and every disagreement between "the planner thinks this is
 * good" and "the app says it isn't" came out of it.
 *
 * `toGreen` is a distance, not a utility: 0 means both badges are green and nothing more is asked.
 * Above 0 it is the sum of four normalised penalties, one per way a plan can fail, each expressed
 * as a fraction of its own limit so that a shortfall in carbs and a shortfall in water are
 * comparable quantities rather than grams against millilitres.
 *
 * Ranking is lexicographic: reach green first, then use as few stops as possible, then carry as
 * little drink powder as possible. Deliberately not a weighted sum — v2 had five cost weights and
 * spent most of its life being recalibrated, because a weighted sum lets a tie-break buy its way
 * out of the objective. It cannot here.
 */
import { CARB_PLATEAU_GPH, SURPLUS_WARN_PCT, allowedDeficitPct, planSummary } from '../fuel';
import type { Fill, FoodItem, PlanState } from '../types';
import type { DraftFill, DraftFood, DraftStop } from './types';

export type Score = {
  /** 0 = both badges green. Otherwise the summed distance to green, in units of "fraction of the
   *  limit that was missed" — see the four terms in `score()`. */
  toGreen: number;
  /** Tie-break: fewer stops wins. */
  stops: number;
  /** Tie-break: less carried drink powder wins. */
  powderCarried: number;
};

export type Draft = { fills: DraftFill[]; foods: DraftFood[]; stops: DraftStop[] };

/** Below this the two `toGreen` values are the same plan seen twice, not a real difference — see
 *  `compareScore`. Floating-point noise only; nothing about the domain is calibrated to it. */
const TO_GREEN_EPSILON = 1e-9;

/**
 * One penalty term: how far `over` runs past a limit, as a fraction of that limit.
 *
 * A term whose denominator is zero contributes **zero**, never `NaN` or `Infinity`. On a
 * distance-0 route there are no hours, so `carbTargetGph` is 0 and the graded floor with it — and a
 * ride that asks for nothing cannot fall short of it, so zero is the correct answer there and not
 * merely the safe one. (`carbAbsCapGph` floors at 45 inside `absCap()` and `allowedDeficitPct`
 * never leaves the 1.2-2.5 band, so those two cannot currently reach zero; the guard is applied
 * uniformly so that nothing here starts producing `NaN` if that ever changes.)
 */
function penalty(over: number, limit: number): number {
  if (!(limit > 0)) return 0;
  return Math.max(0, over) / limit;
}

/**
 * Materialises a draft the way the app does when a plan is applied — ids counted from 1, food names
 * resolved through the plan's own food library — and hands the result to `planSummary`.
 *
 * Stops are **not** part of this. `PlanState` has no `stops` field and `planSummary` never reads
 * one: where the rider pulls over changes nothing about how much was drunk or eaten, only about
 * whether the plan is practical, which is what the `stops` tie-break is for.
 */
function materialize(state: PlanState, draft: Draft): PlanState {
  const fills: Fill[] = draft.fills.map((f, i) => ({ ...f, fid: i + 1 }));
  const foods: FoodItem[] = draft.foods.map((f, i) => ({
    ...f,
    id: i + 1,
    name: state.foodLib.find((e) => e.key === f.key)?.pl ?? f.key,
  }));
  return { ...state, fills, foods };
}

/**
 * The four terms below reproduce the two badges' own green conditions exactly, so `toGreen === 0`
 * and "both badges green" are the same statement — `score.test.ts` pins that agreement.
 *
 * With one asymmetry worth knowing: under an hour of riding `coverageStatus` answers `'unneeded'`
 * rather than `'good'`, because carbs during exercise have no established effect over that
 * distance. That is not a plan failing — there is nothing left to fix — so `toGreen` is 0 there and
 * the loop correctly stops working on the carb side.
 */
export function score(state: PlanState, draft: Draft): Score {
  const s = planSummary(materialize(state, draft));

  // The floor `coverageStatus` grades `carbRateGph` against: the rider's own target, capped at the
  // plateau past which another g/h stops being worth grading. Read from `fuel.ts`, not restated.
  const floor = Math.min(s.carbTargetGph, CARB_PLATEAU_GPH);
  // The largest deficit that still reads green at this temperature — `hydrationStatus`'s own limit.
  const allowedDeficit = allowedDeficitPct(state.route.temp);
  const deficit = Math.max(0, -s.waterBalancePct);

  const toGreen =
    // Short of the carb badge's green floor.
    penalty(floor - s.carbRateGph, floor) +
    // Past the gut's ceiling — `coverageStatus`'s 'over' tier. Graded on the *planned* rate, since
    // `carbRateGph` is capped at what was needed and structurally cannot see an overshoot.
    penalty(s.carbPlannedRateGph - s.carbAbsCapGph, s.carbAbsCapGph) +
    // Too dry.
    penalty(deficit - allowedDeficit, allowedDeficit) +
    // Too wet — the EAH warning. `waterBalancePct` is signed, so this term only exists above zero.
    penalty(s.waterBalancePct - SURPLUS_WARN_PCT, SURPLUS_WARN_PCT);

  // Two different things happen at a fill boundary. A *handover* — one vessel runs dry and the next
  // takes over on the load it left home with — carried nothing, however late in the ride the second
  // bottle comes out of the jersey: its izo was mixed in the kitchen. A *refill* — a vessel that has
  // already been used getting filled again — is the other case, and drink powder cannot be bought at
  // a roadside shop, so izo going into a bottle that is already in use means the rider carried a
  // sachet from home to mix there. A fill is a refill exactly when its vessel has an earlier fill,
  // which is a question about ride order and not about array position — hence the sort. Water
  // refills cost no carrying decision and are not counted. The owner's rule is that carrying powder
  // is a last resort, and this is the quantity that says so.
  const seen = new Set<string>();
  let powderCarried = 0;
  for (const f of [...draft.fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) {
      if (f.content === 'izo') powderCarried += 1;
    } else seen.add(f.gid);
  }

  return {
    toGreen,
    stops: draft.stops.length,
    powderCarried,
  };
}

/** Strictly lexicographic: `toGreen`, then `stops`, then `powderCarried`. Negative when `a` is the
 *  better plan. `toGreen` is compared with a tolerance so that float noise in `planSummary` cannot
 *  make two plans that are equally green look different and rob the tie-breaks of their say. */
export function compareScore(a: Score, b: Score): number {
  if (Math.abs(a.toGreen - b.toGreen) > TO_GREEN_EPSILON) return a.toGreen - b.toGreen;
  if (a.stops !== b.stops) return a.stops - b.stops;
  return a.powderCarried - b.powderCarried;
}
