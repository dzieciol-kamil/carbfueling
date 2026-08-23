import type { CSSProperties, ReactElement } from 'react';
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
    >
      <circle cx={13.5} cy={4.5} r={1.7} fill="currentColor" stroke="none" />
      <path d="M12 6.5 L9 11 L5.5 13.5" />
      <path d="M9 11 L12.5 14.5 L11 19" />
      <path d="M12 6.5 L15.5 9 L18.5 7.5" />
      <path d="M12 6.5 L9.5 4.8" />
    </svg>
  );
}

const ICONS: Record<Sport, (props: { size: number }) => ReactElement> = {
  cycling: BikeIcon,
  running: RunIcon,
};
const ORDER: Sport[] = ['cycling', 'running'];

function iconItemStyle(selected: boolean, size: number): CSSProperties {
  return {
    ...segmentItemStyle(selected, { fullWidth: false }),
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
              aria-label={labels[value]}
              aria-pressed={value === sport}
              style={iconItemStyle(value === sport, size)}
            >
              <Icon size={iconSize} />
            </button>
          );
        })
      }
    </SegmentedTrack>
  );
}
