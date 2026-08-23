import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface InfoPopoverProps {
  /** The hint content shown in the popover when triggered. */
  hint: ReactNode;
  /** The trigger content (label + ⓘ glyph, typically). */
  children: ReactNode;
  /** Accessible name for the trigger — needed when `children` is a bare glyph with no
   *  descriptive text of its own (unlike e.g. "(Recovery: ~30–60g ⓘ)"). */
  ariaLabel?: string;
  /** Extra style applied to the clickable trigger span. */
  triggerStyle?: CSSProperties;
  /** Extra style applied to the popover bubble (mainly used for positioning). */
  popoverStyle?: CSSProperties;
}

const basePopoverStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 20,
  maxWidth: 'min(240px, calc(100vw - 32px))',
  width: 'max-content',
  background: '#2B2F2A',
  color: '#fff',
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.4,
  padding: '8px 10px',
  borderRadius: 8,
  boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
  whiteSpace: 'normal',
  textTransform: 'none',
  letterSpacing: 'normal',
};

/**
 * A small click/tap-to-reveal hint bubble, anchored to an inline trigger.
 *
 * Native `title` tooltips only fire on mouse hover, so they never work on
 * touch devices. This toggles a popover on click/tap instead, and closes it
 * on an outside click/tap (or a second tap on the trigger).
 */
export function InfoPopover({
  hint,
  children,
  ariaLabel,
  triggerStyle,
  popoverStyle,
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        style={{ cursor: 'pointer', ...triggerStyle }}
      >
        {children}
      </span>
      {open && (
        <span role="tooltip" style={{ ...basePopoverStyle, ...popoverStyle }}>
          {hint}
        </span>
      )}
    </span>
  );
}
