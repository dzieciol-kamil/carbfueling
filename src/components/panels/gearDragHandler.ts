import type { PointerEvent as ReactPointerEvent } from 'react';
import { useAppStore } from '../../store/appStore';

export function createVesselReorderHandler(gid: string) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const container = (ev.currentTarget as HTMLElement).closest('[data-gear-list]');
    if (!container) return;

    const move = (e2: PointerEvent) => {
      const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-gid]'));
      const fromIndex = cards.findIndex((c) => c.dataset.gid === gid);
      if (fromIndex === -1) return;
      let toIndex = cards.length - 1;
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (e2.clientY < rect.top + rect.height / 2) {
          toIndex = i;
          break;
        }
      }
      if (toIndex !== fromIndex) {
        useAppStore.getState().reorderVessel(fromIndex, toIndex);
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    useAppStore.getState().setDragKey('g' + gid);
  };
}
