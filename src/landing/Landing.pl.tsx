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
//
// Sizing works off ONE lever. `.landing-cluster` carries a clamped font-size and every
// dimension inside it is expressed in `em`, so the whole composition is a single
// rigid object: above ~1190px it sits at its design size and stops growing, and below
// that it shrinks as one piece, keeping the question and the screenshot in exactly the
// same relationship to each other. The `min(..., svh)` term applies the same treatment
// to short viewports, which is what keeps a squarish screen from overflowing.
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
  padding: 3em 0; background: var(--bg);
  min-height: calc(100vh - var(--landing-header-h));
  min-height: calc(100svh - var(--landing-header-h));
}

/* Decorative. Anchored dead centre so that narrowing the window trims the photograph
   evenly from both sides instead of sliding its content across the frame. */
.landing-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center center;
  opacity: 0.5; filter: saturate(0.7) contrast(0.98); pointer-events: none;
}
.landing-wash {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 46% 60% at 50% 50%,
    rgba(239, 240, 236, 0.97) 0%, rgba(239, 240, 236, 0.9) 44%,
    rgba(239, 240, 236, 0.5) 72%, rgba(239, 240, 236, 0) 100%);
}

.landing-cluster {
  position: relative; z-index: 2; width: 68.75em; max-width: 100%;
  margin: 0 auto; padding: 0 2em;
  font-size: min(clamp(9px, 1.35vw, 16px), 2.15vh);
  font-size: min(clamp(9px, 1.35vw, 16px), 2.15svh);
}
/* Above the screenshot, so a long question can ride over it rather than slide beneath
   it and become unreadable. */
.landing-q {
  position: relative; z-index: 3; margin: 0; max-width: 56.25em;
  font-weight: 700; letter-spacing: -0.015em;
  font-size: 2.1875em; line-height: 1.26;
}
.landing-shot {
  position: relative; z-index: 2; display: flex; flex-direction: column;
  width: 46.25em; max-width: 100%; margin-top: -4em;
}
.landing-shot img {
  display: block; width: auto; height: auto; max-width: 100%; max-height: 23.5em;
  border-radius: 0.75em; border: 1px solid var(--border); background: #fff;
  box-shadow: 0 1.5em 3.5em rgba(22, 25, 28, 0.16);
}
.landing-cap {
  margin: 0 0 0.83em; max-width: 31.6em;
  font-family: 'JetBrains Mono', monospace; font-size: 0.75em; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-2);
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

@media (max-width: 760px) {
  /* A phone gets its own layout rather than a squeezed desktop one. Cropping a 16:9
     frame to a portrait viewport leaves only its middle, and every subject in these
     photographs stands near an edge — so instead of a full-bleed texture the picture
     becomes a wide, short band across the top of the slide. At that shape it barely
     crops at all, which keeps the rider or runner in frame, and it lets the type sit
     on clean background where it reads best. The wash is unnecessary once nothing
     overlaps the photograph, so the photograph runs at full strength. */
  html { scroll-snap-type: none; }
  /* The header is a fixed 61px bar, so nothing in it may wrap. The tagline is the
     first thing to go — the wordmark alone still says what the site is. */
  .landing-header { padding: 0 1.1em; }
  .landing-header > div > span + span { display: none; }
  .landing-header > div > span { font-size: 17px; }
  .landing-header a {
    padding: 7px 13px !important; font-size: 12px !important; white-space: nowrap;
  }
  .landing-slide {
    display: block; min-height: auto; padding: 0 0 2.8em; scroll-snap-align: none;
  }
  .landing-bg {
    position: static; width: 100%; height: clamp(180px, 32svh, 280px);
    opacity: 1; filter: none; object-position: center center;
  }
  .landing-wash { display: none; }
  .landing-cluster { width: 100%; padding: 1.6em 1.35em 0; font-size: 15px; }
  .landing-q {
    max-width: none; margin: 0 !important; text-align: left !important;
    font-size: clamp(23px, 6.2vw, 30px);
  }
  /* The desktop rag is hand-set; let the text find its own breaks when narrow. */
  .landing-q br { display: none; }
  .landing-shot {
    width: 100%; margin: 1.4em 0 0 !important;
    align-items: flex-start !important; text-align: left !important;
  }
  .landing-shot img { max-height: 46svh; }
  .landing-cap { max-width: none; }
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
              Jeździsz na rowerze, biegasz, czy uprawiasz <br />
              inny sport, w którym musisz <br />
              uzupełniać energię <br />w trakcie wysiłku?
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
              Czujesz, jak żele czy izotoniki <br />
              drenują Twój portfel, a nie <br />
              chcesz z nich <br />
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
              A może złapałeś kiedyś bombę <br />i zastanawiasz się, jak <br />
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
