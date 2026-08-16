import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  dragGelPart,
  moveFill,
  moveFood,
  moveShop,
  rescalePositions,
  resizeFillLeft,
  resizeFillRight,
  resizeFoodLeft,
  resizeFoodRight,
} from '../../domain/dragMath';
import { dist } from '../../domain/fuel';
import { useAppStore } from '../../store/appStore';

export type FillDragMode = 'move' | 'left' | 'resize';

function trackWidthKmPerPixel(track: Element, distanceKm: number): number {
  const rect = track.getBoundingClientRect();
  return distanceKm / Math.max(1, rect.width);
}

export function createFillDragHandler(fid: number, mode: FillDragMode) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    let bar = ev.currentTarget as HTMLElement;
    if (mode !== 'move') bar = bar.parentElement as HTMLElement;
    const track = bar?.parentElement;
    if (!track) return;

    const state = useAppStore.getState();
    const f = state.fills.find((x) => x.fid === fid);
    if (!f) return;
    const distanceKm = dist(state.route);
    const kpp = trackWidthKmPerPixel(track, distanceKm);
    let x0 = ev.clientX;
    const from0 = f.from;
    const to0 = f.to;
    const pos0 = f.pos ? f.pos.slice() : undefined;
    const siblings = state.fills.filter((x) => x.gid === f.gid);
    // Where the dragged fill sits now; a swap re-bases this (and the pointer anchor)
    // so the bar keeps tracking the cursor from its new slot.
    let base = { from: f.from, to: f.to };

    const move = (e2: PointerEvent) => {
      const d = (e2.clientX - x0) * kpp;
      if (mode === 'move') {
        const live = useAppStore.getState().fills;
        const { from, to, swap } = moveFill(
          { ...f, ...base },
          live.filter((x) => x.gid === f.gid),
          distanceKm,
          d,
        );
        if (swap) {
          const other = live.find((x) => x.fid === swap.fid);
          useAppStore.getState().updateFill(swap.fid, {
            from: swap.from,
            to: swap.to,
            pos: other && rescalePositions(other.pos, other.from, other.to, swap.from, swap.to),
          });
          base = { from, to };
          x0 = e2.clientX;
        }
        const pos = rescalePositions(pos0, from0, to0, from, to);
        useAppStore.getState().updateFill(fid, { from, to, pos });
        return;
      }
      const bounds = { lo: 0, hi: distanceKm };
      siblings.forEach((x) => {
        if (x.fid === f.fid) return;
        if (x.to <= from0) bounds.lo = Math.max(bounds.lo, x.to);
        else if (x.from >= to0) bounds.hi = Math.min(bounds.hi, x.from);
      });
      if (mode === 'left') {
        const from = resizeFillLeft(f, bounds, d, from0);
        const pos = rescalePositions(pos0, from0, to0, from, to0);
        useAppStore.getState().updateFill(fid, { from, pos });
      } else {
        const to = resizeFillRight(f, bounds, d, to0);
        const pos = rescalePositions(pos0, from0, to0, from0, to);
        useAppStore.getState().updateFill(fid, { to, pos });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    useAppStore.getState().setDragKey('f' + fid);
  };
}

export function createGelPartDragHandler(fid: number, k: number) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const bar = (ev.currentTarget as HTMLElement).parentElement;
    const track = bar?.parentElement;
    if (!track) return;

    const state = useAppStore.getState();
    const f = state.fills.find((x) => x.fid === fid);
    if (!f) return;
    const distanceKm = dist(state.route);
    const kpp = trackWidthKmPerPixel(track, distanceKm);
    const x0 = ev.clientX;
    const gear = state.gear;

    const move = (e2: PointerEvent) => {
      const d = (e2.clientX - x0) * kpp;
      const pos = dragGelPart(f, gear, k, d, distanceKm);
      useAppStore.getState().updateFill(fid, { pos });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    useAppStore.getState().setDragKey('f' + fid);
  };
}

export type FoodDragMode = 'move' | 'left' | 'resize';

export function createFoodDragHandler(id: number, mode: FoodDragMode) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    let bar = ev.currentTarget as HTMLElement;
    if (mode !== 'move') bar = bar.parentElement as HTMLElement;
    const track = bar?.parentElement;
    if (!track) return;

    const state = useAppStore.getState();
    const fd = state.foods.find((x) => x.id === id);
    if (!fd) return;
    const distanceKm = dist(state.route);
    const kpp = trackWidthKmPerPixel(track, distanceKm);
    const x0 = ev.clientX;
    const from0 = fd.from;
    const to0 = fd.to;

    const move = (e2: PointerEvent) => {
      const d = (e2.clientX - x0) * kpp;
      if (mode === 'move') {
        const { from, to } = moveFood(fd, distanceKm, d);
        useAppStore.getState().updateFood(id, { from, to });
      } else if (mode === 'left') {
        useAppStore.getState().updateFood(id, { from: resizeFoodLeft(fd, d, from0) });
      } else {
        useAppStore.getState().updateFood(id, { to: resizeFoodRight(fd, distanceKm, d, to0) });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    useAppStore.getState().setDragKey('x' + id);
  };
}

export function createShopDragHandler(id: number) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const track = (ev.currentTarget as HTMLElement).parentElement;
    if (!track) return;

    const state = useAppStore.getState();
    const shop = state.shops.find((x) => x.id === id);
    if (!shop) return;
    const distanceKm = dist(state.route);
    const kpp = trackWidthKmPerPixel(track, distanceKm);
    const x0 = ev.clientX;
    const at0 = shop.at;

    const move = (e2: PointerEvent) => {
      const d = (e2.clientX - x0) * kpp;
      const at = moveShop({ ...shop, at: at0 }, distanceKm, d);
      useAppStore.getState().updateShop(id, { at });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    useAppStore.getState().setDragKey('s' + id);
  };
}

export function stopPointerDown(ev: ReactPointerEvent) {
  ev.stopPropagation();
  ev.preventDefault();
}
