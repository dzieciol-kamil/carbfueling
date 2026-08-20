// src/landing/Landing.en.tsx
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
// The question sits upper-left and the screenshot lower-right, overlapping around the
// centre — a diagonal that converges rather than two blocks marooned in opposite
// corners.
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
  align-items: flex-end; text-align: right;
  width: min(740px, 100%); margin: -64px 0 0 auto;
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
    width: 100%; margin: 22px 0 0; align-items: flex-start; text-align: left;
  }
  .landing-shot img { max-height: 52svh; }
  .landing-cap { max-width: none; }
  /* A 16:9 photo cropped to a portrait viewport loses its outer thirds, and the
     subject always stands near the left edge. */
  .landing-bg { object-position: 22% center; }
  .landing-wash {
    background: radial-gradient(ellipse 120% 70% at 50% 50%,
      rgba(239, 240, 236, 0.98) 0%, rgba(239, 240, 236, 0.92) 46%,
      rgba(239, 240, 236, 0.5) 74%, rgba(239, 240, 236, 0) 100%);
  }
}
`;

export default function LandingEn() {
  return (
    <div>
      <style>{landingCss}</style>
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={headerWordmark}>CARB FUELING</span>
          <span style={headerTagline}>carbohydrate &amp; hydration planner</span>
        </div>
        <a href={calculatorHref('en')} style={ctaButton}>
          Open the calculator →
        </a>
      </header>

      <main>
        <section className="landing-slide">
          <img className="landing-bg" src={assetHref('/landing/road.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h1 className="landing-q">
              Do you ride, run, or do some other
              <br />
              sport where you need to
              <br />
              fuel mid-effort?
            </h1>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                This is what a plan for your route looks like
              </figcaption>
              <img
                src={assetHref('/landing/hero.jpg')}
                alt="Carb Fueling app: route, coverage cards, and the fueling plan chart"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide">
          <img className="landing-bg" src={assetHref('/landing/run.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              Do gels and isotonic drinks quietly drain
              <br />
              your wallet, even though you
              <br />
              don't want to give
              <br />
              them up?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">
                You probably already have what you need in your kitchen
              </figcaption>
              <img
                src={assetHref('/landing/mix.jpg')}
                alt="Mix & bottles panel: the isotonic recipe, measured out in sugar, salt and lemon"
              />
            </figure>
          </div>
        </section>

        <section className="landing-slide">
          <img className="landing-bg" src={assetHref('/landing/gravel.jpg')} alt="" />
          <div className="landing-wash" />
          <div className="landing-cluster">
            <h2 className="landing-q">
              Ever bonked out on a ride or a long run
              <br />— and wished you'd seen
              <br />
              it coming?
            </h2>
            <figure className="landing-shot">
              <figcaption className="landing-cap">See the gap before it turns critical</figcaption>
              <img
                src={assetHref('/landing/chart.jpg')}
                alt="The planning chart, showing the gap between the carbs absorbed and the carbs burned"
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
              style={{ margin: 0, maxWidth: 'none', color: 'var(--muted-3)' }}
            >
              Free · no account · runs in your browser
            </p>
            <h2 style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 700, margin: 0 }}>
              Plan how many carbs and how much fluid to take on your route — and how to spread them
              out over time.
            </h2>
            <a
              href={calculatorHref('en')}
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
              Open the calculator →
            </a>
            <a
              href={faqHref('en')}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-2)', marginTop: 4 }}
            >
              Curious why this works? Read the FAQ →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
