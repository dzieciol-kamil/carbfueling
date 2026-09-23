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
import {
  CARB_GRADING_MIN_HOURS,
  dist,
  carbFloorGph,
  SURPLUS_WARN_PCT,
  allowedDeficitPct,
  planSummary,
  totalHours,
  waterBalancePct,
} from '../fuel';
import type { Fill, FoodItem, PlanState } from '../types';
import type { DraftFill, DraftFood, DraftStop } from './types';

export type Score = {
  /** 0 = both badges green. Otherwise the summed distance to green, in units of "fraction of the
   *  limit that was missed" — see the four terms in `score()`. */
  toGreen: number;
  /** R50, autoplan's own shape rule — see `SEGMENT_TARGET`. 0 = the ride is fed well enough along
   *  its length; otherwise the grams missing, as a fraction of the most that could be, in [0, 1]. */
  shapeShort: number;
  /** Tie-break: fewer stops wins. */
  stops: number;
  /** Tie-break after sachets: fewer vessels used wins — R24, the owner's vessel-set rule, "fewest
   *  stops first, then the fewest bottles that still work" (confirmed again 2026-09-23, Q9). After
   *  sachets, not before, because powder is the last resort (R12): a second bottle of water beats
   *  mixing a sachet into the first. Never below one — the rider's own short-ride builds carry a
   *  bottle even where not drinking would read green, so leaving the *last* one home is a tie. */
  bottles: number;
  /** Tie-break: fewer sachets carried from home wins — izo powder or gel concentrate alike. */
  powderCarried: number;
  /** Last tie-break: the lower gut peak (grams) wins — among plans equal on everything above, the
   *  one easier on the stomach. Owner's pick on the 194 km kit, 2026-09-23: of three plans tied on
   *  badges, shape, stops and sachets, the one peaking at 58 g over one at 95 g. */
  gutPeak: number;
};

export type Draft = { fills: DraftFill[]; foods: DraftFood[]; stops: DraftStop[] };

/** Below this the two `toGreen` values are the same plan seen twice, not a real difference — see
 *  `compareScore`. Floating-point noise only; nothing about the domain is calibrated to it. */
const TO_GREEN_EPSILON = 1e-9;

/**
 * R50 — the owner's 2026-09-23 rulings on how a ride is fed along its length. The ride is cut into
 * stretches of about an hour — as many as the ride has hours, rounded (1 h 45 → 2, 2 h 30 → 3):
 * *"może to powinien być zakres np. 1h"*. Fifths of the distance were tried first; on a 194 km ride
 * the last fifth alone was 1 h 46 of riding.
 *
 * - every stretch but the last gets 80 % of what it needs — but one may dip to 70 %, as long as the
 *   next one does not: *"nie może mieć 70-80 na 2 kolejnych odcinkach, jednorazowo dopuszczalne,
 *   bo np. odcinek akurat przed postojem i obiadem"*;
 * - the last stretch gets `LAST_SEGMENT_FLOOR`: *"lecimy do domu, na oparach ale dajemy radę - o
 *   ile sumarycznie jest zielone"*.
 *
 * Autoplan's own rule — *"to nie jest coś co chcę widzieć na wykresie, ale na potrzeby autoplanu
 * jest ok"* — the badge and the chart are untouched. It exists because the carb badge grades a
 * whole-ride average and so cannot tell "fed evenly" from "fed hard for six hours and nothing for
 * four" (PARK §0). It buckets `fuel.ts`'s own crediting walk (`creditSteps`), so there is no second
 * model of the gut.
 */
/** A shape miss this small counts as met — owner, 2026-09-23, after a 2.5 % miss bought two izo
 *  sachets over a plan of water and a gel flask ("niech będzie te 5 %"). In `shapeShort`'s own
 *  unit: the fraction of the most grams the plan could miss. */
export const SHAPE_TOLERANCE = 0.05;
const SEGMENT_TARGET = 0.8;
const SEGMENT_DIP = 0.7;
const LAST_SEGMENT_FLOOR = 0.5;

