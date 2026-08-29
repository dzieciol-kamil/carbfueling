import { useState, type CSSProperties } from 'react';
import { LANGS, t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { LANDING_HREF_FROM_CALCULATOR } from '../urls';

export function Header() {
  const lang = useAppStore((s) => s.ui.lang);
  const setLang = useAppStore((s) => s.setLang);
  const openPanel = useAppStore((s) => s.openPanel);
  const panel = useAppStore((s) => s.ui.panel);
  const [langOpen, setLangOpen] = useState(false);
  const strings = t(lang);

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
    </div>
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
