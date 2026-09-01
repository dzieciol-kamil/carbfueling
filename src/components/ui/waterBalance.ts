import type { Lang } from '../../i18n/strings';

/**
 * The signed water balance for display, e.g. "+2,2%" / "−0,9%" — see `waterBalancePct` for what
 * the number means. Lives here rather than in `domain/fuel.ts` because it needs the language, and
 * the domain layer stays i18n-free; shared by the desktop cards and the mobile plan list so the
 * same balance can't be written two ways on two screens.
 *
 * Always signed, because the sign is the whole message: it says which of the two failure modes —
 * running dry or over-drinking — the plan is heading for. A true minus sign (U+2212), not a
 * hyphen, so it lines up with the digits in the monospace face.
 */
export function fmtWaterBalance(pct: number, lang: Lang): string {
  // Anything under 0.05% rounds to "0.0", and "−0,0%" reads like a bug rather than a balanced plan.
  const rounded = Math.abs(pct) < 0.05 ? 0 : pct;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  const digits = Math.abs(rounded).toFixed(1);
  return sign + (lang === 'pl' ? digits.replace('.', ',') : digits) + '%';
}

/**
 * Half-range of the hydration bar, in % of body mass: the track runs from −4% (empty) through 0
 * (centre) to +4% (full).
 *
 * 4% is where the evidence stops being disputed — the audit's own table calls it "clear impairment
 * everywhere, heat-illness risk", the point past which no study argues the deficit is free. Any
 * smaller and normal plans would peg the end of the bar; any larger and the tier boundaries would
 * all crowd into the middle. For reference, at 24 C the green/amber edge lands at 46% of the
 * half-width and amber/red at 71%.
 */
export const BALANCE_SCALE_PCT = 4;

/** Where the fill sits on a centre-zero track, both as percentages of the *full* track width.
 *  A deficit grows leftward from the centre, a surplus rightward; anything past the scale is
 *  clamped to the end, because "worse than the worst mark on the bar" is all a bar can say. */
export function balanceBarGeometry(balancePct: number): { left: number; width: number } {
  const width = Math.min(1, Math.abs(balancePct) / BALANCE_SCALE_PCT) * 50;
  return { left: balancePct < 0 ? 50 - width : 50, width };
}
