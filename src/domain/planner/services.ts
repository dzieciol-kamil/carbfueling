import type { Vessel } from '../types';
import type { DraftFill } from '../autoplan';
import type { Service } from './types';

/**
 * Converts services into the legacy `Fill` shape the rest of the app (chart, panels, store) still
 * consumes. This is the ONLY place in the new engine allowed to construct a `DraftFill` — every
 * planner stage above this reasons in `Service`, never in `Fill`.
 *
 * The mapping is a direct span copy: each service becomes exactly one fill, so two services on the
 * same vessel separated by a gap (relay, C4) produce two distinct fills rather than being merged or
 * having one dropped — that's the whole point of the rewrite. `volumeMl`/`carbsG`/`filledAtStop`
 * have no home on `Fill` (which has always assumed a fill delivers a vessel's full capacity over its
 * span, see `volOf`/`carbsFill` in `fuel.ts`) and are intentionally dropped here.
 *
 * `gear` is used only to drop services referencing a vessel that no longer exists — referential
 * integrity, not planning.
 */
export function servicesToFills(services: Service[], gear: Vessel[]): DraftFill[] {
  const knownVesselIds = new Set(gear.map((v) => v.gid));
  return services
    .filter((s) => knownVesselIds.has(s.vesselId))
    .map((s) => ({ gid: s.vesselId, content: s.content, from: s.fromKm, to: s.toKm }));
}
