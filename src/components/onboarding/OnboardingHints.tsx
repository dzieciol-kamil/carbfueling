import { useEffect, useRef, useState } from 'react';
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
  const gate = useAppStore((s) => autoplanGate(s.route));
  // Under an hour autoplan returns nothing, so "Generate your first plan" would wait forever:
  // a short ride counts as planned and goes straight to the chart hint.
  const hasPlan = useAppStore((s) => s.fills.length + s.foods.length > 0) || gate === 'shortRide';
  const covered = useAppStore(
    (s) =>
      s.ui.setupOpen ||
      s.ui.tourStep !== null ||
      s.ui.panel !== null ||
      s.ui.routeSheet ||
      s.ui.mixSheet ||
      s.ui.shopSheet !== null ||
      s.ui.chartHelp ||
      // The tour's sample is not the rider's plan: it must neither advance the hints nor be
      // pointed at by them.
      s.preTourDoc !== null,
  );
  const desktop = useAppStore((s) => isDesktopView(s.ui.viewMode, s.ui.autoView));
  const lang = useAppStore((s) => s.ui.lang);
  const setOnboardingHint = useAppStore((s) => s.setOnboardingHint);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (covered) return;
    const next = nextHint(hint, { routeReady: gate !== 'noDuration', hasPlan });
    if (next !== hint) setOnboardingHint(next);
  }, [covered, hint, gate, hasPlan, setOnboardingHint]);

  const visible = hint !== null && !covered;

  // The route hint asks for a distance, so put the cursor there — once, as it first appears
  // (after the setup closes or on a reload that resumes it). Desktop only: on a phone the anchor
  // is the "Edit route" button, and popping the keyboard unasked would be worse than a tap.
  const focused = useRef(false);
  useEffect(() => {
    if (!visible || hint !== 1 || !desktop || focused.current) return;
    focused.current = true;
    document.querySelector<HTMLInputElement>(`${ANCHOR[1]} input`)?.focus();
  }, [visible, hint, desktop]);

  // Follows the anchor as the page scrolls or reflows (the mobile header scrolls away, the desktop
  // layout moves as the plan fills in). Events plus a slow poll, not a per-frame loop: the chart
  // hint can stay up for a whole session.
  useEffect(() => {
    if (!visible) return;
    const measure = () => {
      const el = document.querySelector(ANCHOR[hint]);
      // Step aside while the anchor's own menu is open (the phone's Plan menu): the bubble
      // would sit right on top of the list it is asking the rider to use.
      const menuOpen = !!el?.querySelector('[aria-expanded="true"]');
      const r = menuOpen ? undefined : el?.getBoundingClientRect();
      const next =
        r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));
    };
    measure();
    const poll = setInterval(measure, 300);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    // After the click has been handled, so an opened menu is already marked expanded.
    const onClick = () => setTimeout(measure);
    window.addEventListener('click', onClick, true);
    return () => {
      clearInterval(poll);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      window.removeEventListener('click', onClick, true);
    };
  }, [visible, hint]);

  if (!visible || !rect) return null;

  const strings = t(lang);
  const { width, style } = bubblePosition(rect, hint === 3 ? 380 : 280, 120);
  // The bubble has to point at something, or it reads as a stray toast: a caret on the edge
  // facing the anchor, aimed near its left end (a wide anchor such as the chart has no useful
  // centre), and a ring around the anchor itself.
  const below = style.top !== undefined;
  const bubbleLeft = Number(style.left);
  const caretX = Math.min(
    Math.max(rect.left + Math.min(rect.width / 2, 60) - bubbleLeft, 18),
    width - 18,
  );

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: rect.top - 5,
          left: rect.left - 5,
          width: rect.width + 10,
          height: rect.height + 10,
          border: '2px solid var(--selected-bg)',
          borderRadius: 14,
          boxShadow: '0 0 0 4px rgba(90,163,63,0.25)',
          pointerEvents: 'none',
          zIndex: 149,
          boxSizing: 'border-box',
        }}
      />
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
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: caretX - 7,
            [below ? 'top' : 'bottom']: -6,
            width: 14,
            height: 14,
            background: 'var(--selected-bg)',
            transform: 'rotate(45deg)',
            borderRadius: 2,
          }}
        />
        <span style={{ flex: 1, position: 'relative', whiteSpace: 'pre-line' }}>
          {hintText(hint, strings, desktop)}
        </span>
        <button
          type="button"
          onClick={() => setOnboardingHint(null)}
          aria-label={strings.hintClose}
          title={strings.hintClose}
          style={{
            position: 'relative',
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
    </>
  );
}
