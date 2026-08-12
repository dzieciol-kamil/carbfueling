import type { CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { NumberInput } from '../ui/NumberInput';

const fieldWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 1 auto',
};
const fieldLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--muted-3)',
  letterSpacing: '0.04em',
};
const fieldBoxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '0 10px',
  background: '#fff',
  height: 44,
};
// The two per-product switches sit on their own row: at phone width there is no room for them
// beside the number fields without squeezing those down to a couple of digits.
function toggleStyle(active: boolean): CSSProperties {
  return {
    flex: '1 1 0',
    height: 40,
    padding: '0 8px',
    borderRadius: 10,
    border: '1px solid ' + (active ? 'var(--ink)' : 'var(--chip-border)'),
    background: active ? 'var(--ink)' : '#fff',
    color: active ? '#fff' : 'var(--muted-2)',
    fontFamily: 'Archivo, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
  };
}
const numberInputStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 600,
};

export function MobileFoodLibrary() {
  const lang = useAppStore((s) => s.ui.lang);
  const foodLib = useAppStore((s) => s.foodLib);
  const foods = useAppStore((s) => s.foods);
  const updateFoodLibEntry = useAppStore((s) => s.updateFoodLibEntry);
  const removeFoodLibEntry = useAppStore((s) => s.removeFoodLibEntry);
  const addFoodLibEntry = useAppStore((s) => s.addFoodLibEntry);
  const strings = t(lang);

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {strings.foodSection}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
        {strings.foodSectionHint}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {foodLib.map((entry) => {
          const count = foods.filter((f) => f.key === entry.key).length;
          return (
            <div
              key={entry.key}
              style={{
                border: '1px solid var(--chip-border)',
                borderRadius: 13,
                background: '#F9FAF7',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={entry[lang] || entry.en}
                  onChange={(e) =>
                    updateFoodLibEntry(entry.key, { pl: e.target.value, en: e.target.value })
                  }
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    borderRadius: 10,
                    padding: 12,
                    fontFamily: 'Archivo, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--muted)',
                    flex: '0 0 auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {count}
                  {strings.inPlanSuffix}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <label style={fieldWrapStyle}>
                  <span style={fieldLabelStyle}>{strings.fCarbs}</span>
                  <span style={fieldBoxStyle}>
                    <NumberInput
                      min={0}
                      step={1}
                      value={entry.carbs}
                      onChange={(carbs) =>
                        updateFoodLibEntry(entry.key, { carbs: Math.max(0, carbs) })
                      }
                      style={numberInputStyle}
                    />
                    <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>g</span>
                  </span>
                </label>
                <label style={fieldWrapStyle}>
                  <span style={fieldLabelStyle}>{strings.fMl}</span>
                  <span style={fieldBoxStyle}>
                    <NumberInput
                      min={0}
                      step={10}
                      value={entry.ml || 0}
                      onChange={(ml) => updateFoodLibEntry(entry.key, { ml: Math.max(0, ml) })}
                      style={numberInputStyle}
                    />
                    <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>ml</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => removeFoodLibEntry(entry.key)}
                  style={{
                    flex: '0 0 34px',
                    height: 44,
                    border: 'none',
                    background: 'transparent',
                    color: '#B0B5B0',
                    cursor: 'pointer',
                    fontSize: 14,
                    marginLeft: 'auto',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() =>
                    updateFoodLibEntry(entry.key, { cont: !entry.cont, span: entry.span || 18 })
                  }
                  style={toggleStyle(!!entry.cont)}
                >
                  {strings.foodStepwise}
                </button>
                <button
                  type="button"
                  onClick={() => updateFoodLibEntry(entry.key, { needsStop: !entry.needsStop })}
                  style={toggleStyle(!!entry.needsStop)}
                >
                  {strings.foodNeedsStop}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addFoodLibEntry}
        style={{
          border: '1px dashed #C9CEC7',
          borderRadius: 11,
          padding: 12,
          background: '#F7F8F5',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
        }}
      >
        {strings.foodAddProduct}
      </button>
    </div>
  );
}
