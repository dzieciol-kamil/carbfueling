/**
 * Shared by `assignCarbs.ts` and `assignWater.ts` — both need the fraction of a `Service`'s load
 * that lands inside one leg (a gel's one-shot span in particular is laid out independently of leg
 * boundaries, so a single flask can overlap three legs). See
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md` §4 step 1 (C1's absorption
 * ceiling) and step 2 (crediting carbs' fluid volume onto water's floor).
 *
 * **Why this asks `fracFill`, not elapsed time.** `samples()` is the one place that actually
 * distributes a fill across its span, and `fracFill` is exactly that distribution: continuous along
 * `eff()` (the effort-weighted cumulative used for izo/water) for a single-part fill, or discrete
 * dose positions in raw km (`partsOf`/`partPos`) for gel. Elapsed time (`timeAtDistance`) is a
 * *different* accumulator — built from `timeWeight`, not `gradEffort` — so on any route with
 * gradient the two bases diverge, and a leg was being credited fluid/carbs the samples never
 * actually deliver there. Reusing `fracFill` for the proration guarantees it can never drift from
 * what `samples()` delivers, for either content kind.
 */
import { fracFill } from '../fuel';
import type { Fill, RouteInput, Vessel } from '../types';
import type { Leg, Service } from './types';

/** The 0–1 fraction of `service`'s load that falls inside `[leg.fromKm, leg.toKm)`. */
export function deliveredShare(
  service: Service,
  leg: Leg,
  gear: Vessel[],
  route: RouteInput,
): number {
  const a = Math.max(leg.fromKm, service.fromKm);
  const b = Math.min(leg.toKm, service.toKm);
  if (b <= a) return 0;
  const fill: Fill = {
    fid: 0,
    gid: service.vesselId,
    content: service.content,
    from: service.fromKm,
    to: service.toKm,
  };
  return fracFill(fill, b, gear, route) - fracFill(fill, a, gear, route);
}
