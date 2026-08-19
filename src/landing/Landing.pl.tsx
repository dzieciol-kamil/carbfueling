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

// The page is one scroll container: the document itself. An inner scroller sitting
// below a sticky header gave the page two scrollbars, pushed every slide's bottom
// below the fold, and stopped scroll-snap from holding — so the header is fixed and
// the snapping happens on <html>.
const landingCss = `
:root { --landing-header-h: 61px; }
html { scroll-snap-type: y mandatory; scroll-padding-top: var(--landing-header-h); }
body { padding-top: var(--landing-header-h); }

.landing-header {
  position: fixed; inset: 0 0 auto 0; z-index: 30; height: var(--landing-header-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; background: var(--bg); border-bottom: 1px solid var(--border);
}

.landing-slide {
  position: relative; overflow: hidden; scroll-snap-align: start;
  display: flex; align-items: center; justify-content: center;
  padding: 48px 0; background: var(--bg);
  min-height: calc(100vh - var(--landing-header-h));
  min-height: calc(100svh - var(--landing-header-h));
}

/* Decorative: the sport photograph reads as texture, not as a picture competing
   with the type. It stays strongest at the left and right edges, which is the only
   part of the frame the content cluster never covers. */
.landing-bg {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  opacity: 0.34; filter: saturate(0.62) contrast(0.96); pointer-events: none;
}
/* Feathered wash of the page background, so the centre stays clean under the text
   while the edges keep the photo at full strength. */
.landing-wash {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 58% 74% at 50% 50%,
    rgba(239, 240, 236, 1) 0%, rgba(239, 240, 236, 0.97) 38%,
    rgba(239, 240, 236, 0.6) 66%, rgba(239, 240, 236, 0) 100%);
}

.landing-cluster {
  position: relative; z-index: 2; width: min(960px, 100%);
  margin: 0 auto; padding: 0 32px;
}
.landing-q {
  margin: 0; max-width: 620px; font-weight: 700; letter-spacing: -0.015em;
  font-size: clamp(25px, 3vw, 39px); line-height: 1.24;
}
/* The negative margin is the whole point: the screenshot rides up over the tail of
   the question instead of sitting apart from it. */
.landing-shot {
  position: relative; z-index: 3; display: flex; flex-direction: column;
  width: min(660px, 100%); margin: -60px 0 0;
}
.landing-shot img {
  display: block; width: auto; height: auto; max-width: 100%; max-height: 46svh;
  border-radius: 12px; border: 1px solid var(--border); background: #fff;
  box-shadow: 0 24px 56px rgba(22, 25, 28, 0.16);
}
.landing-cap {
  margin: 0 0 10px; font-family: 'JetBrains Mono', monospace; font-size: 12px;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--muted-2);
}

/* Sides alternate slide to slide. The photo's subject always stands opposite the
   screenshot, in the band the cluster leaves clear. */
.landing-slide[data-shot='right'] .landing-q { margin-right: auto; }
.landing-slide[data-shot='right'] .landing-shot {
  margin-left: auto; align-items: flex-end; text-align: right;
}
.landing-slide[data-shot='left'] .landing-q { margin-left: auto; text-align: right; }
.landing-slide[data-shot='left'] .landing-shot { margin-right: auto; align-items: flex-start; }

@media (max-width: 760px) {
  /* Slides stop being full-height here, so a tall slide degrades to ordinary
     scrolling instead of trapping its own content inside a mandatory snap point. */
  html { scroll-snap-type: y proximity; }
  .landing-slide { min-height: auto; padding: 40px 0; }
  .landing-cluster { padding: 0 22px; }
  .landing-q {
    max-width: none; margin: 0 !important; text-align: left !important;
    font-size: clamp(23px, 6.4vw, 30px);
  }
  .landing-shot {
    width: 100%; margin: 22px 0 0 !important;
    align-items: flex-start !important; text-align: left !important;
  }
  .landing-shot img { max-height: 52svh; }
  /* A 16:9 photo cropped to a portrait viewport loses its outer thirds, so bias the
     crop toward whichever edge the subject stands on. */
  .landing-slide[data-shot='right'] .landing-bg { object-position: 22% center; }
  .landing-slide[data-shot='left'] .landing-bg { object-position: 78% center; }
  .landing-wash {
    background: radial-gradient(ellipse 120% 70% at 50% 50%,
      rgba(239, 240, 236, 1) 0%, rgba(239, 240, 236, 0.95) 46%,
      rgba(239, 240, 236, 0.55) 74%, rgba(239, 240, 236, 0) 100%);
  }
}
`;

export default function LandingPl() {
  return (
    <div>
      <style>{landingCss}</style>
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={headerWordmark}>CARB FUELING</span>
          <span style={headerTagline}>planer węglowodanów i nawodnienia</span>
        </div>
        <a href={calculatorHref('pl')} style={ctaButton}>
          Otwórz kalkulator →
        </a>
      </header>

      <main>
        <section className="landing-slide" data-shot="right">
          <img className="landing-bg" src={assetHref('/landing/road.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h1 className="landing-q">
              Jeździsz na rowerze, biegasz, czy uprawiasz inny sport, w którym musisz uzupełniać
              energię w trakcie wysiłku?
            </h1>
            <figure className="landing-shot">
              <figcaption className="landing-cap">Tak wygląda plan na Twoją trasę</figcaption>
              <img
                src={assetHref('/landing/hero.jpg')}
                alt="Aplikacja Carb Fueling: trasa, karty pokrycia i wykres planu"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide" data-shot="left">
          <img className="landing-bg" src={assetHref('/landing/run.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              Czujesz, jak żele czy izotoniki drenują Twój portfel, a nie chcesz z nich rezygnować?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                To, czego potrzebujesz, masz już w kuchni
              </figcaption>
              <img
                src={assetHref('/landing/mix.jpg')}
                alt="Panel mieszanki izotonika i żelu z proporcjami"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide" data-shot="right">
          <img className="landing-bg" src={assetHref('/landing/gravel.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              A może złapałeś kiedyś bombę i zastanawiasz się, jak temu przeciwdziałać?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                Widzisz lukę, zanim zrobi się krytyczna
              </figcaption>
              <img
                src={assetHref('/faq/bonk-crisis/supply-demand-gap.png')}
                alt="Wykres pokazujący lukę między dostarczanymi a spalanymi węglowodanami"
              />
            </figure>
          </div>
        </section>

        <section
          className="landing-slide"
          style={{ background: 'var(--surface)', textAlign: 'center' }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 22,
              maxWidth: 560,
              padding: 24,
            }}
          >
            <p
              className="landing-cap"
              style={{ margin: 0, color: 'var(--muted-3)', letterSpacing: '0.1em' }}
            >
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
      </main>
    </div>
  );
}
