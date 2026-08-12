import { useState, type CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { shouldConfirmViewModeChange, useAppStore, type ViewMode } from '../../store/appStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NumberInput } from '../ui/NumberInput';
import { PanelShell } from './PanelShell';

const VIEW_MODES: ViewMode[] = ['auto', 'desktop', 'mobile'];

function contStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid ' + (active ? 'var(--ink)' : 'var(--chip-border)'),
    background: active ? 'var(--ink)' : '#fff',
    color: active ? '#fff' : 'var(--muted-2)',
    borderRadius: 8,
    padding: '6px 4px',
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    width: '100%',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 12,
};
const textInputStyle: CSSProperties = {
  minWidth: 0,
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '9px 11px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
};
const numberFieldStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '0 8px',
  minWidth: 0,
  background: '#fff',
};

export function SettingsPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const weight = useAppStore((s) => s.route.weight);
  const foodLib = useAppStore((s) => s.foodLib);
  const setWeight = useAppStore((s) => s.setWeight);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const closePanel = useAppStore((s) => s.closePanel);
  const updateFoodLibEntry = useAppStore((s) => s.updateFoodLibEntry);
  const removeFoodLibEntry = useAppStore((s) => s.removeFoodLibEntry);
  const addFoodLibEntry = useAppStore((s) => s.addFoodLibEntry);
  const strings = t(lang);
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);

  const handleViewModePick = (v: ViewMode) => {
    if (shouldConfirmViewModeChange(v, viewMode)) setPendingViewMode(v);
    else setViewMode(v);
  };

  return (
    <>
      <PanelShell title={strings.settings} onClose={closePanel}>
        <div style={sectionTitleStyle}>{strings.profile}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.viewLabel}</span>
            <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 160 }}>
              {VIEW_MODES.map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewModePick(v)}
                  style={{ ...contStyle(viewMode === v), width: 'auto', flex: 1 }}
                >
                  {v === 'auto'
                    ? strings.viewAuto
                    : v === 'desktop'
                      ? strings.desktop
                      : strings.mobile}
                </button>
              ))}
            </div>
          </div>
          {viewMode === 'auto' && (
            <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
              {strings.autoDetected}
              {autoView === 'desktop' ? strings.desktop : strings.mobile}
            </span>
          )}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
          <span
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--muted-2)',
            }}
          >
            <span>{strings.weight}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--ink)',
                fontWeight: 700,
              }}
            >
              {weight} kg
            </span>
          </span>
          <input
            type="range"
            min={45}
            max={120}
            step={1}
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 6,
          }}
        >
          {strings.foodSection}
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
          {strings.foodSectionHint}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.3fr) 74px 82px 76px 76px 22px',
            alignItems: 'end',
            gap: 7,
            padding: '0 13px 6px',
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-3)',
          }}
        >
          <span>{strings.fName}</span>
          <span style={{ textAlign: 'center' }}>{strings.fCarbs}</span>
          <span style={{ textAlign: 'center' }}>{strings.fMl}</span>
          <span />
          <span />
          <span />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {foodLib.map((entry) => (
            <div
              key={entry.key}
              style={{
                border: '1px solid #E9EBE5',
                borderRadius: 12,
                padding: '10px 12px',
                background: '#FBFCFA',
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1.3fr) 74px 82px 76px 76px 22px',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <input
                type="text"
                value={entry[lang] || entry.en}
                onChange={(e) =>
                  updateFoodLibEntry(entry.key, { pl: e.target.value, en: e.target.value })
                }
                style={textInputStyle}
              />
              <span style={numberFieldStyle}>
                <NumberInput
                  min={0}
                  step={1}
                  value={entry.carbs}
                  onChange={(carbs) => updateFoodLibEntry(entry.key, { carbs: Math.max(0, carbs) })}
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '9px 0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>g</span>
              </span>
              <span style={numberFieldStyle}>
                <NumberInput
                  min={0}
                  step={10}
                  value={entry.ml || 0}
                  onChange={(ml) => updateFoodLibEntry(entry.key, { ml: Math.max(0, ml) })}
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '9px 0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>ml</span>
              </span>
              <button
                onClick={() =>
                  updateFoodLibEntry(entry.key, { cont: !entry.cont, span: entry.span || 18 })
                }
                style={contStyle(!!entry.cont)}
              >
                {strings.fCont}
              </button>
              <button
                onClick={() => updateFoodLibEntry(entry.key, { needsStop: !entry.needsStop })}
                style={contStyle(!!entry.needsStop)}
              >
                {strings.fNeedsStop}
              </button>
              <button
                onClick={() => removeFoodLibEntry(entry.key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#B0B5B0',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 4,
                  justifySelf: 'end',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addFoodLibEntry}
          style={{
            marginTop: 12,
            border: '1px dashed #C9CEC7',
            background: '#F7F8F5',
            borderRadius: 10,
            padding: '11px 16px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + {strings.addFoodItem}
        </button>
      </PanelShell>
      {pendingViewMode && (
        <ConfirmDialog
          title={strings.viewModeConfirmTitle}
          body={strings.viewModeConfirmBody}
          cancelLabel={strings.viewModeConfirmCancel}
          confirmLabel={strings.viewModeConfirmConfirm}
          onCancel={() => setPendingViewMode(null)}
          onConfirm={() => {
            setViewMode(pendingViewMode);
            setPendingViewMode(null);
          }}
        />
      )}
    </>
  );
}
