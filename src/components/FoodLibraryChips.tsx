import type { CSSProperties } from 'react';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { CHART_COLORS } from './chart/theme';

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--chip-border)',
  background: 'var(--surface)',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'Archivo, sans-serif',
  fontWeight: 600,
  color: 'var(--ink)',
  padding: '8px 13px',
  fontSize: 12.5,
};

export function FoodLibraryChips() {
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const addFoodFromLibrary = useAppStore((s) => s.addFoodFromLibrary);
  const strings = t(lang);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        marginTop: 14,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted-2)', marginRight: 2 }}>
          {strings.addFuel}
        </span>
        {foodLib.map((entry) => (
          <button key={entry.key} onClick={() => addFoodFromLibrary(entry.key)} style={chipStyle}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                background: CHART_COLORS.food,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span>{entry[lang] || entry.en}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              {entry.carbs} g
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
