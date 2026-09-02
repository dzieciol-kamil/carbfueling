import { useState, type CSSProperties } from 'react';
import { absCap } from '../domain/fuel';
import { t } from '../i18n/strings';
import { hasPlanData, useAppStore } from '../store/appStore';
import { TourReplayConfirm } from './tour/TourReplayConfirm';
import { FAQ_HREF_FROM_CALCULATOR } from '../urls';

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function CoffeeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h13v5.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5V8Z" />
      <path d="M17 9.5h1.2a2.3 2.3 0 0 1 0 4.6H17" />
      <path d="M8 3.2c0 .85-.95.95-.95 1.9S8 6.05 8 6.9" />
      <path d="M12 3.2c0 .85-.95.95-.95 1.9S12 6.05 12 6.9" />
    </svg>
  );
}

const replayButtonStyle: CSSProperties = {
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
};

export function Footer() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const intensity = useAppStore((s) => s.route.intensity);
  const startTour = useAppStore((s) => s.startTour);
  const strings = t(lang);
  // No fills in scope here — falls back to absCap's izo-only default rather than a real
  // izo/gel blend, since the footer isn't tied to a specific plan.
  const cap = absCap(mix, 0, 0, intensity);
  const absorptionNote = strings.capNote + cap + ' g/h' + strings.capNote2;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReplay = () => {
    if (hasPlanData(useAppStore.getState())) {
      setConfirmOpen(true);
    } else {
      startTour();
    }
  };

  return (
    <footer
      style={{
        width: '100%',
        maxWidth: 1420,
        boxSizing: 'border-box',
        marginTop: 14,
        borderTop: '1px solid #DFE2DB',
        padding: '22px 18px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <div
        style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 64, alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
              CARB FUELING
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'var(--muted-3)',
              }}
            >
              v{__APP_VERSION__}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--muted-2)' }}>
            {strings.ftAboutBody}
          </p>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: 'var(--muted-3)' }}>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {strings.ftLinks}
          </span>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}
          >
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
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <a
                href="mailto:carbfueling@gmail.com"
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
                    background: '#8b5cf6',
                    flex: '0 0 8px',
                  }}
                />
                <span>{strings.ftContact}</span>
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
                  padding: '9px 16px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--gel)',
                }}
              >
                <CoffeeIcon />
                <span>{strings.ftSupport}</span>
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={FAQ_HREF_FROM_CALCULATOR}
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
              <button onClick={handleReplay} style={replayButtonStyle}>
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
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.ftLegal}
        </span>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.65, color: 'var(--muted)' }}>
          {strings.ftLegalBody}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          borderTop: '1px solid #E6E8E2',
          paddingTop: 14,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.08em',
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
    </footer>
  );
}
