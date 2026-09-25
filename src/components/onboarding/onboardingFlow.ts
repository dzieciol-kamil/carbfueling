/**
 * First-run flow: the "Set me up" dialog opens on its own, then three one-off hints walk the rider
 * to their first plan — route form, "Suggest a plan", the chart.
 *
 * `ONBOARDING_VERSION` is what the rider has to have seen. Raising it (a big release that changes
 * what first run looks like) opens the setup again for everyone below it, returning riders
 * included; they see their own saved data in it, not defaults.
 */
export const ONBOARDING_VERSION = 2;

export type OnboardingHint = 1 | 2 | 3;

export function shouldOpenSetup(seenVersion: number): boolean {
  return seenVersion < ONBOARDING_VERSION;
}

/**
 * Where the hint sequence goes from `hint` given the plan as it is now. A hint that has been done
 * is skipped rather than shown: hint 1 asks for a route, so once there is one it moves on; hint 2
 * asks for a plan, so a plan built by hand skips it too.
 */
export function nextHint(
  hint: OnboardingHint | null,
  plan: { routeReady: boolean; hasPlan: boolean },
): OnboardingHint | null {
  if (hint === null || hint === 3) return hint;
  if (plan.routeReady && plan.hasPlan) return 3;
  if (hint === 1 && plan.routeReady) return 2;
  return hint;
}
