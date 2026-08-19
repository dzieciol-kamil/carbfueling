// scripts/build-static.mjs
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderPage, renderRedirectStub, SITE } from './renderPage.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const BASE = process.env.BASE ?? '';
const LANGS = ['en', 'pl'];
const noindex = BASE !== '';

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
  const { faqHref, landingHref } = await server.ssrLoadModule('/src/urls.ts');
  // faqHref()/landingHref() always return a __BASE__-marked string (Task 1) — correct when
  // used *inside* a React component's own JSX (that markup ends up in bodyHtml, which goes
  // through renderPage()'s single prefixInternalUrls pass at write time, same as everything
  // else on the page). Here, though, the return value feeds `page.urlPath`/`page.altPath`,
  // which renderPage() uses to build `canonical`/`hreflang` (always SITE-absolute, never
  // BASE-prefixed per the spec) — so the marker needs stripping before use in *this* context,
  // even though it's the same helper function called the same way.
  const strip = (s) => s.replace('__BASE__', '');

  const pages = [];

  // Landing pages
  for (const lang of LANGS) {
    const altLang = lang === 'pl' ? 'en' : 'pl';
    const modPath = lang === 'pl' ? '/src/landing/Landing.pl.tsx' : '/src/landing/Landing.en.tsx';
    const { default: LandingComponent } = await server.ssrLoadModule(modPath);
    pages.push({
      outPath: path.join(distDir, lang, 'index.html'),
      urlPath: strip(landingHref(lang)),
      altPath: strip(landingHref(altLang)),
      lang,
      title:
        lang === 'pl'
          ? 'Carb Fueling — planer węglowodanów i nawodnienia'
          : 'Carb Fueling — carbohydrate & hydration planner',
      description:
        lang === 'pl'
          ? 'Zaplanuj, ile węglowodanów i płynów zabrać na trasę, i jak rozłożyć je w czasie. Za darmo, bez konta, działa w przeglądarce.'
          : 'Plan how many carbs and how much fluid to take on a ride, and how to spread them across bottles, flasks and food over time. Free, no account, runs in your browser.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Carb Fueling',
        url: `${SITE}${strip(landingHref(lang))}`,
        description:
          'Plan how many carbs and how much fluid to take on a ride, and how to spread them across bottles, flasks and food over time.',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Any (runs in a web browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      bodyHtml: renderToStaticMarkup(createElement(LandingComponent)),
    });
  }

  // FAQ pages (index + articles)
  for (const lang of LANGS) {
    const altLang = lang === 'pl' ? 'en' : 'pl';

    const indexModPath = lang === 'pl' ? '/src/faq/FaqIndex.pl.tsx' : '/src/faq/FaqIndex.en.tsx';
    const { default: IndexComponent } = await server.ssrLoadModule(indexModPath);
    pages.push({
      outPath: path.join(distDir, lang, 'faq/index.html'),
      urlPath: strip(faqHref(lang)),
      altPath: strip(faqHref(altLang)),
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
          `build-static: missing component ${modPath} for registry slug "${article.slug}" (${lang})`,
        );
      }
      const { default: ArticleComponent } = await server.ssrLoadModule(
        `/src/faq/articles/${article.slug}.${lang}.tsx`,
      );
      const articleUrlPath = strip(faqHref(lang, article.slug));
      pages.push({
        outPath: path.join(distDir, lang, 'faq', article.slug, 'index.html'),
        urlPath: articleUrlPath,
        altPath: strip(faqHref(altLang, article.slug)),
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
          mainEntityOfPage: `${SITE}${articleUrlPath}`,
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
    await writeFile(page.outPath, renderPage({ ...page, base: BASE, noindex }), 'utf-8');
  }

  // `/`: a real copy of the EN landing page's content (not a blank stub — link previews and
  // non-JS crawlers need something real to read), with canonical pointed at /en/ and a
  // conditional pl-redirect script `/en/` itself doesn't carry.
  const enLanding = pages.find((p) => p.urlPath === '/en/');
  await writeFile(
    path.join(distDir, 'index.html'),
    renderPage({
      ...enLanding,
      base: BASE,
      noindex,
      canonicalOverride: `${SITE}/en/`,
      langRedirectTarget: '/pl/',
    }),
    'utf-8',
  );

  // Retired /faq/* paths: back-compat redirect stubs -> /en/faq/*
  const stubs = [
    { outPath: path.join(distDir, 'faq/index.html'), targetPath: '/en/faq/' },
    ...ARTICLES.map((a) => ({
      outPath: path.join(distDir, 'faq', a.slug, 'index.html'),
      targetPath: `/en/faq/${a.slug}/`,
    })),
  ];
  for (const stub of stubs) {
    await mkdir(path.dirname(stub.outPath), { recursive: true });
    await writeFile(
      stub.outPath,
      renderRedirectStub({ targetPath: stub.targetPath, base: BASE, noindex }),
      'utf-8',
    );
  }

  if (!BASE) {
    await writeSitemap(pages);
  }

  await server.close();
  console.log(`build-static: built ${pages.length + 1 + stubs.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
