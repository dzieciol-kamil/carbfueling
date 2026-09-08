// src/faq/FaqIndex.de.tsx
import { FaqLayout, articleH1Style, articleTextStyle, articleLinkStyle } from './FaqLayout';
import { ARTICLES } from './registry';
import { faqHref } from '../urls';

export default function FaqIndexDe() {
  return (
    <FaqLayout lang="de">
      <h1 style={articleH1Style}>Häufige Fragen</h1>
      <p style={{ ...articleTextStyle, color: 'var(--muted-2)', marginBottom: 28 }}>
        Klare Antworten zu Kohlenhydrat- und Flüssigkeitsstrategie auf langen Touren.
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
              href={faqHref('de', a.slug)}
              style={{ ...articleLinkStyle, fontSize: 17, color: 'var(--ink)' }}
            >
              {a.de.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.de.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
