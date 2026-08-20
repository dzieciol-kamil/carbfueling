import { useState, type CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { shouldConfirmViewModeChange, useAppStore, type ViewMode } from '../../store/appStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
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

export function SettingsPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const weight = useAppStore((s) => s.route.weight);
  const setWeight = useAppStore((s) => s.setWeight);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const closePanel = useAppStore((s) => s.closePanel);
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
