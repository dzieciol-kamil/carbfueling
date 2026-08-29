import type { PointerEvent as ReactPointerEvent } from 'react';
import { moveListItem } from '../../domain/dragMath';

/**
 * The order is asked for, not held.
 *
 * A drag fires many moves, and each reads the card positions out of a DOM React has already
 * re-rendered. Closing over the order as it stood at pointerdown makes every move after the first
 * edit a list that no longer exists, so the card snaps back where it started. The updater form
 * keeps the two halves — where the card is now, and what the list is now — on the same clock.
 */
export function createFoodReorderHandler(
  foodKey: string,
  onReorder: (update: (prev: string[]) => string[]) => void,
  onDragKeyChange: (key: string | null) => void,
) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const container = (ev.currentTarget as HTMLElement).closest('[data-food-list]');
    if (!container) return;

    const move = (e2: PointerEvent) => {
      const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-food-key]'));
      const fromIndex = cards.findIndex((c) => c.dataset.foodKey === foodKey);
      if (fromIndex === -1) return;
      let toIndex = cards.length - 1;
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (e2.clientY < rect.top + rect.height / 2) {
          toIndex = i;
          break;
        }
      }
      if (toIndex !== fromIndex) onReorder((prev) => moveListItem(prev, fromIndex, toIndex));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onDragKeyChange(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    onDragKeyChange(foodKey);
  };
}