/** The grams each stretch needed and was credited, the ride cut into `round(hours)` stretches. */
function segments(
  steps: { x: number; need: number; credit: number }[],
  D: number,
  hrs: number,
): { need: number; credit: number }[] {
  const n = Math.max(1, Math.round(hrs));
  const out = Array.from({ length: n }, () => ({ need: 0, credit: 0 }));
  for (const st of steps) {
    const i = D > 0 ? Math.min(n - 1, Math.floor((st.x / D) * n - 1e-9)) : 0;
    out[Math.max(0, i)].need += st.need;
    out[Math.max(0, i)].credit += st.credit;
  }
  return out;
}

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
 * **The two shortfall terms share one scale: the fraction of the way from green to the worst this
 * ride could do.** The carb one gets that for free. `carbRateGph` cannot go below zero, so
 * `(floor − rate) / floor` is at most 1 and 1 means "delivered nothing". The dryness term is not
 * free: `deficit` is a percentage of body mass with no ceiling of its own, and dividing it by the
 * allowance alone let it run far past 1 — on the owner's 194 km ride it read 4.37 against a carb
 * term of 0.87, at which point hydration outweighs anything carbs can ever say. The loop duly threw
 * 150 g of gel away to gain 250 ml of water (`carbRateGph` 44.0 → 34.5), because `fluidPlanned`
 * skips gel and so a gel load pours no millilitres. Carbs are what autoplan is for; that trade is
 * the objective being wrong, not the search. So the dryness term is divided by the distance from
 * the allowance to the deficit of a rider who drank nothing, which is the sentence the carb term
 * already says, and both land in [0, 1].
 *
 * Clamping the term at 1 was the alternative and it is worse. It preserves `toGreen === 0` just as
 * well, but it flattens the objective exactly where the search needs a gradient: on that same ride
 * the dryness term walks 3.34, 2.62, 1.90, 1.19 as loads are added, every one above 1, so under a
 * clamp all four read the same and the loop cannot tell a plan carrying 3360 ml from one carrying
 * 6060 ml. It would never start climbing toward water at all. Rescaling changes the unit and keeps
 * the ordering; clamping throws the ordering away.
 *
 * Neither is a weight. The denominator is `fuel.ts`'s own `waterBalancePct` asked at
 * `fluidPlanned: 0` — what this ride's arithmetic says, not a number anyone picked, with nothing in
 * it to recalibrate. The two *overshoot* terms are deliberately left alone: a plan can carry
 * arbitrarily much, so there is no worst case to divide by that would not be invented, and the
 * search only ever reaches them by overrunning a target it was already climbing toward.
 *
 * With one asymmetry worth knowing: under `CARB_GRADING_MIN_HOURS` of riding `coverageStatus`
 * answers `'unneeded'` rather than `'good'`, because carbs during exercise have no established
 * effect over that distance — the app greys the carb chart out. That is not a plan failing, there is
 * nothing left to fix, so the shortfall term below is switched off there and the loop stops working
 * on the carb side. The *overshoot* term is not: `coverageStatus` checks the planned rate against
 * the gut's cap before the hour exemption and lets it override, because GI risk from unabsorbed CHO
 * does not care how long the ride is, and this mirrors that order exactly.
 */
