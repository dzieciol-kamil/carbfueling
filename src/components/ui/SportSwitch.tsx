import { useState, type CSSProperties, type ReactElement } from 'react';
import type { Sport } from '../../domain/types';
import { SegmentedTrack, segmentItemStyle } from './SegmentedControl';

function BikeIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="15" r="3.3" />
      <circle cx="18" cy="15" r="3.3" />
      <path d="M6 15 L9 9 L15 9 L18 15" />
      <path d="M7 10 L7 9 L9 9 L13 15 L18 15" />
      <path d="M13 15 L16 7 L14 7 L17 7" />
    </svg>
  );
}

function RunIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: 'scaleX(-1)' }}
    >
      <circle cx="13.5" cy="4.5" r="1.7" fill="currentColor" />
      <path d="M13.5 4.5 L11 13 L14 16 L12 20" />
      <path d="M11 13 L8 15 L4 13" />
      <path d="M17 8 L15 10 L13 7 L9 7 L7 9" />
    </svg>
  );
}

const ICONS: Record<Sport, (props: { size: number }) => ReactElement> = {
  cycling: BikeIcon,
  running: RunIcon,
};
const ORDER: Sport[] = ['cycling', 'running'];

function iconItemStyle(selected: boolean, hovered: boolean, size: number): CSSProperties {
  const base = segmentItemStyle(selected, { fullWidth: false });
  return {
    ...base,
    color: !selected && hovered ? 'var(--ink-soft)' : base.color,
    background: !selected && hovered ? 'rgba(0,0,0,0.06)' : base.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    padding: 0,
  };
}

export function SportSwitch({
  sport,
  onChange,
  cyclingLabel,
  runningLabel,
  size = 30,
}: {
  sport: Sport;
  onChange: (sport: Sport) => void;
  cyclingLabel: string;
  runningLabel: string;
  /** Button size in px — bump to 44 on mobile so it matches the touch-target size used
   *  elsewhere (e.g. MobileStepper's arrow buttons) instead of reading visibly smaller. */
  size?: number;
}) {
  const labels: Record<Sport, string> = { cycling: cyclingLabel, running: runningLabel };
  const iconSize = Math.round(size * 0.55);
  const [hovered, setHovered] = useState<Sport | null>(null);
  return (
    <SegmentedTrack selectedIndex={ORDER.indexOf(sport)} fullWidth={false} style={{ gap: 2 }}>
      {(registerRef) =>
        ORDER.map((value, i) => {
          const Icon = ICONS[value];
          return (
            <button
              key={value}
              ref={registerRef(i)}
              type="button"
              onClick={() => onChange(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered((h) => (h === value ? null : h))}
              title={labels[value]}
              aria-label={labels[value]}
              aria-pressed={value === sport}
              style={iconItemStyle(value === sport, value === hovered, size)}
            >
              <Icon size={iconSize} />
            </button>
          );
        })
      }
    </SegmentedTrack>
  );
}
