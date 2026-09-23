import type { CSSProperties } from 'react';
import { clampStepValue } from './mobileMath';

export interface MobileStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  smallStep: number;
  bigStep: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  disabled?: boolean;
  /**
   * Puts the label on its own full-width line above the stepper controls instead of squeezed
   * into the same row. The default inline layout works fine for this component's usual short
   * labels ("od", "do", "Waga (kg)"), but MobileMix.tsx's mix-settings rows use noticeably longer
   * ones ("cukry (g/100 ml)", "Sok z cytryny (ml)") that only have ~40-100px of column left next
   * to five 44px-wide buttons on a phone-width screen — that squeeze wrapped the label onto 2-3
   * cramped, low-contrast lines, easy to mistake for a missing label at a glance on a real device.
   */
  stackedLabel?: boolean;
}

const btnBase: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 11,
  border: '1px solid var(--chip-border)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--ink)',
  flex: '0 0 auto',
};
const bigBtnStyle: CSSProperties = { ...btnBase, background: 'var(--surface-soft)', fontSize: 12 };
const smallBtnStyle: CSSProperties = { ...btnBase, background: 'var(--surface)' };
const valueStyle: CSSProperties = {
  minWidth: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
};

export function MobileStepper({
  label,
  value,
  onChange,
  smallStep,
  bigStep,
  min,
  max,
  format,
  disabled,
  stackedLabel = false,
}: MobileStepperProps) {
  const fmt = format ?? ((v: number) => String(Math.round(v)));
  const bump = (delta: number) => onChange(clampStepValue(value, delta, min, max));
  const dim: CSSProperties = disabled
    ? { opacity: 0.5, cursor: 'not-allowed', color: 'var(--muted-3)' }
    : {};
  const labelEl = label && (
    <span
      style={{
        fontSize: 12,
        color: 'var(--muted-2)',
        flex: stackedLabel ? '1 1 100%' : '1 1 auto',
      }}
    >
      {label}
    </span>
  );
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: stackedLabel ? 'wrap' : 'nowrap',
        gap: stackedLabel ? 4 : 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {labelEl}
      <button
        type="button"
        disabled={disabled}
        style={{ ...bigBtnStyle, ...dim }}
        onClick={() => bump(-bigStep)}
        aria-label={'-' + bigStep}
      >
        {'<<'}
      </button>
      <button
        type="button"
        disabled={disabled}
        style={{ ...smallBtnStyle, ...dim }}
        onClick={() => bump(-smallStep)}
        aria-label={'-' + smallStep}
      >
        {'<'}
      </button>
      <span style={valueStyle}>{fmt(value)}</span>
      <button
        type="button"
        disabled={disabled}
        style={{ ...smallBtnStyle, ...dim }}
        onClick={() => bump(smallStep)}
        aria-label={'+' + smallStep}
      >
        {'>'}
      </button>
      <button
        type="button"
        disabled={disabled}
        style={{ ...bigBtnStyle, ...dim }}
        onClick={() => bump(bigStep)}
        aria-label={'+' + bigStep}
      >
        {'>>'}
      </button>
    </div>
  );
}
