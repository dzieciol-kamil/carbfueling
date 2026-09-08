import type { CSSProperties } from 'react';
import type { FoodItem, FoodLibEntry } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from '../chart/theme';
import { createFoodDragHandler, stopPointerDown } from './dragHandlers';

function foodName(fd: FoodItem, foodLib: FoodLibEntry[], lang: Lang): string {
  const entry = foodLib.find((x) => x.key === fd.key);
  return (entry && (entry[lang] || entry.en)) || fd.name || '—';
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

interface FoodBarProps {
  food: FoodItem;
  distanceKm: number;
}

export function FoodBar({ food, distanceKm }: FoodBarProps) {
  const lang = useAppStore((s) => s.ui.lang);
  const foodLib = useAppStore((s) => s.foodLib);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeFood = useAppStore((s) => s.removeFood);
  const strings = t(lang);

  const key = 'x' + food.id;
  const on = hoverKey === key;
  const dragging = dragKey === key;
  const point = !food.cont;
  const leftPct = (food.from / distanceKm) * 100;

  const base: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${leftPct}%`,
    background: CHART_COLORS.food,
    pointerEvents: 'auto',
    opacity: dragging ? 1 : 0.9,
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    outline: on ? '2px solid var(--ink)' : 'none',
    outlineOffset: 1,
    boxShadow: dragging ? '0 3px 10px rgba(0,0,0,0.25)' : 'none',
  };
  const barStyle: CSSProperties = point
    ? {
        ...base,
        paddingLeft: 24,
        paddingRight: 6,
        borderRadius: '0 4px 4px 0',
        borderLeft: '3px solid var(--ink)',
      }
    : {
        ...base,
        width: `${Math.max(1.2, ((food.to - food.from) / distanceKm) * 100)}%`,
        paddingLeft: 26,
        paddingRight: 0,
        borderRadius: 4,
      };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div
        onPointerDown={createFoodDragHandler(food.id, 'move')}
        onPointerEnter={() => setHoverKey(key)}
        onPointerLeave={() => setHoverKey(null)}
        style={barStyle}
      >
        <button
          onClick={() => removeFood(food.id)}
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
          {foodName(food, foodLib, lang)}
        </span>
        {!point && (
          <>
            <span
              onPointerDown={createFoodDragHandler(food.id, 'left')}
              style={{
                position: 'absolute',
                left: -6,
                top: -2,
                bottom: -2,
                width: 12,
                cursor: 'ew-resize',
                touchAction: 'none',
                zIndex: 5,
              }}
            />
            <span
              onPointerDown={createFoodDragHandler(food.id, 'resize')}
              style={{
                position: 'absolute',
                right: -6,
                top: -2,
                bottom: -2,
                width: 12,
                cursor: 'ew-resize',
                touchAction: 'none',
                zIndex: 5,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
