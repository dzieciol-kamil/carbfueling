/**
 * Options the pre-flight modal (`AutoplanPreflightModal`) collects and threads through around the
 * autoplan run, not into it: `carriedVesselGids` filters the gear passed into `autoplanInput()`
 * before the worker starts, and `stopsMode` governs which of the rider's stops survive each
 * `insertAutoplan()` call as plans arrive from the worker — and, through `autoplanStopRules()`,
 * whether the engine may add stops of its own to them.
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
