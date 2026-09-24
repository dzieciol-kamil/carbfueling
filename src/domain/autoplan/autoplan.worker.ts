/**
 * The Web Worker entry point for the thinking modal: receives the plain state
 * `autoplanInput()` (appStore.ts) built, runs `runAutoplan()` off the main thread, and posts each
 * plan back as it arrives.
 *
 * The app's tsconfig has no WebWorker lib (it targets the DOM the app itself runs in), so `self`
 * is typed here as only the slice of the worker global scope this file actually uses, rather than
 * pulling in `lib.webworker.d.ts` for the whole app.
 */
import type { FoodSelectionEntry } from './types';
import type { PlanState } from '../types';
import { runAutoplan } from './run';
import type { AutoplanMessage } from './run';

const scope = self as unknown as {
  onmessage: (e: MessageEvent<{ state: PlanState; selection: FoodSelectionEntry[] }>) => void;
  postMessage: (m: AutoplanMessage) => void;
};

scope.onmessage = (e) => runAutoplan(e.data.state, e.data.selection, (m) => scope.postMessage(m));