export function score(state: PlanState, draft: Draft): Score {
  const s = planSummary(materialize(state, draft));

  // The floor `coverageStatus` grades `carbRateGph` against: the rider's own target, capped at the
  // plateau for this intensity (30 g/h on low, 40 otherwise). Read from `fuel.ts`, not restated.
  // Zero below the hour boundary, which is how "there is nothing to fall short of" is said here.
  const graded = totalHours(state.route) >= CARB_GRADING_MIN_HOURS;
  const floor = graded ? carbFloorGph(s.carbTargetGph, state.route.intensity) : 0;
  // The largest deficit that still reads green at this temperature — `hydrationStatus`'s own limit.
  const allowedDeficit = allowedDeficitPct(state.route.temp);
  const deficit = Math.max(0, -s.waterBalancePct);
  // The deficit of a rider who drank nothing: the far end of the dryness term, the way an empty
  // plan's `carbRateGph` of 0 is the far end of the carb one. `fluidPlanned` cannot go below zero,
  // so no plan is drier than this and the term cannot exceed 1.
  const worstDeficit = -waterBalancePct({
    sweatLoss: s.sweatLoss,
    fluidPlanned: 0,
    weight: state.route.weight,
  });

  const toGreen =
    // Short of the carb badge's green floor.
    penalty(floor - s.carbRateGph, floor) +
    // Past the gut's ceiling — `coverageStatus`'s 'over' tier. Graded on the *planned* rate, since
    // `carbRateGph` is capped at what was needed and structurally cannot see an overshoot.
    penalty(s.carbPlannedRateGph - s.carbAbsCapGph, s.carbAbsCapGph) +
    // Too dry — on the same footing as the carb shortfall above, so that neither can shout the
    // other down. A ride whose allowance already covers drinking nothing has a denominator of zero
    // here, and a numerator that cannot be positive either, so `penalty` answering 0 is the honest
    // answer and not just the safe one.
    penalty(deficit - allowedDeficit, worstDeficit - allowedDeficit) +
    // Too wet — the EAH warning. `waterBalancePct` is signed, so this term only exists above zero.
    penalty(s.waterBalancePct - SURPLUS_WARN_PCT, SURPLUS_WARN_PCT);

  // R50, in grams rather than per-stretch percentages, so a stretch that needs little — a long
  // descent to the finish — cannot outweigh one that needs a lot. Three parts: any stretch before
  // the last under the 70 % dip floor; any two neighbours among them both under 80 % (the grams to
  // lift the cheaper one back to 80); the last stretch under its floor. Divided by the most the plan
  // could miss, so it lands in [0, 1]. A ride of one stretch is the badge's to grade, and a ride the
  // badge does not grade is not graded here either.
  const seg = segments(s.creditSteps, dist(state.route), totalHours(state.route));
  const last = seg.length - 1;
  const shortOf = (i: number, floor: number) => Math.max(0, floor * seg[i].need - seg[i].credit);
  let shapeMiss = shortOf(last, LAST_SEGMENT_FLOOR);
  for (let i = 0; i < last; i++) shapeMiss += shortOf(i, SEGMENT_DIP);
  for (let i = 0; i + 1 < last; i++) {
    shapeMiss += Math.min(shortOf(i, SEGMENT_TARGET), shortOf(i + 1, SEGMENT_TARGET));
  }
  const shapeMax =
    seg.slice(0, last).reduce((a, b) => a + SEGMENT_TARGET * b.need, 0) +
    LAST_SEGMENT_FLOOR * seg[last].need;
  const shapeShort =
    graded && seg.length > 1 && shapeMax > 0 ? Math.min(1, shapeMiss / shapeMax) : 0;

  // Two different things happen at a fill boundary. A *handover* — one vessel runs dry and the next
  // takes over on the load it left home with — carried nothing, however late in the ride the second
  // bottle comes out of the jersey: its izo was mixed in the kitchen. A *refill* — a vessel that has
  // already been used getting filled again — is the other case, and neither drink powder nor gel
  // concentrate can be bought at a roadside tap, so izo *or gel* going into a vessel that is already
  // in use means the rider carried a sachet from home to mix there. Gel counts for the same reason
  // izo does, and leaving it out would be worse than merely incomplete: with only izo counted the
  // tie-break would systematically prefer refilling the flask over refilling the bottle, on a
  // difference the rider never experiences. A fill is a refill exactly when its vessel has an
  // earlier fill, which is a question about ride order and not about array position — hence the
  // sort. Water refills cost no carrying decision and are not counted. The owner's rule is that
  // carrying powder is a last resort, and this is the quantity that says so.
  const seen = new Set<string>();
  let powderCarried = 0;
  for (const f of [...draft.fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) {
      if (f.content === 'izo' || f.content === 'gel') powderCarried += 1;
    } else seen.add(f.gid);
  }

  return {
    toGreen,
    shapeShort,
    stops: draft.stops.length,
    bottles: Math.max(1, new Set(draft.fills.map((f) => f.gid)).size),
    powderCarried,
    gutPeak: s.gutPeakG,
  };
}

/** Strictly lexicographic: `toGreen`, `shapeShort`, `stops`, `powderCarried`, `bottles`, then
 *  `gutPeak`.
 *  Negative when `a` is the better plan. Shape comes before stops because a stretch fed by
 *  nothing is worth a stop to fix — the rider's own izo-6 build takes two stops where one reads
 *  green — and once every fifth reaches the floor it is 0 and stops decide again. The two real
 *  numbers are compared with a tolerance so that float noise in `planSummary` cannot make two
 *  equal plans look different and rob the tie-breaks of their say. */
export function compareScore(a: Score, b: Score): number {
  if (Math.abs(a.toGreen - b.toGreen) > TO_GREEN_EPSILON) return a.toGreen - b.toGreen;
  const shapeA = Math.max(0, a.shapeShort - SHAPE_TOLERANCE);
  const shapeB = Math.max(0, b.shapeShort - SHAPE_TOLERANCE);
  if (Math.abs(shapeA - shapeB) > TO_GREEN_EPSILON) return shapeA - shapeB;
  if (a.stops !== b.stops) return a.stops - b.stops;
  if (a.powderCarried !== b.powderCarried) return a.powderCarried - b.powderCarried;
  if (a.bottles !== b.bottles) return a.bottles - b.bottles;
  if (Math.abs(a.gutPeak - b.gutPeak) > TO_GREEN_EPSILON) return a.gutPeak - b.gutPeak;
  return 0;
}
