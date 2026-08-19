// src/faq/FaqIndex.pl.tsx
import { FaqLayout, articleH1Style, articleTextStyle, articleLinkStyle } from './FaqLayout';
import { ARTICLES } from './registry';
import { faqHref } from '../urls';

export default function FaqIndexPl() {
  return (
    <FaqLayout lang="pl">
      <h1 style={articleH1Style}>Częste pytania</h1>
      <p style={{ ...articleTextStyle, color: 'var(--muted-2)', marginBottom: 28 }}>
        Konkretne odpowiedzi o strategii węglowodanowej i nawodnieniu na długich trasach.
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <a
              href={faqHref('pl', a.slug)}
              style={{ ...articleLinkStyle, fontSize: 17, color: 'var(--ink)' }}
            >
              {a.pl.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.pl.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
