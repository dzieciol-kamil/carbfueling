import type { Vessel } from '../types';
import type { DraftFill, Service } from './types';

/**
 * Converts services into the legacy `Fill` shape the rest of the app (chart, panels, store) still
 * consumes. This is the ONLY place in the new engine allowed to construct a `DraftFill` — every
 * planner stage above this reasons in `Service`, never in `Fill`.
 *
 * The mapping is a direct span copy: each service becomes exactly one fill, so two services on the
 * same vessel separated by a gap (relay, C4) produce two distinct fills rather than being merged or
 * having one dropped — that's the whole point of the rewrite. `Service` carries no volume/carbs
 * field to begin with (§2.1: `Fill` has always assumed a fill delivers a vessel's full capacity over
 * its span, see `volOf`/`carbsFill` in `fuel.ts`, so an authored volume would be a second, possibly
 * disagreeing source of truth). `filledAtStop` has no home on `Fill` either and is intentionally
 * dropped here.
 *
 * `gear` is used only to drop services referencing a vessel that no longer exists — referential
 * integrity, not planning.
 *
 * `pos` (W5c-2: explicit per-dose km positions for a multi-part gel service) passes through
 * unchanged when present — `DraftFill`/`Fill` already carry the field, nobody has authored it before.
 */
export function servicesToFills(services: Service[], gear: Vessel[]): DraftFill[] {
  const knownVesselIds = new Set(gear.map((v) => v.gid));
  return services
    .filter((s) => knownVesselIds.has(s.vesselId))
    .map((s) => ({
      gid: s.vesselId,
      content: s.content,
      from: s.fromKm,
      to: s.toKm,
      ...(s.pos ? { pos: s.pos } : {}),
    }));
}
