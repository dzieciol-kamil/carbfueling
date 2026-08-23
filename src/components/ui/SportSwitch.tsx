import type { CSSProperties } from 'react';
import type { Sport } from '../../domain/types';

const trackStyle: CSSProperties = {
  display: 'flex',
  boxSizing: 'border-box',
  background: 'var(--track)',
  borderRadius: 9,
  padding: 3,
  gap: 2,
};

function btnStyle(on: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 26,
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    background: on ? 'var(--ink)' : 'transparent',
    color: on ? '#fff' : 'var(--muted)',
  };
}

function BikeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={6} cy={17} r={3.3} />
      <circle cx={18} cy={17} r={3.3} />
      <path d="M6 17 L11 9 L16 9 L18 17 M11 9 L14 17" />
    </svg>
  );
}

function RunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={13.5} cy={4.5} r={1.7} fill="currentColor" stroke="none" />
      <path d="M12 6.5 L9 11 L5.5 13.5" />
      <path d="M9 11 L12.5 14.5 L11 19" />
      <path d="M12 6.5 L15.5 9 L18.5 7.5" />
      <path d="M12 6.5 L9.5 4.8" />
    </svg>
  );
}

export function SportSwitch({
  sport,
  onChange,
  cyclingLabel,
  runningLabel,
}: {
  sport: Sport;
  onChange: (sport: Sport) => void;
  cyclingLabel: string;
  runningLabel: string;
}) {
  return (
    <div style={trackStyle}>
      <button
        type="button"
        onClick={() => onChange('cycling')}
        style={btnStyle(sport === 'cycling')}
        aria-label={cyclingLabel}
        aria-pressed={sport === 'cycling'}
      >
        <BikeIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange('running')}
        style={btnStyle(sport === 'running')}
        aria-label={runningLabel}
        aria-pressed={sport === 'running'}
      >
        <RunIcon />
      </button>
    </div>
  );
}
