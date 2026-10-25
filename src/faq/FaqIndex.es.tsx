// src/faq/FaqIndex.es.tsx
import { FaqLayout, articleH1Style, articleTextStyle, articleLinkStyle } from './FaqLayout';
import { ARTICLES } from './registry';
import { faqHref } from '../urls';

export default function FaqIndexEs() {
  return (
    <FaqLayout lang="es">
      <h1 style={articleH1Style}>Preguntas frecuentes</h1>
      <p style={{ ...articleTextStyle, color: 'var(--muted-2)', marginBottom: 28 }}>
        Respuestas claras sobre la estrategia de carbohidratos e hidratación para salidas largas.
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
              href={faqHref('es', a.slug)}
              style={{ ...articleLinkStyle, fontSize: 17, color: 'var(--ink)' }}
            >
              {a.es.title}
            </a>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted-2)' }}>
              {a.es.description}
            </p>
          </li>
        ))}
      </ul>
    </FaqLayout>
  );
}
