/**
 * Where a fill reaches.
 *
 * A fill's span is not searched for, it is computed: the right `to` is the km at which what the
 * fill delivers has exactly met what the route required since its `from`. That is the owner's own
 * method — *"wkładam bidon z izo i zwężam go tak, żeby jego linia pokrywała się praktycznie z
 * wymaganiem"* — and it is arithmetic, because the requirement curve is already written down.
 *
 * It is written down in `samples()` (`fuel.ts`), which builds the two need lines the chart draws:
 *
 * ```ts
 * need:      target         * (eff(route, x) / tot)   // target = totalHours × cph
 * fluidNeed: totalFluidNeed * (eff(route, x) / tot)   // totalFluidNeed = sweat × totalHours
 * ```
 *
 * with `tot = eff(route, dist(route))`. Both are the ride's whole requirement smeared along the
 * route in proportion to cumulative effort, so what a stretch `[a, b]` demands is
 * `rideTotal × (eff(b) − eff(a)) / tot`, and the span is that read backwards:
 *
 * ```
 * eff(end) = eff(start) + delivered × tot / rideTotal
 * ```
 *
 * `eff` is monotonic and piecewise-linear over the profile's 161 points, so this inverts exactly —
 * binary-search the segment, then solve the line inside it. No second model of the need curve, no
 * approximation of one: this module reads `fuel.ts`'s own numbers and turns them around. Every bug
 * the previous engine had came from keeping its own guess at what these lines would do.
 *
 * The tolerance around a matched span is wide, and that is what makes computing one (instead of
 * searching for one) safe. `rateStats()` credits delivery against need step by step, but two
 * buffers sit between the two: the gut passes carbs on at `absCap` at most, so a fill that ran dry
 * keeps feeding the credit for a while after it ended, and unspent credit carries forward up to
 * `COVERAGE_CARRY_MINUTES` of the rider's own hourly need. Over-delivery is not simply trimmed at
 * the need line — a 150 g gel over 45 km credits in full even though it out-runs the need at every
 * point of that stretch, because the surplus never exceeds the carry cap.
 */
import { cph, eff, prof, sweat, totalHours } from '../fuel';
import type { RouteInput } from '../types';

/**
 * The km at which `delivered` units have met the share of `rideTotal` the route demands from
 * `startKm` onward. Shared by both need lines, which differ only in that whole-ride total.
 */
function spanEndKm(
  route: RouteInput,
  startKm: number,
  delivered: number,
  rideTotal: number,
): number {
  const P = prof(route);
  const start = Math.max(0, Math.min(P.D, startKm));
  // Nothing delivered reaches nowhere. Zero-length rather than route-length, so a planner asking
  // about an empty vessel gets an empty span rather than a claim on the whole route.
  if (!(delivered > 0)) return start;
  // A ride that demands nothing of this kind (distance 0, so no hours, so no target) is satisfied
  // everywhere — the fill reaches the finish.
  const tot = P.cum[P.N];
  if (!(rideTotal > 0) || !(tot > 0)) return P.D;

  const wanted = eff(route, start) + (delivered * tot) / rideTotal;
  // More than the rest of the route asks for: the span simply ends at the finish.
  if (wanted >= tot) return P.D;

  // `cum` is strictly increasing (every point's effort is positive), so the segment containing
  // `wanted` is unique and a binary search finds it.
  let lo = 0;
  let hi = P.N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (P.cum[mid] <= wanted) lo = mid;
    else hi = mid;
  }
  const seg = P.cum[hi] - P.cum[lo];
  const f = seg > 0 ? (wanted - P.cum[lo]) / seg : 0;
  return (P.D * (lo + f)) / P.N;
}

/**
 * Where a fill holding `carbsInFill` grams, started at `startKm`, runs out against the route's carb
 * requirement — the inverse of `samples()`'s `need` line.
 *
 * On a flat route (`eff` linear) this reduces to plain arithmetic: `carbsInFill / cph(route)` hours
 * of riding, i.e. `carbsInFill / cph(route) × route.speed` km. On a climb it is shorter, because
 * the climb demands more per km.
 */
export function carbSpanEndKm(route: RouteInput, startKm: number, carbsInFill: number): number {
  return spanEndKm(route, startKm, carbsInFill, totalHours(route) * cph(route));
}

/**
 * Where a fill holding `mlInFill` millilitres, started at `startKm`, runs out against the route's
 * fluid requirement — the inverse of `samples()`'s `fluidNeed` line.
 *
 * The comment at `fuel.ts:838` warns that fluid is not treated like carbs, and it is worth being
 * precise about what that means, because it is *not* a different distribution. What it rules out is
 * a time-varying ramp in the need *rate*: hydration guidance is a flat ml/h, so the total is the
 * plain, undiscounted `sweat(route) × totalHours(route)`, with no gut-model shaping and no
 * tolerance subtracted (`hydrationStatus` applies that separately, on the badge). Along the route
 * that total is then spread by exactly the same `eff(x) / tot` factor the carb line uses — see
 * `Sample.fluidNeed`: *"distributed by effort the same way `need` is for carbs, so climbs carry
 * more of the requirement than descents."* So the shape is shared and only the total differs, which
 * is why both spans are the one function above.
 *
 * `sweat × hours` is deliberately taken raw here, matching `samples()`. `planSummary` rounds the
 * same product to whole millilitres for display; the need *curve* does not, and this inverts the
 * curve.
 */
export function waterSpanEndKm(route: RouteInput, startKm: number, mlInFill: number): number {
  return spanEndKm(route, startKm, mlInFill, sweat(route) * totalHours(route));
}
