/**
 * Options the pre-flight modal (`AutoplanPreflightModal`) collects and threads through to the
 * `autoplan()` call site in `appStore.ts`'s `applyAutoplan`.
 *
 * `autoplan(state, selection)` itself takes none of this: both options are applied by the caller,
 * around the call — one filters the gear the engine gets to see, the other decides which of the
 * rider's existing stops survive the run.
 */

/**
 * Three positions for "Twoje stopy" — governs only rider-placed stops (`!autoCreated`). Stops
 * from a previous autoplan run are always replaced, regardless of this setting: re-running is
 * what that means.
 */
export type StopsMode = 'keepAndAdd' | 'keepOnly' | 'clear';

export interface AutoplanOptions {
  stopsMode: StopsMode;
  /** Vessel gids the rider is carrying this run. `null` means "everything in Gear" — the
   *  unfiltered default — rather than an explicit empty list. Unchecking a vessel in the modal
   *  keeps it home for this run only; it never mutates the saved gear list. */
  carriedVesselGids: string[] | null;
}

export const DEFAULT_AUTOPLAN_OPTIONS: AutoplanOptions = {
  stopsMode: 'keepAndAdd',
  carriedVesselGids: null,
};
