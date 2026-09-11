// src/faq/FaqIndex.it.tsx
import { FaqLayout, articleH1Style, articleTextStyle, articleLinkStyle } from './FaqLayout';
import { ARTICLES } from './registry';
import { faqHref } from '../urls';

export default function FaqIndexIt() {
  return (
    <FaqLayout lang="it">
      <h1 style={articleH1Style}>Domande frequenti</h1>
      <p style={{ ...articleTextStyle, color: 'var(--muted-2)', marginBottom: 28 }}>
        Risposte chiare sulla strategia di carboidrati e idratazione per le lunghe uscite.
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
              href={faqHref('it', a.slug)}
              style={{ ...articleLinkStyle, fontSize: 17, color: 'var(--ink)' }}
            >
              {a.it.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.it.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
