import { useState, type CSSProperties, type ReactElement } from 'react';
import type { Sport } from '../../domain/types';
import { SegmentedTrack, segmentItemStyle } from './SegmentedControl';

function BikeIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M5,23a5,5,0,1,1,5-5A5.006,5.006,0,0,1,5,23Zm0-8a3,3,0,1,0,3,3A3,3,0,0,0,5,15Zm14,8a5,5,0,1,1,5-5A5.006,5.006,0,0,1,19,23Zm0-8a3,3,0,1,0,3,3A3,3,0,0,0,19,15Zm-6,3V14a1,1,0,0,0-.349-.758l-2.286-1.965a.986.986,0,0,1-.348-.743.97.97,0,0,1,.274-.71l1.963-1.562a1.007,1.007,0,0,1,1.418.067l2.6,2.4a1,1,0,0,0,.679.266H20a1,1,0,0,0,0-2H17.34L15.063,6.892a2.973,2.973,0,0,0-4.105-.152L8.994,8.3a3,3,0,0,0,.068,4.491L11,14.459V18a1,1,0,0,0,2,0ZM16.5,1A2.5,2.5,0,1,0,19,3.5,2.5,2.5,0,0,0,16.5,1Z" />
    </svg>
  );
}

function RunIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M23,12a1,1,0,0,1-1,1H19.13a3.016,3.016,0,0,1-2.569-1.452L15.193,9.277,13.706,12.9a1,1,0,0,1-1.851-.758L13.555,8H11.616L9.552,13.032a1,1,0,0,0,.39,1.225l4.592,2.9A1,1,0,0,1,15,18v5a1,1,0,0,1-2,0V18.551l-4.126-2.6A3,3,0,0,1,7.7,12.273L9.454,8H7.236a.994.994,0,0,0-.894.552L4.895,11.447a1,1,0,0,1-1.79-.894l1.448-2.9A2.984,2.984,0,0,1,7.236,6h6.623A3.017,3.017,0,0,1,16.43,7.453l1.844,3.063A1.006,1.006,0,0,0,19.13,11H22A1,1,0,0,1,23,12ZM7.875,16.814a1,1,0,0,0-1.3.557A.994.994,0,0,1,5.646,18H3a1,1,0,0,0,0,2H5.646a2.987,2.987,0,0,0,2.786-1.886A1,1,0,0,0,7.875,16.814ZM15,5a2.5,2.5,0,1,0-2.5-2.5A2.5,2.5,0,0,0,15,5Z" />
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
  const iconSize = Math.round(size * 0.65);
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
