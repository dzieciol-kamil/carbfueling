import type { CSSProperties } from 'react';
import { partArray, partsOf, volOf } from '../../domain/fuel';
import type { Fill, Vessel } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { createFillDragHandler, createGelPartDragHandler, stopPointerDown } from './dragHandlers';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function delButtonStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    padding: 0,
    border: 'none',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.32)',
    color: 'var(--on-brand)',
    fontSize: 9,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    display: show ? 'flex' : 'none',
  };
}

function popoverChipStyle(active: boolean, color: string): CSSProperties {
  return {
    border: '1px solid ' + (active ? color : 'var(--chip-border)'),
    background: active ? color : 'var(--surface)',
    color: active ? 'var(--on-brand)' : 'var(--ink-soft)',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
  };
}

interface FillBarProps {
  fill: Fill;
  vessel: Vessel;
  distanceKm: number;
}

export function FillBar({ fill, vessel, distanceKm }: FillBarProps) {
  const lang = useAppStore((s) => s.ui.lang);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeFill = useAppStore((s) => s.removeFill);
  const setFillContent = useAppStore((s) => s.setFillContent);
  const gear = useAppStore((s) => s.gear);
  const tourDemoFid = useAppStore((s) => s.ui.tourDemoFid);
  const strings = t(lang);

  const key = 'f' + fill.fid;
  const on = hoverKey === key;
  const dragging = dragKey === key;
  const color = sourceColor(fill.content);
  const n = partsOf(fill, gear);
  const vol = volOf(fill, gear);
  const allowed = vessel.allowed || [];

  const label =
    fill.content === 'gel'
      ? `${strings.gel} · ${vol} ml · ${n}×`
      : `${contentLabel(fill.content, lang)} · ${vol} ml`;

  const leftPct = (fill.from / distanceKm) * 100;
  const widthPct = Math.max(1.2, ((fill.to - fill.from) / distanceKm) * 100);
  const anchorRight = leftPct > 62;

  const parts = n > 1 ? partArray(fill, gear) : [];

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div
        data-tour={fill.fid === tourDemoFid ? 'demo-fill' : undefined}
        onPointerDown={createFillDragHandler(fill.fid, 'move')}
        onPointerEnter={() => setHoverKey(key)}
        onPointerLeave={() => setHoverKey(null)}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          background: color,
          opacity: dragging ? 1 : 0.9,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 26,
          paddingRight: 0,
          boxSizing: 'border-box',
          cursor: 'grab',
          touchAction: 'none',
          pointerEvents: 'auto',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          outline: on ? '2px solid var(--ink)' : 'none',
          outlineOffset: 1,
          boxShadow: dragging ? '0 3px 10px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <button
          onClick={() => removeFill(fill.fid)}
          onPointerDown={stopPointerDown}
          title={strings.removeItem}
          style={delButtonStyle(on)}
        >
          ✕
        </button>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--on-brand)',
            fontFamily: "'JetBrains Mono', monospace",
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
        <span
          onPointerDown={createFillDragHandler(fill.fid, 'left')}
          style={{
            position: 'absolute',
            left: -5,
            top: -2,
            bottom: -2,
            width: 11,
            cursor: 'ew-resize',
            touchAction: 'none',
            zIndex: 5,
          }}
        />
        <span
          onPointerDown={createFillDragHandler(fill.fid, 'resize')}
          style={{
            position: 'absolute',
            right: -5,
            top: -2,
            bottom: -2,
            width: 11,
            cursor: 'ew-resize',
            touchAction: 'none',
            zIndex: 5,
          }}
        />
        {parts.slice(1, -1).map((_, i) => {
          const k = i + 1;
          const rel = ((parts[k] - fill.from) / Math.max(0.1, fill.to - fill.from)) * 100;
          return (
            <span
              key={k}
              onPointerDown={createGelPartDragHandler(fill.fid, k)}
              style={{
                position: 'absolute',
                top: -1,
                bottom: -1,
                left: `calc(${rel}% - 5px)`,
                width: 10,
                cursor: 'ew-resize',
                touchAction: 'none',
                pointerEvents: 'auto',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: on ? 3 : 2,
                  background: on ? '#fff' : 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  pointerEvents: 'none',
                  marginTop: on ? 0 : 3,
                  marginBottom: on ? 0 : 3,
                }}
              />
            </span>
          );
        })}
      </div>

      {allowed.length > 1 && (
        <div
          onPointerEnter={() => setHoverKey(key)}
          onPointerLeave={() => setHoverKey(null)}
          style={{
            position: 'absolute',
            bottom: '100%',
            paddingBottom: 7,
            zIndex: 20,
            gap: 3,
            ...(anchorRight
              ? { right: `${100 - (fill.to / distanceKm) * 100}%` }
              : { left: `${leftPct}%` }),
            pointerEvents: 'auto',
            display: on && allowed.length > 1 ? 'flex' : 'none',
          }}
        >
          {allowed.map((k) => (
            <button
              key={k}
              onClick={() => setFillContent(fill.fid, k)}
              onPointerDown={stopPointerDown}
              style={popoverChipStyle(fill.content === k, sourceColor(k))}
            >
              {contentLabel(k, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
