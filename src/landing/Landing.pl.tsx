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
//
// Each slide runs the question and the screenshot along a diagonal that converges at
// the centre, and the diagonal flips slide to slide. The photographs are composed to
// that flip: the subject always stands on the side the screenshot leaves clear.
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

/* Decorative: the sport photograph reads as texture, not as a picture competing with
   the type. It stays strongest at the left and right edges — the only part of the
   frame the content cluster never covers. */
.landing-bg {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  opacity: 0.5; filter: saturate(0.7) contrast(0.98); pointer-events: none;
}
/* A feathered wash of the page background keeps the centre clean under the type. Kept
   deliberately tight: widen it and the photograph washes out into grey fog. */
.landing-wash {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 46% 60% at 50% 50%,
    rgba(239, 240, 236, 0.97) 0%, rgba(239, 240, 236, 0.9) 44%,
    rgba(239, 240, 236, 0.5) 72%, rgba(239, 240, 236, 0) 100%);
}

.landing-cluster {
  position: relative; z-index: 2; width: min(1100px, 100%);
  margin: 0 auto; padding: 0 32px;
}
/* The line breaks are hand-set in the markup so each line is shorter than the last.
   max-width is only a backstop against a line outgrowing the cluster. */
.landing-q {
  margin: 0; max-width: 900px; font-weight: 700; letter-spacing: -0.015em;
  font-size: clamp(24px, 2.6vw, 35px); line-height: 1.26;
}
/* The negative margin is the whole point: the screenshot rides up over the tail of
   the question — the shortest line — instead of sitting apart from it. */
.landing-shot {
  position: relative; z-index: 3; display: flex; flex-direction: column;
  width: min(740px, 100%); margin-top: -64px;
}

/* The arrangement mirrors slide to slide, and each photograph was shot to match:
   its subject always stands on the side the screenshot leaves clear. */
.landing-slide[data-shot='right'] .landing-q { margin-right: auto; }
.landing-slide[data-shot='right'] .landing-shot {
  margin-left: auto; align-items: flex-end; text-align: right;
}
.landing-slide[data-shot='left'] .landing-q { margin-left: auto; text-align: right; }
.landing-slide[data-shot='left'] .landing-shot {
  margin-right: auto; align-items: flex-start; text-align: left;
}
.landing-shot img {
  display: block; width: auto; height: auto; max-width: 100%; max-height: 48svh;
  border-radius: 12px; border: 1px solid var(--border); background: #fff;
  box-shadow: 0 24px 56px rgba(22, 25, 28, 0.16);
}
/* Capped and right-aligned so it can never reach back into the question's lines. */
.landing-cap {
  margin: 0 0 10px; max-width: 380px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-2);
}

@media (max-width: 760px) {
  /* Slides stop being full-height here, so a tall slide degrades to ordinary
     scrolling instead of trapping its own content inside a mandatory snap point. */
  html { scroll-snap-type: y proximity; }
  .landing-slide { min-height: auto; padding: 40px 0; }
  .landing-cluster { padding: 0 22px; }
  .landing-q { max-width: none; font-size: clamp(23px, 6.4vw, 30px); }
  /* The desktop rag is hand-set; let the text find its own breaks when narrow. */
  .landing-q br { display: none; }
  .landing-shot {
    width: 100%; margin: 22px 0 0 !important;
    align-items: flex-start !important; text-align: left !important;
  }
  .landing-q { margin: 0 !important; text-align: left !important; }
  .landing-shot img { max-height: 52svh; }
  .landing-cap { max-width: none; }
  /* A 16:9 photo cropped to a portrait viewport loses its outer thirds, so bias the
     crop toward whichever edge this slide's subject stands on. */
  .landing-slide[data-shot='right'] .landing-bg { object-position: 22% center; }
  .landing-slide[data-shot='left'] .landing-bg { object-position: 78% center; }
  .landing-wash {
    background: radial-gradient(ellipse 120% 70% at 50% 50%,
      rgba(239, 240, 236, 0.98) 0%, rgba(239, 240, 236, 0.92) 46%,
      rgba(239, 240, 236, 0.5) 74%, rgba(239, 240, 236, 0) 100%);
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
              Jeździsz na rowerze, biegasz, czy uprawiasz
              <br />
              inny sport, w którym musisz
              <br />
              uzupełniać energię
              <br />w trakcie wysiłku?
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
              Czujesz, jak żele czy izotoniki
              <br />
              drenują Twój portfel, a nie
              <br />
              chcesz z nich
              <br />
              rezygnować?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                To, czego potrzebujesz, masz już w kuchni
              </figcaption>
              <img
                src={assetHref('/landing/mix.jpg')}
                alt="Panel mieszanki: przepis na izotonik i żel odmierzony cukrem, solą i cytryną"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide" data-shot="right">
          <img className="landing-bg" src={assetHref('/landing/gravel.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              A może złapałeś kiedyś bombę
              <br />i zastanawiasz się, jak
              <br />
              temu przeciwdziałać?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                Widzisz lukę, zanim zrobi się krytyczna
              </figcaption>
              <img
                src={assetHref('/landing/chart.jpg')}
                alt="Wykres planu pokazujący lukę między wchłoniętymi a spalonymi węglowodanami"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide" style={{ textAlign: 'center' }}>
          <img className="landing-bg" src={assetHref('/landing/finish.jpg')} alt="" />
          <div className="landing-wash" />
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
              style={{ margin: 0, maxWidth: 'none', color: 'var(--muted-3)' }}
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
