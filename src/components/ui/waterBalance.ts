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
