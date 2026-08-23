import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  buildSettingsExport,
  parseSettingsImport,
  serializeSettingsExport,
  settingsExportFileName,
  type PlanFeedback,
} from '../domain/settingsExport';
import { LANGS, t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { AutoplanFlow } from './autoplan/AutoplanFlow';
import { LANDING_HREF_FROM_CALCULATOR } from '../urls';
import { saveTextFile } from '../utils/fileSave';
import { ConfirmDialog } from './ui/ConfirmDialog';

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
  // route, gear, mix, fills, foods and stops, not just narrow "settings" —
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
      <a
        href={LANDING_HREF_FROM_CALCULATOR}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          color: 'var(--ink)',
          textDecoration: 'none',
        }}
      >
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
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AutoplanFlow variant="desktop" />

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

        <button onClick={() => openPanel('gear')} style={panelBtnStyle(panel === 'gear')}>
          <GearIcon />
          <span>{strings.tabGear}</span>
        </button>
        <button onClick={() => openPanel('mix')} style={panelBtnStyle(panel === 'mix')}>
          <MixIcon />
          <span>{strings.tabMix}</span>
        </button>
        <button onClick={() => openPanel('food')} style={panelBtnStyle(panel === 'food')}>
          <FoodIcon />
          <span>{strings.tabFood}</span>
        </button>
        <button onClick={() => openPanel('settings')} style={panelBtnStyle(panel === 'settings')}>
          <SettingsIcon />
          <span>{strings.settings}</span>
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

function GearIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7.5 h8 v10.5 a2 2 0 0 1 -2 2 h-4 a2 2 0 0 1 -2 -2 z M9.5 7.5 v-3 h3 v3 M7 12 h8" />
    </svg>
  );
}

function MixIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 5 h9 l-1.1 12.2 a2 2 0 0 1 -2 1.8 h-2.8 a2 2 0 0 1 -2 -1.8 z M7.2 11.5 h7.6" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.4 6.2 C3.9 14.2 9.6 19.3 18 18.2 C18.9 18.1 19.2 17.1 18.4 16.6 C12.3 14.5 7.6 11.6 7.2 6.4 C7.1 5.6 4.5 5.4 4.4 6.2 Z M5.6 5.9 L5.1 3.6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 19.5 q0 -5.5 6.5 -5.5 t6.5 5.5" />
      <circle cx={11} cy={7} r={3.4} fill="currentColor" stroke="none" />
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
