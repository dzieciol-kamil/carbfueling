import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  buildSettingsExport,
  parseSettingsImport,
  serializeSettingsExport,
  settingsExportFileName,
} from '../domain/settingsExport';
import { LANGS, t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { saveTextFile } from '../utils/fileSave';
import { ConfirmDialog } from './ui/ConfirmDialog';

type PlanFeedback = 'import-error' | 'import-success' | 'export-error';

export function Header() {
  const lang = useAppStore((s) => s.ui.lang);
  const setLang = useAppStore((s) => s.setLang);
  const openPanel = useAppStore((s) => s.openPanel);
  const panel = useAppStore((s) => s.ui.panel);
  const getSettingsExportData = useAppStore((s) => s.getSettingsExportData);
  const importSettings = useAppStore((s) => s.importSettings);
  const [langOpen, setLangOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [planFeedback, setPlanFeedback] = useState<PlanFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = t(lang);

  useEffect(() => {
    if (!planFeedback) return;
    const timer = setTimeout(() => setPlanFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [planFeedback]);

  const handleExport = async () => {
    setPlanFeedback(null);
    const file = buildSettingsExport(getSettingsExportData());
    try {
      await saveTextFile(serializeSettingsExport(file), settingsExportFileName());
    } catch {
      setPlanFeedback('export-error');
    }
  };

  const handleImportPick = () => fileInputRef.current?.click();

  // Always confirm before import: it silently overwrites the entire plan —
  // route, gear, mix, fills, foods and shops, not just narrow "settings" —
  // a rare, deliberate action, so there's no real UX cost to asking every
  // time rather than trying to detect "is there anything worth losing".
  const handleFileChosen = (file: File | null) => {
    if (!file) return;
    setPendingImportFile(file);
  };

  const applyImportedFile = async (file: File) => {
    setPlanFeedback(null);
    try {
      const text = await file.text();
      const result = parseSettingsImport(text);
      if (!result.ok) {
        setPlanFeedback('import-error');
        return;
      }
      importSettings(result.data);
      setPlanFeedback('import-success');
    } catch {
      setPlanFeedback('import-error');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          CARB FUELING
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.tagline}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={handleExport} style={planBtnStyle()}>
              <DownloadIcon />
              <span>{strings.exportPlanButton}</span>
            </button>
            <button onClick={handleImportPick} style={planBtnStyle()}>
              <UploadIcon />
              <span>{strings.importPlanButton}</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              handleFileChosen(file);
              e.target.value = '';
            }}
          />
          {planFeedback && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: 220,
                maxWidth: 280,
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '9px 12px',
                boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
                fontSize: 12,
                lineHeight: 1.5,
                color: planFeedback === 'import-success' ? 'var(--muted-2)' : '#B3402A',
                zIndex: 60,
              }}
            >
              {planFeedback === 'import-error'
                ? strings.importPlanError
                : planFeedback === 'import-success'
                  ? strings.importPlanSuccess
                  : strings.exportPlanError}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid ' + (langOpen ? 'var(--ink)' : 'var(--chip-border)'),
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              cursor: 'pointer',
              fontFamily: 'Archivo, sans-serif',
              color: 'var(--ink)',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {strings.langShort}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{strings.langName}</span>
            <span style={{ fontSize: 9, color: 'var(--muted-3)' }}>▾</span>
          </button>
          <div
            style={{
              display: langOpen ? 'flex' : 'none',
              flexDirection: 'column',
              gap: 2,
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 178,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 6,
              boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
              zIndex: 60,
            }}
          >
            {LANGS.map((code) => {
              const label = t(code);
              const on = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    background: on ? '#F2F5EF' : 'transparent',
                    color: 'var(--ink)',
                    fontFamily: 'Archivo, sans-serif',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      width: 22,
                      flex: '0 0 22px',
                    }}
                  >
                    {label.langShort}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{label.langName}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: 'var(--carb)',
                      visibility: on ? 'visible' : 'hidden',
                    }}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => openPanel('settings')} style={panelBtnStyle(panel === 'settings')}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              border: '2px solid var(--carb)',
              display: 'block',
            }}
          />
          <span>{strings.settings}</span>
        </button>
        <button onClick={() => openPanel('mix')} style={panelBtnStyle(panel === 'mix')}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              border: '2px solid var(--gel)',
              display: 'block',
            }}
          />
          <span>{strings.gearMix}</span>
        </button>
      </div>
      {pendingImportFile && (
        <ConfirmDialog
          title={strings.importPlanConfirmTitle}
          body={strings.importPlanConfirmBody}
          cancelLabel={strings.importPlanConfirmCancel}
          confirmLabel={strings.importPlanConfirmConfirm}
          onCancel={() => setPendingImportFile(null)}
          onConfirm={() => {
            const file = pendingImportFile;
            setPendingImportFile(null);
            void applyImportedFile(file);
          }}
        />
      )}
    </div>
  );
}

function planBtnStyle(): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid var(--chip-border)',
    background: '#fff',
    borderRadius: 999,
    padding: '7px 12px',
    fontFamily: 'Archivo, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ink)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function DownloadIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 1.2 V7.6 M3.2 5 L6 7.8 L8.8 5 M1.5 9.8 H10.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 7.6 V1.2 M3.2 3.8 L6 1 L8.8 3.8 M1.5 9.8 H10.5" />
    </svg>
  );
}

function panelBtnStyle(on: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid ' + (on ? 'var(--ink)' : 'var(--chip-border)'),
    background: on ? '#F4F5F2' : '#fff',
    borderRadius: 999,
    padding: '7px 14px',
    fontFamily: 'Archivo, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ink)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
