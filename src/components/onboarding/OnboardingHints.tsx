import { useEffect, useState } from 'react';
import { t, type StringTable } from '../../i18n/strings';
import { isDesktopView, useAppStore } from '../../store/appStore';
import { autoplanGate } from '../autoplan/AutoplanFlow';
import { bubblePosition, type Rect } from '../tour/placement';
import { nextHint, type OnboardingHint } from './onboardingFlow';

/** What each hint points at: the route form, the "Suggest a plan" button (the Plan menu on a
 *  phone — both carry `data-tour="autoplan"`), the chart. */
const ANCHOR: Record<OnboardingHint, string> = {
  1: '[data-onboarding="route"]',
  2: '[data-tour="autoplan"]',
  3: '[data-tour="chart"]',
};

function hintText(hint: OnboardingHint, strings: StringTable, desktop: boolean): string {
  if (hint === 1) return desktop ? strings.hintRoute : strings.hintRouteMobile;
  return hint === 2 ? strings.hintAutoplan : strings.hintChart;
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.top === b.top &&
      a.left === b.left &&
      a.width === b.width &&
      a.height === b.height)
  );
}

/**
 * The three first-run hints (plan 2.1): one bubble at a time beside the thing it names, no dimmed
 * screen, closed with ×. It moves on by itself as the rider does what it asks (`nextHint`), is
 * persisted so a reload resumes it, and × ends the whole sequence. Hidden, not ended, while
 * something covers the page or its anchor isn't on screen (another mobile tab).
 */
export function OnboardingHints() {
  const hint = useAppStore((s) => s.ui.onboardingHint);
  const routeReady = useAppStore((s) => autoplanGate(s.route) !== 'noDuration');
  const hasPlan = useAppStore((s) => s.fills.length + s.foods.length > 0);
  const covered = useAppStore(
    (s) =>
      s.ui.setupOpen ||
      s.ui.tourStep !== null ||
      s.ui.panel !== null ||
      s.ui.routeSheet ||
      s.ui.mixSheet ||
      s.ui.shopSheet !== null ||
      s.ui.chartHelp,
  );
  const desktop = useAppStore((s) => isDesktopView(s.ui.viewMode, s.ui.autoView));
  const lang = useAppStore((s) => s.ui.lang);
  const setOnboardingHint = useAppStore((s) => s.setOnboardingHint);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const next = nextHint(hint, { routeReady, hasPlan });
    if (next !== hint) setOnboardingHint(next);
  }, [hint, routeReady, hasPlan, setOnboardingHint]);

  const visible = hint !== null && !covered;

  // Follows the anchor every frame, like the tour's spotlight: the mobile header scrolls away and
  // the desktop layout reflows as the plan fills in.
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(ANCHOR[hint]);
      const r = el?.getBoundingClientRect();
      const next =
        r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [visible, hint]);

  if (!visible || !rect) return null;

  const strings = t(lang);
  const { width, style } = bubblePosition(rect, 280, 120);

  return (
    <div
      role="status"
      style={{
        ...style,
        width,
        zIndex: 150,
        background: 'var(--selected-bg)',
        color: 'var(--on-brand)',
        borderRadius: 12,
        padding: '10px 12px 10px 14px',
        boxShadow: '0 14px 34px rgba(0,0,0,0.24)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 13,
        lineHeight: 1.45,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ flex: 1 }}>{hintText(hint, strings, desktop)}</span>
      <button
        type="button"
        onClick={() => setOnboardingHint(null)}
        aria-label={strings.hintClose}
        title={strings.hintClose}
        style={{
          border: 'none',
          background: 'none',
          color: 'inherit',
          opacity: 0.8,
          cursor: 'pointer',
          fontSize: 13,
          padding: 2,
          flex: '0 0 auto',
        }}
      >
        ✕
      </button>
    </div>
  );
}
