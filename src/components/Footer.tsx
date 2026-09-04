import { useState, type CSSProperties } from 'react';
import { absCap } from '../domain/fuel';
import { t } from '../i18n/strings';
import { hasPlanData, useAppStore } from '../store/appStore';
import { TourReplayConfirm } from './tour/TourReplayConfirm';
import { FAQ_HREF_FROM_CALCULATOR } from '../urls';
import { CoffeeIcon, GitHubIcon } from './ui/BrandIcons';

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
