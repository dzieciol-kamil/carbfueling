// src/landing/Landing.pl.tsx
import type { CSSProperties } from 'react';
import { calculatorHref, faqHref, assetHref } from '../urls';

const headerWordmark: CSSProperties = { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' };
const headerTagline: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};
const ctaButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--chip-border)',
  background: '#fff',
  borderRadius: 999,
  padding: '9px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink)',
};
const question: CSSProperties = {
  fontSize: 34,
  lineHeight: 1.28,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: 0,
  maxWidth: 480,
};
const caption: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--muted-2)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 12px',
};
const shot: CSSProperties = {
  display: 'block',
  borderRadius: 12,
  border: '1px solid var(--border)',
  boxShadow: '0 20px 48px rgba(22, 25, 28, 0.14)',
  width: 'min(60vw, 800px)',
};

const landingCss = `
.landing-scroller { height: 100vh; overflow-y: auto; scroll-snap-type: y mandatory; }
.landing-slide { min-height: 100vh; scroll-snap-align: start; scroll-snap-stop: always; position: relative; display: flex; }
.landing-corner { position: absolute; display: flex; flex-direction: column; }
.landing-corner--tl { top: 96px; left: 64px; }
.landing-corner--tr { top: 96px; right: 64px; text-align: right; align-items: flex-end; }
.landing-corner--bl { bottom: 72px; left: 64px; }
.landing-corner--br { bottom: 72px; right: 64px; text-align: right; align-items: flex-end; }
@media (max-width: 760px) {
  .landing-slide { flex-direction: column; justify-content: center; align-items: center; padding: 96px 24px 56px; gap: 28px; text-align: center; }
  .landing-corner { position: static; max-width: 100%; align-items: center !important; text-align: center !important; }
  .landing-corner img { width: min(84vw, 420px) !important; }
}
`;

export default function LandingPl() {
  return (
    <div>
      <style>{landingCss}</style>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={headerWordmark}>CARB FUELING</span>
          <span style={headerTagline}>planer węglowodanów i nawodnienia</span>
        </div>
        <a href={calculatorHref('pl')} style={ctaButton}>
          Otwórz kalkulator →
        </a>
      </header>

      <div className="landing-scroller">
        <section className="landing-slide" style={{ background: 'var(--bg)' }}>
          <div className="landing-corner landing-corner--tl">
            <h1 style={question}>
              Jeździsz na rowerze, biegasz, czy uprawiasz inny sport, w którym musisz uzupełniać
              energię w trakcie wysiłku?
            </h1>
          </div>
          <div className="landing-corner landing-corner--br">
            <p style={caption}>Tak wygląda plan na Twoją trasę</p>
            <img
              style={shot}
              src={assetHref('/landing/hero.jpg')}
              alt="Aplikacja Carb Fueling: trasa, karty pokrycia i wykres planu"
            />
          </div>
        </section>

        <section className="landing-slide" style={{ background: 'var(--surface)' }}>
          <div className="landing-corner landing-corner--tl">
            <p style={caption}>To, czego potrzebujesz, masz już w kuchni</p>
            <img
              style={{
                ...shot,
                width: 'auto',
                height: 'min(62vh, 600px)',
                maxWidth: 'min(60vw, 560px)',
              }}
              src={assetHref('/landing/mix.jpg')}
              alt="Panel mieszanki izotonika i żelu z proporcjami"
            />
          </div>
          <div className="landing-corner landing-corner--br">
            <h1 style={question}>
              Czujesz, jak żele czy izotoniki drenują Twój portfel, a nie chcesz z nich rezygnować?
            </h1>
          </div>
        </section>

        <section className="landing-slide" style={{ background: 'var(--bg)' }}>
          <div className="landing-corner landing-corner--tr">
            <h1 style={question}>
              A może złapałeś kiedyś bombę i zastanawiasz się, jak temu przeciwdziałać?
            </h1>
          </div>
          <div className="landing-corner landing-corner--bl">
            <p style={caption}>Widzisz lukę, zanim zrobi się krytyczna</p>
            <img
              style={shot}
              src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
              alt="Wykres pokazujący lukę między dostarczanymi a spalanymi węglowodanami"
            />
          </div>
        </section>

        <section
          className="landing-slide"
          style={{ background: 'var(--surface)', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 22,
              textAlign: 'center',
              maxWidth: 560,
              padding: 24,
            }}
          >
            <p style={{ ...caption, color: 'var(--muted-3)' }}>
              Za darmo · bez konta · działa w przeglądarce
            </p>
            <h2 style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 700, margin: 0 }}>
              Zaplanuj, ile węglowodanów i płynów zabrać na trasę — i jak rozłożyć je w czasie.
            </h2>
            <a
              href={calculatorHref('pl')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--ink)',
                color: '#fff',
                borderRadius: 999,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 700,
                marginTop: 8,
              }}
            >
              Otwórz kalkulator →
            </a>
            <a
              href={faqHref('pl')}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-2)', marginTop: 4 }}
            >
              Ciekawi Cię, dlaczego to działa? Przeczytaj FAQ →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
