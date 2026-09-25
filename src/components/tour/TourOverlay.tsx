import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { bubblePosition, mobileScrollEl, type Rect } from './placement';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';
import { TOUR_STEPS, type TourStep } from './tourSteps';

function measure(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 8;
const TOOLTIP_WIDTH = 320;
const BACKDROP = 'rgba(18,20,18,0.55)';

export function TourOverlay() {
  const tourStep = useAppStore((s) => s.ui.tourStep);
  const lang = useAppStore((s) => s.ui.lang);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const closeTour = useAppStore((s) => s.closeTour);
  const restorePreTourPlan = useAppStore((s) => s.restorePreTourPlan);
  const strings = t(lang);
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step: TourStep | null = tourStep !== null ? TOUR_STEPS[tourStep] : null;

  useLayoutEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const target = step.target;
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) {
      // Center the spotlight + tooltip as one combined block, not just the
      // spotlight alone — centering the target by itself can leave no room
      // for the tooltip, pushing it (and the page) further than expected.
      const targetRect = el.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.getBoundingClientRect().height ?? 0;
      const combinedHeight = targetRect.height + (tooltipHeight ? tooltipHeight + 14 : 0);
      const scrollEl = mobileScrollEl();
      if (scrollEl) {
        const scrollRect = scrollEl.getBoundingClientRect();
        const contentTop = targetRect.top - scrollRect.top + scrollEl.scrollTop;
        let desiredScrollTop = contentTop - (scrollRect.height - combinedHeight) / 2;
        // The chart+lane-strip block above the plan list is `position: sticky` and paints
        // above later siblings once stuck (it has a higher z-index so it doesn't get
        // visually pushed away like a normal sibling would). A target below it — the
        // coverage cards, a fill row, an add button — still reports its true (unoccluded)
        // layout position via getBoundingClientRect, so "centering" naively can scroll far
        // enough to tuck the target's top edge behind that sticky panel while still
        // reporting/highlighting it as if fully visible. Cap the scroll so the target's
        // top never ends up above the sticky panel's bottom edge.
        const stickyHeight =
          document.querySelector('[data-mobile-sticky]')?.getBoundingClientRect().height ?? 0;
        desiredScrollTop = Math.min(desiredScrollTop, contentTop - stickyHeight);
        scrollEl.scrollTo({ top: Math.max(0, desiredScrollTop), behavior: 'auto' });
      } else {
        const docTop = targetRect.top + window.scrollY;
        const desiredScrollY = docTop - (window.innerHeight - combinedHeight) / 2;
        window.scrollTo({ top: Math.max(0, desiredScrollY), behavior: 'smooth' });
      }
    }

    let raf = 0;
    const tick = () => {
      const next = measure(target);
      setRect((prev) =>
        prev &&
        next &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    if (!step?.onEnter) return;
    const cleanup = step.onEnter();
    return () => cleanup?.();
  }, [step]);

  useEffect(() => {
    if (tourStep === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourStep, closeTour]);

  if (tourStep === null || !step) return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const cutout = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;
  const bodyKey = mobileScrollEl() && step.mobileBodyKey ? step.mobileBodyKey : step.bodyKey;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {cutout ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, cutout.top),
              background: BACKDROP,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: cutout.top + cutout.height,
              left: 0,
              right: 0,
              bottom: 0,
              background: BACKDROP,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: cutout.top,
              left: 0,
              width: Math.max(0, cutout.left),
              height: cutout.height,
              background: BACKDROP,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: cutout.top,
              left: cutout.left + cutout.width,
              right: 0,
              height: cutout.height,
              background: BACKDROP,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
              borderRadius: 10,
              border: '2px solid var(--ink)',
              boxShadow: '0 0 0 4px rgba(90,163,63,0.25)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: BACKDROP }} />
      )}

      <TourTooltip ref={tooltipRef} cutout={cutout}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {strings.tourStepLabel} {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <button
            onClick={closeTour}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--muted)',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings[step.titleKey]}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
          {strings[bodyKey]}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 4,
          }}
        >
          <button onClick={closeTour} style={tourGhostBtn}>
            {strings.tourSkip}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={() => setTourStep(tourStep - 1)} style={tourGhostBtn}>
                {strings.tourBack}
              </button>
            )}
            {!isLast && (
              <button onClick={() => setTourStep(tourStep + 1)} style={tourPrimaryBtn}>
                {strings.tourNext}
              </button>
            )}
          </div>
        </div>
        {/* The tour ends on a choice rather than "Finish": the sample took the rider's own plan's
            place, and Skip or × above keep it too (the sample bar still offers the restore). */}
        {isLast && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={closeTour} style={tourGhostBtn}>
              {strings.tourKeepSample}
            </button>
            <button
              onClick={() => {
                restorePreTourPlan();
                closeTour();
              }}
              style={tourPrimaryBtn}
            >
              {strings.tourRestore}
            </button>
          </div>
        )}
      </TourTooltip>
    </div>
  );
}

interface TourTooltipProps {
  cutout: Rect | null;
  children: ReactNode;
}

const TourTooltip = forwardRef<HTMLDivElement, TourTooltipProps>(function TourTooltip(
  { cutout, children },
  ref,
) {
  const { width, style: pos } = cutout
    ? bubblePosition(cutout, TOOLTIP_WIDTH, 280)
    : {
        width: Math.min(TOOLTIP_WIDTH, window.innerWidth - 28),
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        } as CSSProperties,
      };

  return (
    <div
      ref={ref}
      style={{
        ...pos,
        width,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
        maxHeight: 'calc(100vh - 28px)',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
});
