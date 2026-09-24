import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { createPlanHistory } from './planHistory';

/** Just the document fields and the three pointer keys the history reads — every field a plain
 *  value the tests can compare, standing in for the app's real ones. */
type S = {
  route: number;
  mix: number;
  gear: number;
  fills: number[];
  foods: number[];
  shops: number[];
  foodLib: number;
  combinedFillIds: number[];
  ui: { dragKey: string | null; selKey: string | null; hoverKey: string | null; lang: string };
};

const IDLE = 700;

function setup() {
  const store = createStore<S>()(() => ({
    route: 0,
    mix: 0,
    gear: 0,
    fills: [],
    foods: [],
    shops: [],
    foodLib: 0,
    combinedFillIds: [],
    ui: { dragKey: null, selKey: null, hoverKey: null, lang: 'pl' },
  }));
  const history = createPlanHistory(store, { idleMs: IDLE });
  const addFill = (x: number) => store.setState((s) => ({ fills: [...s.fills, x] }));
  const status = () => history.status.getState();
  return { store, history, addFill, status };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('plan history', () => {
  test('nothing to undo or redo at first', () => {
    const { history, status, store } = setup();
    expect(status()).toEqual({ canUndo: false, canRedo: false });
    history.undo();
    history.redo();
    expect(store.getState().fills).toEqual([]);
  });

  test('undo brings back the plan as it was, redo takes it forward again', () => {
    const { store, history, addFill, status } = setup();
    addFill(1);
    vi.advanceTimersByTime(IDLE);
    addFill(2);
    vi.advanceTimersByTime(IDLE);

    history.undo();
    expect(store.getState().fills).toEqual([1]);
    history.undo();
    expect(store.getState().fills).toEqual([]);
    expect(status()).toEqual({ canUndo: false, canRedo: true });

    history.redo();
    history.redo();
    expect(store.getState().fills).toEqual([1, 2]);
    expect(status()).toEqual({ canUndo: true, canRedo: false });
  });

  test('changes in quick succession are one step', () => {
    const { store, history, addFill } = setup();
    addFill(1);
    addFill(2);
    vi.advanceTimersByTime(IDLE - 1);
    addFill(3);
    vi.advanceTimersByTime(IDLE);
    history.undo();
    expect(store.getState().fills).toEqual([]);
  });

  test('a drag is one step however long it lasts', () => {
    const { store, history } = setup();
    store.setState((s) => ({ ui: { ...s.ui, dragKey: 'f1' } }));
    for (let i = 1; i <= 5; i++) {
      store.setState({ fills: [i] });
      vi.advanceTimersByTime(IDLE * 3);
    }
    store.setState((s) => ({ ui: { ...s.ui, dragKey: null } }));
    vi.advanceTimersByTime(IDLE);
    store.setState({ fills: [99] });
    vi.advanceTimersByTime(IDLE);

    history.undo();
    expect(store.getState().fills).toEqual([5]);
    history.undo();
    expect(store.getState().fills).toEqual([]);
  });

  test('everything between hold() and release() is one step, and nothing moves meanwhile', () => {
    const { store, history, addFill } = setup();
    history.hold();
    addFill(1);
    vi.advanceTimersByTime(IDLE * 5);
    addFill(2);
    history.undo();
    expect(store.getState().fills).toEqual([1, 2]);
    history.release();
    vi.advanceTimersByTime(IDLE);
    history.undo();
    expect(store.getState().fills).toEqual([]);
  });

  test('a new change after undo drops what could have been redone', () => {
    const { store, history, addFill, status } = setup();
    addFill(1);
    vi.advanceTimersByTime(IDLE);
    history.undo();
    addFill(7);
    expect(status().canRedo).toBe(false);
    history.redo();
    expect(store.getState().fills).toEqual([7]);
  });

  test('undo inside a burst goes back to before the burst', () => {
    const { store, history, addFill } = setup();
    addFill(1);
    addFill(2);
    history.undo();
    expect(store.getState().fills).toEqual([]);
  });

  test('the view is not part of it, and selection is cleared on restore', () => {
    const { store, history, addFill } = setup();
    store.setState((s) => ({ ui: { ...s.ui, lang: 'en' } }));
    expect(history.status.getState().canUndo).toBe(false);
    addFill(1);
    store.setState((s) => ({ ui: { ...s.ui, selKey: 'f1', hoverKey: 'f1' } }));
    vi.advanceTimersByTime(IDLE);
    history.undo();
    expect(store.getState().ui).toEqual({
      dragKey: null,
      selKey: null,
      hoverKey: null,
      lang: 'en',
    });
  });

  test('every document field is restored together', () => {
    const { store, history } = setup();
    store.setState({ gear: 1, fills: [1], route: 5 });
    vi.advanceTimersByTime(IDLE);
    history.undo();
    expect(store.getState()).toMatchObject({ gear: 0, fills: [], route: 0 });
  });

  test('the stack is capped, oldest steps dropping off first', () => {
    const store = createStore<S>()(() => ({
      route: 0,
      mix: 0,
      gear: 0,
      fills: [],
      foods: [],
      shops: [],
      foodLib: 0,
      combinedFillIds: [],
      ui: { dragKey: null, selKey: null, hoverKey: null, lang: 'pl' },
    }));
    const history = createPlanHistory(store, { idleMs: IDLE, limit: 3 });
    for (let i = 1; i <= 5; i++) {
      store.setState({ route: i });
      vi.advanceTimersByTime(IDLE);
    }
    for (let i = 0; i < 10; i++) history.undo();
    expect(store.getState().route).toBe(2);
  });
});
