import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

export interface SegmentedControlOption<T> {
  value: T;
  label: string;
}

interface SegmentedTrackProps {
  /** Index of the child to highlight, or -1 to hide the indicator (e.g. while disabled). */
  selectedIndex: number;
  fullWidth?: boolean;
  style?: CSSProperties;
  /** Render children, wiring each one's ref through `registerRef(index)`. */
  children: (registerRef: (index: number) => (el: HTMLElement | null) => void) => ReactNode;
}

/**
 * Low-level pill track + sliding indicator, for toggle shapes SegmentedControl's plain
 * value/label options can't express (e.g. a segment containing its own input). Most call
 * sites should reach for SegmentedControl instead.
 */
export function SegmentedTrack({
  selectedIndex,
  fullWidth = true,
  style,
  children,
}: SegmentedTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const observedElRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = itemRefs.current[selectedIndex];
    const container = containerRef.current;
    if (!el || !container) {
      setIndicator(null);
      return;
    }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver(() => {
        const target = observedElRef.current;
        if (target) setIndicator({ left: target.offsetLeft, width: target.offsetWidth });
      });
    }
    observedElRef.current = el;
    const observer = observerRef.current;
    observer.disconnect();
    observer.observe(el);
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedIndex]);

  const registerRef = (index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        background: 'var(--track)',
        borderRadius: 9,
        padding: 3,
        boxSizing: 'border-box',
        ...(fullWidth ? { width: '100%' } : {}),
        ...style,
      }}
    >
      {indicator && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: indicator.left,
            width: indicator.width,
            borderRadius: 7,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition:
              'left 200ms cubic-bezier(0.22,0.9,0.3,1), width 200ms cubic-bezier(0.22,0.9,0.3,1)',
          }}
        />
      )}
      {children(registerRef)}
    </div>
  );
}

export function segmentItemStyle(
  selected: boolean,
  opts: { minHeight?: number; disabled?: boolean; fullWidth?: boolean } = {},
): CSSProperties {
  const { minHeight, disabled = false, fullWidth = true } = opts;
  return {
    position: 'relative',
    zIndex: 1,
    flex: fullWidth ? '1 1 0' : '0 0 auto',
    minWidth: 0,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    border: 'none',
    borderRadius: 7,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    color: disabled ? 'var(--muted-3)' : selected ? 'var(--ink)' : 'var(--muted)',
    transition: 'color 150ms ease',
    ...(minHeight
      ? {
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
        }
      : { padding: '8px 6px' }),
  };
}

interface SegmentedControlProps<T> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Equal-width segments filling the container (default). Set false for compact, content-sized segments. */
  fullWidth?: boolean;
  /** Touch-friendly button height (e.g. 44 on mobile). Omit for the compact desktop sizing. */
  minHeight?: number;
  disabled?: boolean;
  style?: CSSProperties;
}

export function SegmentedControl<T>({
  options,
  value,
  onChange,
  fullWidth = true,
  minHeight,
  disabled = false,
  style,
}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  return (
    <SegmentedTrack
      selectedIndex={disabled ? -1 : selectedIndex}
      fullWidth={fullWidth}
      style={{ opacity: disabled ? 0.6 : 1, ...style }}
    >
      {(registerRef) =>
        options.map((opt, i) => (
          <button
            key={String(opt.value)}
            ref={registerRef(i)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            style={segmentItemStyle(opt.value === value, { minHeight, disabled, fullWidth })}
          >
            {opt.label}
          </button>
        ))
      }
    </SegmentedTrack>
  );
}
