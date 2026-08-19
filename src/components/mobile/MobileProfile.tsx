import { useRef, useState } from 'react';
import { absCap } from '../../domain/fuel';
import {
  buildSettingsExport,
  parseSettingsImport,
  serializeSettingsExport,
  settingsExportFileName,
  type PlanFeedback,
} from '../../domain/settingsExport';
import { LANGS, t } from '../../i18n/strings';
import {
  hasPlanData,
  shouldConfirmViewModeChange,
  useAppStore,
  type ViewMode,
} from '../../store/appStore';
import { saveTextFile } from '../../utils/fileSave';
import { CoffeeIcon, GitHubIcon } from '../Footer';
import { TourReplayConfirm } from '../tour/TourReplayConfirm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MobileStepper } from './MobileStepper';

export function MobileProfile() {
  const lang = useAppStore((s) => s.ui.lang);
  const weight = useAppStore((s) => s.route.weight);
  const setWeight = useAppStore((s) => s.setWeight);
  const setLang = useAppStore((s) => s.setLang);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const mix = useAppStore((s) => s.mix);
  const startTour = useAppStore((s) => s.startTour);
  const getSettingsExportData = useAppStore((s) => s.getSettingsExportData);
  const importSettings = useAppStore((s) => s.importSettings);
  const strings = t(lang);
  // No fills in scope here — falls back to absCap's izo-only default rather than a real
  // izo/gel blend, since the "Me" tab isn't tied to a specific plan.
  const cap = absCap(mix);
  const absorptionNote = strings.capNote + cap + ' g/h' + strings.capNote2;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [planFeedback, setPlanFeedback] = useState<PlanFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplay = () => {
    if (hasPlanData(useAppStore.getState())) {
      setConfirmOpen(true);
    } else {
      startTour();
    }
  };

  const handleViewModePick = (v: ViewMode) => {
    if (shouldConfirmViewModeChange(v, viewMode)) setPendingViewMode(v);
    else setViewMode(v);
  };

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
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.profile}
        </div>
        <MobileStepper
          label={strings.meWeight + ' (kg)'}
          value={weight}
          min={40}
          max={130}
          smallStep={1}
          bigStep={5}
          onChange={setWeight}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.meApp}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.meLanguage}</span>
          {LANGS.length >= 6 ? (
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])}
              style={{
                height: 44,
                borderRadius: 10,
                border: '1px solid var(--chip-border)',
                padding: '0 10px',
              }}
            >
              {LANGS.map((code) => (
                <option key={code} value={code}>
                  {t(code).langName}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  style={{
                    flex: 1,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 9,
                    border: '1px solid ' + (lang === code ? 'var(--ink)' : 'var(--chip-border)'),
                    background: lang === code ? 'var(--ink)' : '#fff',
                    color: lang === code ? '#fff' : 'var(--muted-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t(code).langShort}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.meView}</span>
            <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 160 }}>
              {(['auto', 'desktop', 'mobile'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleViewModePick(v)}
                  style={{
                    flex: 1,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 9,
                    border: '1px solid ' + (viewMode === v ? 'var(--ink)' : 'var(--chip-border)'),
                    background: viewMode === v ? 'var(--ink)' : '#fff',
                    color: viewMode === v ? '#fff' : 'var(--muted-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
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
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingTop: 16,
          borderTop: '1px solid var(--chip-border)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.planDataSection}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
          {strings.planDataHint}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleExport}
            style={{
              flex: 1,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--ink)',
              borderRadius: 10,
              padding: '11px 12px',
              fontFamily: 'Archivo, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {strings.exportPlanButton}
          </button>
          <button
            type="button"
            onClick={handleImportPick}
            style={{
              flex: 1,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--ink)',
              borderRadius: 10,
              padding: '11px 12px',
              fontFamily: 'Archivo, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {strings.importPlanButton}
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
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: planFeedback === 'import-success' ? 'var(--muted-2)' : '#B3402A',
            }}
          >
            {planFeedback === 'import-error'
              ? strings.importPlanError
              : planFeedback === 'import-success'
                ? strings.importPlanSuccess
                : strings.exportPlanError}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid var(--chip-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
            CARB FUELING
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--muted-3)',
            }}
          >
            v{__APP_VERSION__}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: 'var(--muted-2)' }}>
          {strings.ftAboutBody}
        </p>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: 'var(--muted-3)' }}>
          {absorptionNote} {strings.ftSources2}
        </p>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'var(--muted-3)',
          }}
        >
          {strings.ftPrivacy}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="https://github.com/dzieciol-kamil/carbfueling/issues/new"
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--carb)',
                flex: '0 0 8px',
              }}
            />
            <span>{strings.ftIssues}</span>
          </a>
          <a
            href="https://github.com/dzieciol-kamil/carbfueling"
            target="_blank"
            rel="noopener"
            title={strings.ftRepo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              boxSizing: 'border-box',
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 999,
              color: 'var(--ink-soft)',
            }}
          >
            <GitHubIcon />
          </a>
          <a
            href="https://suppi.pl/kamild"
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--gel)',
            }}
          >
            <CoffeeIcon />
            <span>{strings.ftSupport}</span>
          </a>
          <a
            href={lang === 'pl' ? '/pl/faq/' : '/faq/'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--food)',
                flex: '0 0 8px',
              }}
            />
            <span>{strings.ftFaq}</span>
          </a>
          <button
            type="button"
            onClick={handleReplay}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'Archivo, sans-serif',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--water)',
                flex: '0 0 8px',
              }}
            />
            <span>{strings.tourReplayButton}</span>
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.55, color: 'var(--muted)' }}>
          {strings.ftLegalBody}
        </p>

        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--muted-3)',
          }}
        >
          {strings.ftCopyright}
        </span>
      </div>

      {confirmOpen && (
        <TourReplayConfirm
          strings={strings}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            startTour();
          }}
        />
      )}

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
