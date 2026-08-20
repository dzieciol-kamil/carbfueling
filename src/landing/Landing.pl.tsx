// src/landing/Landing.pl.tsx
import type { CSSProperties } from 'react';
import { calculatorHref, faqHref, assetHref, landingHref } from '../urls';
import SiteFooter from './SiteFooter';

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
  /* Always the height of four lines. The cluster is centred vertically, so a shorter
     question made a shorter cluster and started lower down the slide — the block
     appeared to sink whenever the copy lost a line. Reserving the tallest case keeps
     every slide's question and screenshot at the same height. */
  min-height: 5.04em;
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
.landing-cap br { display: none; }
/* Each phrase is atomic, so this line can only break at its separators, never
   mid-phrase. */
.landing-cap span { white-space: nowrap; }
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

/* Language on the landing is two links, not a menu: these pages ship zero JS, and the
   choice needs no storing because the URL already carries it — /pl/ leads to a CTA
   pointing at /pl/calculator/, whose static "html lang" then wins over whatever the
   browser had persisted. */
.landing-actions { display: flex; align-items: center; gap: 10px; }
.landing-lang {
  display: inline-flex; align-items: center; gap: 2px; padding: 3px;
  border: 1px solid var(--chip-border); background: #fff; border-radius: 999px;
}
.landing-lang a {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 32px; padding: 5px 7px; border-radius: 999px;
  font-family: "JetBrains Mono", monospace; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; color: var(--muted); text-decoration: none;
}
.landing-lang a.is-current { background: var(--ink); color: #fff; }

/* Sits after the last slide and is only as tall as its own contents, so scrolling
   past the closing slide reveals it from the bottom rather than handing over a whole
   further screen. scroll-snap-align: end parks its foot against the foot of the
   viewport, leaving the closing slide still visible above it. The real site footer
   (SiteFooter) supplies its own padding/layout below, so this wrapper only carries
   the snap behaviour and the band's background. */
.landing-footer {
  position: relative; z-index: 3; scroll-snap-align: end;
  background: var(--surface); border-top: 1px solid var(--border);
}
/* The closing slide holds still while the footer rides up over it, matching how the
   slides hand over to each other. Two things make that work: the slide sticks, and
   the footer sits inside the same <main> — a sticky element stops sticking at its
   parent's edge, so a footer placed after </main> would unstick the slide at exactly
   the moment it arrived. */
.landing-slide:last-of-type {
  position: sticky; top: var(--landing-header-h); z-index: 1;
}

.site-footer { width: 100%; box-sizing: border-box; display: flex; flex-direction: column;
  gap: 22px; padding: 22px 32px 26px; }
.site-footer-columns { display: grid; grid-template-columns: 3fr 2fr; gap: 64px; align-items: start; }
.site-footer-about { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
.site-footer-mark-row { display: flex; align-items: baseline; gap: 9px; }
.site-footer-mark { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
.site-footer-version {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em;
  color: var(--muted-3);
}
.site-footer-about-body { margin: 0; font-size: 12px; line-height: 1.6; color: var(--muted-2); }
.site-footer-note { margin: 0; font-size: 11px; line-height: 1.6; color: var(--muted-3); }
.site-footer-privacy {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted-3);
}
.site-footer-contribute { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.site-footer-label {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
}
.site-footer-links { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
.site-footer-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.site-footer-pill {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid var(--chip-border); background: #fff; border-radius: 999px;
  padding: 7px 13px; font-size: 12px; font-weight: 600; color: var(--ink);
}
.site-footer-pill-coffee { gap: 9px; padding: 9px 16px; font-size: 13.5px; color: var(--gel); }
.site-footer-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; box-sizing: border-box;
  border: 1px solid var(--chip-border); background: #fff; border-radius: 999px;
  color: var(--ink-soft);
}
.site-footer-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
.site-footer-disclaimer { display: flex; flex-direction: column; gap: 9px; }
.site-footer-disclaimer-body { margin: 0; font-size: 11.5px; line-height: 1.65; color: var(--muted); }
.site-footer-bottom {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  flex-wrap: wrap; border-top: 1px solid #E6E8E2; padding-top: 14px;
}
.site-footer-copyright {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.08em;
  color: var(--muted-3);
}

/* Points past the fold. Two rotated borders rather than an SVG: no request, and it
   inherits the palette. The drift stops for anyone who asked the system to reduce
   motion. Kept on the closing slide too, since scrolling on from there reaches the
   footer and its "buy me a coffee" link. */
.landing-cue {
  position: absolute; left: 50%; bottom: 18px; z-index: 4;
  width: 13px; height: 13px; margin-left: -7px;
  border-right: 2px solid var(--muted-3); border-bottom: 2px solid var(--muted-3);
  opacity: 0.6; animation: landing-cue-drift 2.1s ease-in-out infinite;
}
@keyframes landing-cue-drift {
  0%, 100% { transform: rotate(45deg) translate(0, 0); opacity: 0.35; }
  50% { transform: rotate(45deg) translate(3px, 3px); opacity: 0.8; }
}
@media (prefers-reduced-motion: reduce) {
  .landing-cue { animation: none; transform: rotate(45deg); opacity: 0.5; }
}

/* Which of the four slides you are on. Fixed inside the clipped slide, so it is
   clipped along with the photograph and swaps at the same edge. */
.landing-dots { display: none; }
.landing-dots {
  position: fixed; right: 10px; top: 50%; transform: translateY(-50%); z-index: 4;
  flex-direction: column; gap: 8px;
}
.landing-dots i {
  display: block; width: 7px; height: 7px; border-radius: 50%;
  background: rgba(22, 25, 28, 0.16);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55);
}
.landing-dots i.is-current { background: rgba(22, 25, 28, 0.66); }

@media (max-width: 760px) {
  html { scroll-snap-type: y mandatory; }

  /* The header is a fixed bar, so nothing in it may wrap. The tagline is the first
     thing to go — the wordmark alone still says what the site is. */
  .landing-header { padding: 0 0.8em; }
  .landing-header > div > span + span { display: none; }
  .landing-header > div > span { font-size: 15px; white-space: nowrap; }
  .landing-actions > a {
    padding: 6px 10px !important; font-size: 11px !important; white-space: nowrap;
  }
  .landing-actions { gap: 6px; }
  .landing-lang { padding: 2px; }
  .landing-lang a { min-width: 24px; padding: 4px; font-size: 10px; }

  /* Each slide becomes a window onto its own photograph. "clip-path" makes the slide a
     containing block for a "position: fixed" child, so the picture is pinned to the
     viewport and never moves — what travels is the slide's edge, sweeping across it and
     handing over to the next photograph at the boundary. This is the one technique that
     survives iOS Safari, where "background-attachment: fixed" does not. */
  .landing-slide {
    display: block; position: relative; clip-path: inset(0);
    padding: 0; scroll-snap-align: start;
    min-height: calc(100vh - var(--landing-header-h));
    min-height: calc(100svh - var(--landing-header-h));
  }
  /* Only the framing changes here: opacity, the desaturation and the wash are left to
     inherit, so a phone gets exactly the same softened backdrop the desktop has. */
  .landing-bg {
    position: fixed; inset: 0; width: 100vw; height: 100svh;
    object-fit: cover; object-position: 19.4% center;
  }
  /* The desktop veil is an ellipse tuned for a landscape frame; on a portrait one it
     smears the whole picture. Here it is a vertical fade instead: dense behind the
     question at the top, gone by the lower third so the road and the rider read. */
  .landing-wash {
    background: linear-gradient(to bottom, rgba(239, 240, 236, 0.93) 0%,
      rgba(239, 240, 236, 0.88) 32%, rgba(239, 240, 236, 0.45) 54%,
      rgba(239, 240, 236, 0.08) 72%, rgba(239, 240, 236, 0) 100%);
  }

  .landing-cluster {
    position: relative; z-index: 2; width: 100%;
    padding: calc(1.5em + 10svh) 1.1em 0;
    font-size: 15px;
  }
  /* Phones are top-aligned, so nothing sinks and the reservation would only add dead
     space above a re-wrapped question. */
  .landing-q {
    max-width: 92%; margin: 0 !important; text-align: left !important;
    font-size: clamp(24px, 7vw, 32px); line-height: 1.2; min-height: 0;
  }
  /* The desktop rag is hand-set; let the text find its own breaks when narrow. */
  .landing-q br,
  .landing-cta-title br { display: none; }
  .landing-shot {
    width: 100%; margin: calc(2.2em + 2svh) 0 0 !important;
    align-items: flex-start !important; text-align: left !important;
  }
  /* Sits with the screenshot it labels, over on the right, rather than stranded at the
     opposite edge. */
  /* Wide enough that only the explicit break splits it — the 72% cap was clipping the
     second line into a third. */
  .landing-cap { max-width: 100%; margin-left: auto; text-align: right; }
  .landing-cap br { display: inline; }
  /* Half a screenshot, hung off the right edge and dropped below the question, so the
     rider along the bottom-left of the photograph stays in view. The transform keeps
     this purely visual — the caption above it does not move with it. */
  /* Pinned to the rider rather than to the container, so the gap between them holds
     as the screen changes. With "object-fit: cover" on a portrait box the picture is
     scaled to the height, which puts him at (0.18 - 0.194) * 1.79 * vh + 0.194 * vw —
     the 19.4vw / 2.51vh below. The constant is the gap itself, minus the cluster's own
     left padding. Widening the screen therefore slides both outward together: more of
     the screenshot comes into view, and a little more field opens up to his left. */
  .landing-shot img {
    /* Sized off the viewport HEIGHT, never the container width. A percentage width
       grew the picture itself as the window widened — it stretched instead of
       revealing. Fixed like this, widening only uncovers more of it. */
    height: 44svh; width: auto; max-width: none; max-height: none;
    transform: none;
    margin-left: calc(19.4vw - 2.51vh + 30px);
  }


  /* Slide 1 deliberately has no rule here: it is signed off, and the shared rules above
     already are its rules. Each photograph below needs its own crop and its own offset,
     because the subject sits somewhere different in each frame and the frames are not
     even the same shape. The numbers come from the closed form for a portrait
     cover-crop: subject_x = (subject - pos) * aspect * vh + pos * vw. */

  /* Runner stands at 80% of run.jpg; this puts him at 84% of the screen, and the
     screenshot bleeds off the LEFT with its right edge a fixed 46px short of him. */
  .landing-slide[data-slide='2'] .landing-bg { object-position: 78.6% center; }
  .landing-slide[data-slide='2'] .landing-q {
    margin-left: auto !important; text-align: right !important;
  }
  .landing-slide[data-slide='2'] .landing-cap {
    margin-left: 0 !important; margin-right: auto !important; text-align: left !important;
  }
  /* mix.jpg is a 3.5:1 banner, so its width is what governs. Sized so the window
     starts below 48% of the card — "Sugar 1:1" begins at 54% and "Lemon" at 52.5%,
     and both need to be whole for the slide to make its point. */
  .landing-slide[data-slide='2'] .landing-shot img {
    width: 66vh; height: auto;
    margin-left: calc(78.6vw - 63.49vh - 62.5px);
  }

  /* Gravel rider stands at 14.9% of the cropped frame, which is a different shape
     again (1.56 rather than 1.79). */
  .landing-slide[data-slide='3'] .landing-bg { object-position: 16.56% center; }
  /* Back on the glue, like slide 1: the chart starts a fixed 46px to the right of the
     rider, which is what leaves him uncovered. The explanatory column is gone from the
     file for good now, so there is nothing left to park off the edge. */
  .landing-slide[data-slide='3'] .landing-shot img {
    margin-left: calc(16.56vw - 2.59vh + 70.5px);
  }

  /* No question and no screenshot here, so the only job is keeping the rider and the
     left-hand FINISH pylon in a frame that only shows about a quarter of the picture. */
  /* Pinned by its middle rather than hung from the top, so the overflow is split
     evenly and the frame cannot drift: at 130svh centred, 15svh of sky goes off the
     top and the rider comes up larger. */
  .landing-slide[data-slide='4'] .landing-bg {
    bottom: auto; height: 130svh; top: 50%; transform: translateY(-50%);
    object-position: 11.5% center;
  }
  /* The slide is display:block here, and this block carries an inline max-width — so
     without auto margins it hugs the left edge and only its contents look centred. */
  .landing-slide[data-slide='4'] > div {
    padding-top: 12svh !important; margin-left: auto; margin-right: auto;
  }
  /* The headline stays up top; the button and the FAQ link drop into the bike's
     region further down the photograph. !important because the button carries an
     inline margin. */
  .landing-slide[data-slide='4'] > div > a:nth-of-type(1) {
    margin-top: 30svh !important;
  }

  .landing-slide[data-slide='4'] .landing-cap {
    margin: 0 auto !important; text-align: center !important;
    font-size: 0.66em; letter-spacing: 0.06em;
  }

  .site-footer { padding: 16px 1.35em 20px; gap: 16px; }
  .site-footer-columns { grid-template-columns: 1fr; gap: 18px; }

  .landing-cue { bottom: 12px; width: 11px; height: 11px; margin-left: -6px; }

  .landing-dots { display: flex; }
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
        <div className="landing-actions">
          <div className="landing-lang">
            <a href={landingHref('en')} hrefLang="en">
              EN
            </a>
            <a href={landingHref('pl')} hrefLang="pl" className="is-current">
              PL
            </a>
          </div>
          <a href={calculatorHref('pl')} style={ctaButton}>
            Otwórz kalkulator →
          </a>
        </div>
      </header>

      <main>
        <section className="landing-slide" data-shot="right" data-slide="1">
          <img className="landing-bg" src={assetHref('/landing/road.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-dots" aria-hidden="true">
            <i className="is-current" />
            <i />
            <i />
            <i />
          </div>
          <span className="landing-cue" aria-hidden="true" />
          <div className="landing-cluster">
            <h1 className="landing-q">
              Jeździsz na rowerze, biegasz, czy uprawiasz inny sport, <br />w którym musisz
              uzupełniać energię w trakcie <br />
              wysiłku?
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

        <section className="landing-slide" data-shot="left" data-slide="2">
          <img className="landing-bg" src={assetHref('/landing/run.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-dots" aria-hidden="true">
            <i />
            <i className="is-current" />
            <i />
            <i />
          </div>
          <span className="landing-cue" aria-hidden="true" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              Czujesz, jak żele czy izotoniki drenują Twój portfel, <br />a nie chcesz z nich
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

        <section className="landing-slide" data-shot="right" data-slide="3">
          <img className="landing-bg" src={assetHref('/landing/gravel.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-dots" aria-hidden="true">
            <i />
            <i />
            <i className="is-current" />
            <i />
          </div>
          <span className="landing-cue" aria-hidden="true" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              A może złapałeś kiedyś bombę i zastanawiasz się, <br />
              jak temu przeciwdziałać?
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

        <section className="landing-slide" style={{ textAlign: 'center' }} data-slide="4">
          <img className="landing-bg" src={assetHref('/landing/finish.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
            <i className="is-current" />
          </div>
          <span className="landing-cue" aria-hidden="true" />
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
              <span>Za darmo</span> · <span>bez konta</span> · <span>działa w przeglądarce</span>
            </p>
            <h2
              className="landing-cta-title"
              style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 700, margin: 0 }}
            >
              Zaplanuj, ile węglowodanów i płynów <br />
              zabrać na trasę i jak rozłożyć je <br />w czasie.
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
        <footer className="landing-footer">
          <SiteFooter lang="pl" />
        </footer>
      </main>
    </div>
  );
}
