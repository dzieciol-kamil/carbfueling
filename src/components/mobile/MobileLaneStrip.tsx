import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { dist, partArray } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { foodTouchHitbox } from './mobileMath';

const LABEL_WIDTH = 46;
const ROW_GAP = 6;

const rowLabelStyle: CSSProperties = {
  flex: '0 0 46px',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-2)',
};

function trackStyle(background: string): CSSProperties {
  return { position: 'relative', flex: '1 1 auto', height: 26, borderRadius: 7, background };
}

export function MobileLaneStrip() {
  const route = useAppStore((s) => s.route);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const lang = useAppStore((s) => s.ui.lang);
  const selKey = useAppStore((s) => s.ui.selKey);
  const setSelKey = useAppStore((s) => s.setSelKey);
  const strings = t(lang);

  const containerRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setTrackWidth(Math.max(0, w - LABEL_WIDTH - ROW_GAP));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const distanceKm = dist(route);
  const kmToPx = (km: number) => (distanceKm > 0 ? (km / distanceKm) * trackWidth : 0);
  const vesselsWithFills = gear.filter((v) => fills.some((f) => f.gid === v.gid));

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {vesselsWithFills.map((vessel) => (
        <div key={vessel.gid} style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP }}>
          <span style={rowLabelStyle}>{vessel.name}</span>
          <div style={trackStyle('var(--track)')}>
            {fills
              .filter((f) => f.gid === vessel.gid)
              .map((fill) => {
                const key = 'f' + fill.fid;
                const selected = selKey === key;
                const leftPct = (fill.from / distanceKm) * 100;
                const widthPct = ((fill.to - fill.from) / distanceKm) * 100;
                const parts = fill.content === 'gel' ? partArray(fill, gear) : [];
                const caption =
                  fill.content === 'gel'
                    ? parts.length + '×'
                    : fill.content === 'water'
                      ? strings.water
                      : strings.izo;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelKey(key)}
                    style={{
                      position: 'absolute',
                      left: leftPct + '%',
                      width: widthPct + '%',
                      top: 0,
                      bottom: 0,
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: 2,
                        borderRadius: 5,
                        background: sourceColor(fill.content),
                        opacity: selected ? 1 : 0.82,
                        outline: selected ? '2px solid var(--ink)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          color: 'var(--on-brand)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {caption}
                      </span>
                      {parts.slice(1, -1).map((p, i) => (
                        <span
                          key={i}
                          style={{
                            position: 'absolute',
                            left:
                              ((p - fill.from) / Math.max(0.01, fill.to - fill.from)) * 100 + '%',
                            top: 2,
                            bottom: 2,
                            width: 2,
                            background: 'rgba(255,255,255,0.9)',
                          }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {foods.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP }}>
          <span style={rowLabelStyle}>{strings.foodSection2}</span>
          <div style={trackStyle('var(--surface-warm)')}>
            {foods.map((food) => {
              const key = 'x' + food.id;
              const selected = selKey === key;

              if (food.cont && food.to > food.from) {
                const leftPct = (food.from / distanceKm) * 100;
                const widthPct = ((food.to - food.from) / distanceKm) * 100;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelKey(key)}
                    style={{
                      position: 'absolute',
                      left: leftPct + '%',
                      width: widthPct + '%',
                      top: 0,
                      bottom: 0,
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: 2,
                        borderRadius: 5,
                        background: sourceColor('food'),
                        opacity: selected ? 1 : 0.82,
                        outline: selected ? '2px solid var(--ink)' : 'none',
                      }}
                    />
                  </button>
                );
              }

              const centerPx = kmToPx(food.from);
              const neighborsPx = foods
                .filter((f) => f.id !== food.id)
                .map((f) => Math.abs(kmToPx(f.from) - centerPx))
                .filter((d) => d > 0);
              const { left, width } = foodTouchHitbox(centerPx, neighborsPx);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelKey(key)}
                  style={{
                    position: 'absolute',
                    left,
                    width,
                    top: 0,
                    bottom: 0,
                    border: 'none',
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: sourceColor('food'),
                      opacity: selected ? 1 : 0.82,
                      outline: selected ? '2px solid var(--ink)' : 'none',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
