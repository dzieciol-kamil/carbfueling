/**
 * Options the pre-flight modal (`AutoplanPreflightModal`) collects and threads through to the
 * `autoplan()` call site in `appStore.ts`'s `applyAutoplan`.
 *
 * The engine behind `autoplan()` does not read any of this yet — see
 * `docs/superpowers/specs/2026-08-23-autoplan-v2-engine-spec.md`. `stopsMode` and
 * `carriedVesselGids` already shape the state handed to *today's* engine (which stops/vessels it
 * gets to see); `preference` has nowhere to go until the new engine's cost function exists, so for
 * now it is only collected and persisted (see `ui.autoplanPreference` in appStore.ts).
 */

/**
 * Three positions for "Twoje stopy" — governs only rider-placed stops (`!autoCreated`). Stops
 * from a previous autoplan run are always replaced, regardless of this setting: re-running is
 * what that means.
 */
export type StopsMode = 'keepAndAdd' | 'keepOnly' | 'clear';

/** Three positions for "Co wolisz" — the stops-vs-carried-load preference. */
export type AutoplanPreference = 'fewerStops' | 'balanced' | 'lighter';

export interface AutoplanOptions {
  stopsMode: StopsMode;
  /** Vessel gids the rider is carrying this run. `null` means "everything in Gear" — today's
   *  unfiltered default — rather than an explicit empty list. Unchecking a vessel in the modal
   *  keeps it home for this run only; it never mutates the saved gear list. */
  carriedVesselGids: string[] | null;
  preference: AutoplanPreference;
}

export const DEFAULT_AUTOPLAN_OPTIONS: AutoplanOptions = {
  stopsMode: 'keepAndAdd',
  carriedVesselGids: null,
  preference: 'balanced',
};
