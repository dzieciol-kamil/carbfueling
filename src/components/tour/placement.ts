import type { CSSProperties } from 'react';

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGIN = 14;

// On mobile the page itself doesn't scroll — MobileApp is a fixed-position shell and
// this inner element (flex:1, between the sticky header and the bottom tab bar) is the
// actual scroll container. Centering/placement math must scroll and bound itself against
// this element instead of `window` there, since `window.scrollTo` is a no-op on that shell
// and `window.innerHeight` would ignore the tab bar sitting below it.
export function mobileScrollEl(): HTMLElement | null {
  return document.querySelector('[data-mobile-scroll]');
}

/**
 * Where a card pointing at `target` goes: below it when there is room for `minBelow` px (or more
 * room than above), above it otherwise, its left edge on the target's and kept inside the screen.
 * Shared by the tour's cards and the first-run hints.
 */
export function bubblePosition(
  target: Rect,
  maxWidth: number,
  minBelow: number,
): { width: number; style: CSSProperties } {
  // Narrow phones can't fit the desktop-sized card between the margins.
  const width = Math.min(maxWidth, window.innerWidth - MARGIN * 2);
  // The mobile scroll container's own rect already excludes the bottom tab bar (a flex
  // sibling below it), so bound placement against it there instead of window.innerHeight,
  // which would let the card land underneath the tab bar.
  const viewportBottom = mobileScrollEl()?.getBoundingClientRect().bottom ?? window.innerHeight;
  const spaceBelow = viewportBottom - (target.top + target.height);
  const placeBelow = spaceBelow > minBelow || spaceBelow > target.top;
  const left = Math.min(Math.max(MARGIN, target.left), window.innerWidth - width - MARGIN);
  return {
    width,
    style: placeBelow
      ? { position: 'fixed', top: target.top + target.height + 14, left }
      : { position: 'fixed', bottom: window.innerHeight - target.top + 14, left },
  };
}
