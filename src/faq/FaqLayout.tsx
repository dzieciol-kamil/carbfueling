import type { CSSProperties, ReactNode } from 'react';
import { t, type Lang } from '../i18n/strings';
import { assetHref, calculatorHref, faqHref, landingHref } from '../urls';
import LangMenu from '../static/LangMenu';

const CHROME: Record<Lang, { back: string; index: string; brand: string; open: string }> = {
  en: {
    back: '← Back to the calculator',
    index: 'More FAQ articles',
    brand: 'Carb Fueling',
    open: 'Open the calculator →',
  },
  pl: {
    back: '← Wróć do kalkulatora',
    index: 'Więcej artykułów FAQ',
    brand: 'Carb Fueling',
    open: 'Otwórz kalkulator →',
  },
};

// The landing header, rebuilt here in inline styles: these pages ship no stylesheet of their
// own beyond renderPage.mjs's ROOT_STYLE, and the landing's own rules live inside
// Landing.*.tsx's landingCss, which FAQ pages never load. Values copied from there. The one
// thing inline styles can't express — hiding the tagline on a phone — is a `.faq-tagline` rule
// in ROOT_STYLE. Deliberately a copy rather than a component shared with the landing: the
// landing's header is signed off and fixed-positioned, and this one is neither.
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

export const articleH1Style: CSSProperties = { fontSize: 26, lineHeight: 1.3, marginBottom: 18 };

export const articleTextStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: 'var(--ink-soft)',
  marginBottom: 16,
};

export const articleImgStyle: CSSProperties = {
  width: '100%',
  maxWidth: 640,
  display: 'block',
  margin: '20px 0',
};

export const articleLinkStyle: CSSProperties = { fontSize: 15, fontWeight: 600 };

export function FaqLayout({
  lang,
  slug,
  children,
}: {
  lang: Lang;
  /** The article this page renders, so the language switch lands on its translation rather
   *  than dumping the reader back at the index. Omitted by the FAQ index itself. */
  slug?: string;
  children: ReactNode;
}) {
  const c = CHROME[lang];
  const indexHref = faqHref(lang);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <img className="faq-bg" src={assetHref('/landing/road.jpg')} alt="" />
      <div className="faq-wash" />
      <header
        className="faq-header"
        style={{
          position: 'relative',
          zIndex: 1,
          // Every number here is the landing header's, down to the 61px height: the two bars
          // sit at the same place on screen, so following a link between the pages doesn't
          // shift the wordmark. Opaque for the same reason the landing's is — the photograph
          // below reaches the screen edges, where the wash has all but faded out, and dark
          // ink on bare asphalt is unreadable. The picture belongs behind the article.
          height: 61,
          boxSizing: 'border-box',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href={landingHref(lang)}
          style={{ display: 'flex', alignItems: 'baseline', gap: 12, color: 'var(--ink)' }}
        >
          <span className="faq-wordmark" style={headerWordmark}>
            CARB FUELING
          </span>
          <span className="faq-tagline" style={headerTagline}>
            {t(lang).tagline}
          </span>
        </a>
        <div className="faq-actions">
          <LangMenu lang={lang} hrefFor={(code) => faqHref(code, slug)} />
          <a href={calculatorHref(lang)} style={ctaButton}>
            {c.open}
          </a>
        </div>
      </header>
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--bg)',
          padding: '20px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        <a href={indexHref}>{c.index}</a>
        <a href={calculatorHref(lang)}>{c.back}</a>
      </footer>
    </div>
  );
}
