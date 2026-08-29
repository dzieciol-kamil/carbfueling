import type { CSSProperties } from 'react';
import { createStopDragHandler, stopPointerDown } from '../lanes/dragHandlers';
import { fmtX } from '../../domain/fuel';
import type { RouteInput, XUnit } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from './theme';

const PIN_W = 16;
const PIN_H = 18;

interface StopMarkersProps {
  distanceKm: number;
  height: number;
  bottomPadding: number;
  route: RouteInput;
  xUnit: XUnit;
}

function pinButtonStyle(leftPct: number): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - ${PIN_W / 2}px)`,
    top: -8,
    width: PIN_W,
    height: PIN_H,
    cursor: 'grab',
    touchAction: 'none',
    pointerEvents: 'auto',
  };
}

function lineStyle(
  leftPct: number,
  height: number,
  bottomPadding: number,
  on: boolean,
): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - 0.75px)`,
    top: 9,
    width: 1.5,
    height: height - bottomPadding - 9,
    background: CHART_COLORS.ink,
    opacity: on ? 0.9 : 0.55,
    pointerEvents: 'none',
  };
}

function nameInputStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: -38,
    transform: 'translateX(-50%)',
    width: 76,
    boxSizing: 'border-box',
    padding: '3px 5px',
    border: '1px solid rgba(0,0,0,0.18)',
    borderRadius: 5,
    background: '#fff',
    color: CHART_COLORS.ink,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    textAlign: 'center',
    cursor: 'text',
    zIndex: 3,
    display: show ? 'block' : 'none',
  };
}

// While dragging, the current km/time reading is shown beside the pin's round head, not above
// it — an above position would sit right on top of the chart's legend row (Wchłonięte /
// Zapotrzebowanie / Limit wchłaniania), obscuring it. Flips to the left near the end of the
// route so the label doesn't run off the chart's right edge, mirroring MobileChart.tsx's stop
// label, which already does the same beside-not-above placement.
function dragLabelStyle(flip: boolean): CSSProperties {
  return {
    position: 'absolute',
    top: 7,
    ...(flip ? { right: PIN_W / 2 + 6 } : { left: PIN_W / 2 + 6 }),
    transform: 'translateY(-50%)',
    background: CHART_COLORS.ink,
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    padding: '2px 5px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
  };
}

function removeButtonStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: -14,
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    padding: 0,
    border: 'none',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 8,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    display: show ? 'flex' : 'none',
  };
}

export function StopMarkers({ distanceKm, height, bottomPadding, route, xUnit }: StopMarkersProps) {
  const stops = useAppStore((s) => s.stops);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const lang = useAppStore((s) => s.ui.lang);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeStop = useAppStore((s) => s.removeStop);
  const updateStop = useAppStore((s) => s.updateStop);
  const strings = t(lang);

  return (
    <>
      {stops.map((stop) => {
        const key = 's' + stop.id;
        const on = hoverKey === key;
        const dragging = dragKey === key;
        const leftPct = (stop.at / distanceKm) * 100;
        const flip = leftPct > 82;
        return (
          <div key={stop.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={lineStyle(leftPct, height, bottomPadding, on || dragging)} />
            <div
              onPointerDown={createStopDragHandler(stop.id)}
              onPointerEnter={() => setHoverKey(key)}
              onPointerLeave={() => setHoverKey(null)}
              style={pinButtonStyle(leftPct)}
            >
              <svg
                width={PIN_W}
                height={PIN_H}
                viewBox="0 0 16 18"
                style={{ display: 'block', overflow: 'visible' }}
              >
                <path
                  d="M8 18C8 18 1 10.5 1 7A7 7 0 1 1 15 7C15 10.5 8 18 8 18Z"
                  fill={CHART_COLORS.ink}
                  opacity={on || dragging ? 1 : 0.75}
                />
              </svg>
              <button
                onClick={() => removeStop(stop.id)}
                onPointerDown={stopPointerDown}
                title={strings.removeItem}
                style={removeButtonStyle(on && !dragging)}
              >
                ✕
              </button>
              <input
                type="text"
                value={stop.name}
                maxLength={10}
                aria-label={strings.stopSheetName}
                placeholder={strings.stopDefaultName}
                onChange={(e) => updateStop(stop.id, { name: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                }}
                style={nameInputStyle(on && !dragging)}
              />
              {dragging && (
                <span style={dragLabelStyle(flip)}>{fmtX(stop.at, true, route, xUnit)}</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
