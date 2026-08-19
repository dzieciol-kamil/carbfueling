// scripts/build-faq.mjs
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const SITE = 'https://carbfueling.com';
const LANGS = ['en', 'pl'];

const ROOT_STYLE = `
  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('/fonts/archivo-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
      U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('/fonts/archivo-latin-ext.woff2') format('woff2');
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329,
      U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  :root { --ink:#16191c; --bg:#eff0ec; --surface:#fff; --border:#e3e5e0; --border-soft:#edefea;
    --chip-border:#dde0da; --muted:#7a817c; --muted-2:#6e7573; --muted-3:#9aa09b;
    --ink-soft:#3d423e; --carb:#5aa33f; --gel:#c9922e; --food:#b4552f; --water:#3d8fbf; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Archivo', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased; }
  a { color: var(--water); text-decoration: none; }
  a:hover { color: #2f7099; }
`;

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch],
  );
}

// Safe to embed inside a <script type="application/ld+json"> element: JSON.stringify already
// produces valid JSON, but a literal "</script" substring in a title/description would still
// prematurely close the tag when parsed as HTML. Escaping "<" as its unicode escape prevents
// that while remaining valid, round-trippable JSON.
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function renderPage({ urlPath, altPath, lang, title, description, jsonLd, bodyHtml }) {
  const canonical = `${SITE}${urlPath}`;
  const alternate = `${SITE}${altPath}`;
  const enHref = lang === 'pl' ? alternate : canonical;
  const plHref = lang === 'pl' ? canonical : alternate;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const ogType = jsonLd['@type'] === 'FAQPage' ? 'website' : 'article';
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://kddudi.goatcounter.com; connect-src 'self' https://kddudi.goatcounter.com; base-uri 'self'; form-action 'self';"
    />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en" href="${enHref}" />
    <link rel="alternate" hreflang="pl" href="${plHref}" />
    <link rel="alternate" hreflang="x-default" href="${enHref}" />
    <meta name="theme-color" content="#16191c" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta property="og:locale" content="${lang === 'pl' ? 'pl_PL' : 'en_US'}" />
    <meta property="og:locale:alternate" content="${lang === 'pl' ? 'en_US' : 'pl_PL'}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>
    <script data-goatcounter="https://kddudi.goatcounter.com/count" async src="/count.js"></script>
    <style>${ROOT_STYLE}</style>
  </head>
  <body>
    <div id="root">${bodyHtml}</div>
  </body>
</html>`;
}

function articleModulePath(slug, lang) {
  return `/src/faq/articles/${slug}.${lang}.tsx`;
}

async function writeSitemap(pages) {
  const templatePath = path.join(rootDir, 'public/sitemap.xml');
  const template = await readFile(templatePath, 'utf-8');
  const entries = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p.urlPath}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    )
    .join('\n');
  const combined = template.replace('</urlset>', `${entries}\n</urlset>`);
  await writeFile(path.join(distDir, 'sitemap.xml'), combined, 'utf-8');
}

async function main() {
  const server = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const { ARTICLES } = await server.ssrLoadModule('/src/faq/registry.ts');
  const pages = [];

  for (const lang of LANGS) {
    const prefix = lang === 'pl' ? '/pl/faq' : '/faq';
    const altPrefix = lang === 'pl' ? '/faq' : '/pl/faq';

    const indexModPath = lang === 'pl' ? '/src/faq/FaqIndex.pl.tsx' : '/src/faq/FaqIndex.en.tsx';
    const { default: IndexComponent } = await server.ssrLoadModule(indexModPath);
    pages.push({
      outPath: path.join(distDir, lang === 'pl' ? 'pl/faq/index.html' : 'faq/index.html'),
      urlPath: `${prefix}/`,
      altPath: `${altPrefix}/`,
      lang,
      title: lang === 'pl' ? 'Częste pytania — Carb Fueling' : 'FAQ — Carb Fueling',
      description:
        lang === 'pl'
          ? 'Odpowiedzi na pytania o strategię węglowodanową i nawodnienie na długich trasach rowerowych.'
          : 'Answers about carb and hydration strategy for long bike rides.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ARTICLES.map((a) => ({
          '@type': 'Question',
          name: a[lang].title,
          acceptedAnswer: { '@type': 'Answer', text: a[lang].description },
        })),
      },
      bodyHtml: renderToStaticMarkup(createElement(IndexComponent)),
    });

    for (const article of ARTICLES) {
      const modPath = path.join(rootDir, 'src/faq/articles', `${article.slug}.${lang}.tsx`);
      if (!existsSync(modPath)) {
        throw new Error(
          `faq: missing component ${modPath} for registry slug "${article.slug}" (${lang})`,
        );
      }

      const { default: ArticleComponent } = await server.ssrLoadModule(
        articleModulePath(article.slug, lang),
      );
      const articleUrlPath = `${prefix}/${article.slug}/`;
      const articleCanonical = `${SITE}${articleUrlPath}`;
      pages.push({
        outPath: path.join(
          distDir,
          lang === 'pl' ? `pl/faq/${article.slug}/index.html` : `faq/${article.slug}/index.html`,
        ),
        urlPath: articleUrlPath,
        altPath: `${altPrefix}/${article.slug}/`,
        lang,
        title: `${article[lang].title} — Carb Fueling`,
        description: article[lang].description,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article[lang].title,
          description: article[lang].description,
          inLanguage: lang,
          image: `${SITE}/og-image.png`,
          mainEntityOfPage: articleCanonical,
          author: { '@type': 'Organization', name: 'Carb Fueling' },
          publisher: { '@type': 'Organization', name: 'Carb Fueling' },
          datePublished: article.datePublished,
        },
        bodyHtml: renderToStaticMarkup(createElement(ArticleComponent)),
      });
    }
  }

  for (const page of pages) {
    await mkdir(path.dirname(page.outPath), { recursive: true });
    await writeFile(page.outPath, renderPage(page), 'utf-8');
  }
  await writeSitemap(pages);

  await server.close();
  console.log(`faq: built ${pages.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
