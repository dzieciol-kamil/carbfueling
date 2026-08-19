import type { CSSProperties, ReactNode } from 'react';
import type { Lang } from '../i18n/strings';
import { calculatorHref, faqHref, landingHref } from '../urls';

const CHROME: Record<Lang, { back: string; index: string; brand: string }> = {
  en: { back: '← Back to the calculator', index: 'More FAQ articles', brand: 'Carb Fueling' },
  pl: { back: '← Wróć do kalkulatora', index: 'Więcej artykułów FAQ', brand: 'Carb Fueling' },
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

export function FaqLayout({ lang, children }: { lang: Lang; children: ReactNode }) {
  const c = CHROME[lang];
  const indexHref = faqHref(lang);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
        <a href={landingHref(lang)} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
          {c.brand}
        </a>
      </header>
      <main
        style={{
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
