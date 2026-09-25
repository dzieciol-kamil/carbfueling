/**
 * Undo / redo for the plan.
 *
 * **What a step restores is the whole document**: route, mix, gear, fills, foods, stops, the food
 * library, the "prepare together" batch and the tour's restore point. Never the view (`ui`) and never the id counters. The
 * whole document rather than just the fills and foods, because they refer to each other: removing a
 * vessel removes its fills, shortening the route trims them, so restoring the fills alone could
 * bring back bars for a bottle or a stretch of road that no longer exists.
 *
 * **A step is a burst, not a `set()`.** A drag moves a bar dozens of times, typing a number sets it
 * once per keystroke, and an autoplan run inserts a better plan every time the worker finds one.
 * Each of those is one thing the rider did, so it is one step: the document as it was *before* the
 * burst goes onto the undo stack, and the burst ends once nothing has changed for `idleMs` — but
 * never while a bar is being dragged, nor while `hold()` is in force (the autoplan run).
 *
 * The stacks live in memory only. A reload starts with a clean history, the same as any editor.
 */
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { PLAN_DOC_KEYS, useAppStore } from './appStore';

// The tour's restore point goes with the plan: undoing the sample's arrival brings the rider's
// plan back *and* drops the offer to restore it, and redo brings both back together.
const DOC_KEYS = [...PLAN_DOC_KEYS, 'preTourDoc'] as const;

type DocKey = (typeof DOC_KEYS)[number];

/** The slice of the store a step saves and restores — see `DOC_KEYS`. */
type HistoryUi = { dragKey: string | null; selKey: string | null; hoverKey: string | null };
type HistoryState = Record<DocKey, unknown> & { ui: HistoryUi };
type Doc = Pick<HistoryState, DocKey>;
type HistoryStatus = { canUndo: boolean; canRedo: boolean };

const docOf = (s: HistoryState): Doc => {
  const d = {} as Doc;
  for (const k of DOC_KEYS) d[k] = s[k];
  return d;
};

/**
 * Every write in the store replaces what it changes, so reference equality is enough — except that
 * a GPX file that fails to load only sets `route.gpxError`, which is a message, not an edit.
 */
const docChanged = (a: HistoryState, b: HistoryState) =>
  DOC_KEYS.some((k) => {
    if (a[k] === b[k]) return false;
    if (k !== 'route') return true;
    const ra = a.route as Record<string, unknown>;
    const rb = b.route as Record<string, unknown>;
    return Object.keys(ra).some((f) => f !== 'gpxError' && ra[f] !== rb[f]);
  });

export type PlanHistory = {
  undo: () => void;
  redo: () => void;
  /** Start a step that lasts until the matching `release()` — one step for the whole span, and
   *  no undo or redo inside it. */
  hold: () => void;
  release: () => void;
  /** Whether there is anything to undo / redo, as a store the buttons can subscribe to. */
  status: UseBoundStore<StoreApi<HistoryStatus>>;
};

export function createPlanHistory<S extends HistoryState>(
  store: StoreApi<S>,
  { limit = 50, idleMs = 700 }: { limit?: number; idleMs?: number } = {},
): PlanHistory {
  let past: Doc[] = [];
  let future: Doc[] = [];
  let open = false;
  let held = 0;
  let restoring = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const status = create<HistoryStatus>(() => ({ canUndo: false, canRedo: false }));
  // Nothing can be stepped while held (see `step`), so the buttons say so rather than doing nothing.
  const publish = () =>
    status.setState({
      canUndo: held === 0 && past.length > 0,
      canRedo: held === 0 && future.length > 0,
    });

  const close = () => {
    clearTimeout(timer);
    timer = undefined;
    open = false;
  };
  const closeWhenIdle = () => {
    clearTimeout(timer);
    if (held > 0 || store.getState().ui.dragKey !== null) return;
    timer = setTimeout(close, idleMs);
  };

  store.subscribe((s, prev) => {
    if (restoring) return;
    if (docChanged(s, prev)) {
      if (!open) {
        past.push(docOf(prev));
        if (past.length > limit) past.shift();
        future = [];
        open = true;
        publish();
      }
      closeWhenIdle();
    } else if (open && prev.ui.dragKey !== null && s.ui.dragKey === null) {
      // The drag is over: the burst may end now, once nothing else follows it.
      closeWhenIdle();
    }
  });

  const restore = (doc: Doc) => {
    restoring = true;
    try {
      // What was hovered, dragged or selected may not exist in the restored plan.
      store.setState(
        (s) =>
          ({
            ...doc,
            ui: { ...s.ui, selKey: null, hoverKey: null, dragKey: null },
          }) as Partial<S>,
      );
    } finally {
      restoring = false;
    }
  };

  const step = (from: Doc[], to: Doc[]) => {
    // Nothing moves while an autoplan run is still writing its plans, nor mid-drag: the drag's
    // next pointermove would write its own geometry straight back over the restored plan.
    if (held > 0 || store.getState().ui.dragKey !== null) return;
    close();
    const doc = from.pop();
    if (!doc) return;
    to.push(docOf(store.getState()));
    restore(doc);
    publish();
  };

  return {
    undo: () => step(past, future),
    redo: () => step(future, past),
    hold: () => {
      // Whatever was being typed a moment ago is its own step, not part of this one.
      if (held === 0) close();
      held += 1;
      publish();
    },
    release: () => {
      held = Math.max(0, held - 1);
      if (open) closeWhenIdle();
      publish();
    },
    status,
  };
}

/** The app's own history, attached to the app's store the first time anything imports it. */
export const planHistory = createPlanHistory(useAppStore);
