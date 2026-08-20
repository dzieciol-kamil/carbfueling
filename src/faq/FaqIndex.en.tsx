// src/faq/FaqIndex.en.tsx
import { FaqLayout, articleH1Style, articleTextStyle, articleLinkStyle } from './FaqLayout';
import { ARTICLES } from './registry';
import { faqHref } from '../urls';

export default function FaqIndexEn() {
  return (
    <FaqLayout lang="en">
      <h1 style={articleH1Style}>Fueling FAQ</h1>
      <p style={{ ...articleTextStyle, color: 'var(--muted-2)', marginBottom: 28 }}>
        Straight answers about carb and hydration strategy for long rides.
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
              href={faqHref('en', a.slug)}
              style={{ ...articleLinkStyle, fontSize: 17, color: 'var(--ink)' }}
            >
              {a.en.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.en.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
