import { afterEach, describe, expect, test } from 'vitest';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createFoodReorderHandler } from './listReorderHandler';

/**
 * A drag is a stream of moves, and each one has to build on the last.
 *
 * The handler reads *where* the card is from the DOM, which React has already re-rendered into the
 * new order — so the list it edits must be just as fresh. Editing the order captured at pointerdown
 * instead makes the second move of a drag undo the first: the card snaps back and the rider's food
 * priority, which is what autoplan reaches for first, comes out shuffled.
 */
const ROW_HEIGHT = 20;

/** Just enough of a card list for the handler: the two DOM calls it makes, and nothing else. */
function fakeList(keys: string[]) {
  const state = { keys: [...keys] };
  const container = {
    querySelectorAll: () =>
      state.keys.map((key, i) => ({
        dataset: { foodKey: key },
        getBoundingClientRect: () => ({ top: i * ROW_HEIGHT, height: ROW_HEIGHT }),
      })),
  };
  return { state, container };
}

interface Listeners {
  move?: (e: PointerEvent) => void;
  up?: () => void;
}

function fakeWindow(listeners: Listeners) {
  return {
    addEventListener: (type: string, fn: (e: PointerEvent) => void) => {
      if (type === 'pointermove') listeners.move = fn;
      if (type === 'pointerup') listeners.up = fn as () => void;
    },
    removeEventListener: () => {},
  };
}

const realWindow = (globalThis as { window?: unknown }).window;
afterEach(() => {
  (globalThis as { window?: unknown }).window = realWindow;
});

describe('createFoodReorderHandler', () => {
  test('a two-step drag lands where the pointer left it', () => {
    const { state, container } = fakeList(['gel', 'chew', 'cola', 'banana']);
    let order = [...state.keys];
    const listeners: Listeners = {};
    (globalThis as { window?: unknown }).window = fakeWindow(listeners);

    const handler = createFoodReorderHandler(
      'gel',
      (update) => {
        order = update(order);
        // What React does next: the list re-renders in the new order, and the next pointermove
        // reads the cards from there.
        state.keys = [...order];
      },
      () => {},
    );
    handler({
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: { closest: () => container },
    } as unknown as ReactPointerEvent);

    // Down one row, then one more — the same drag, sampled twice.
    listeners.move?.({ clientY: 25 } as PointerEvent);
    listeners.move?.({ clientY: 45 } as PointerEvent);

    expect(order).toEqual(['chew', 'cola', 'gel', 'banana']);
  });
});
