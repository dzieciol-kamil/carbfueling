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
// One predicate, spelled once: a build with a base path is the /preview deploy, and it must
// be excluded from the index and from the sitemap together. These two were separate
// expressions (`BASE !== ''` and `!BASE`); equivalent, but the spec is emphatic about this
// condition, and two spellings are two chances to change one and forget the other.
const isPreview = BASE !== '';

// A relative hint within our own sitemap, nothing more. The landing pages are the site's
// entry points, the calculator is the thing people actually come to use, and the FAQ
// supports both — which is what the default covers.
const SITEMAP_PRIORITY = new Map([
  ['/en/', '1.0'],
  ['/pl/', '1.0'],
  ['/de/', '1.0'],
  ['/en/calculator/', '0.9'],
  ['/pl/calculator/', '0.9'],
  ['/de/calculator/', '0.9'],
]);

// SEO title/description for the landing pages, per language. `description` feeds the meta/og/
// twitter tags; `jsonLdDescription` is worded slightly differently on purpose (see the existing
// en/pl copy) for the JSON-LD structured-data block.
const LANDING_META = {
  en: {
    title: 'Carb Fueling — carbohydrate & hydration planner',
    description:
      'Plan how many carbs and how much fluid to take on a ride, and how to spread them across bottles, flasks and food over time. Free, no account, runs in your browser.',
    jsonLdDescription:
      'Plan how many carbs and how much fluid to take on a ride, and how to spread them across bottles, flasks and food over time.',
  },
  pl: {
    title: 'Carb Fueling — planer węglowodanów i nawodnienia',
    description:
      'Zaplanuj, ile węglowodanów i płynów zabrać na trasę, i jak rozłożyć je w czasie. Za darmo, bez konta, działa w przeglądarce.',
    jsonLdDescription:
      'Zaplanuj, ile węglowodanów i płynów zabrać na trasę, i jak rozłożyć je na bidony, flaszki i jedzenie w czasie.',
  },
  de: {
    title: 'Carb Fueling — Kohlenhydrat- und Flüssigkeitsplaner',
    description:
      'Plane, wie viele Kohlenhydrate und wie viel Flüssigkeit du auf eine Fahrt mitnimmst, und wie du sie über die Zeit verteilst. Kostenlos, kein Konto, läuft im Browser.',
    jsonLdDescription:
      'Plane, wie viele Kohlenhydrate und wie viel Flüssigkeit du auf eine Fahrt mitnimmst, und wie du sie auf Flaschen, Flasks und Essen über die Zeit verteilst.',
  },
};

async function writeSitemap(pages) {
  const templatePath = path.join(rootDir, 'public/sitemap.xml');
  const template = await readFile(templatePath, 'utf-8');
  const entries = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p.urlPath}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${SITEMAP_PRIORITY.get(p.urlPath) ?? '0.6'}</priority>\n  </url>`,
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
  const { calculatorHref, faqHref, landingHref } = await server.ssrLoadModule('/src/urls.ts');
  const { LANGS } = await server.ssrLoadModule('/src/i18n/strings.ts');
  const { FAQ_INDEX_META } = await server.ssrLoadModule('/src/faq/FaqLayout.tsx');
  // faqHref()/landingHref() always return a __BASE__-marked string (Task 1) — correct when
  // used *inside* a React component's own JSX (that markup ends up in bodyHtml, which goes
  // through renderPage()'s single prefixInternalUrls pass at write time, same as everything
  // else on the page). Here, though, the return value feeds `page.urlPath`/`page.alternates`,
  // which renderPage() uses to build `canonical`/`hreflang` (always SITE-absolute, never
  // BASE-prefixed per the spec) — so the marker needs stripping before use in *this* context,
  // even though it's the same helper function called the same way.
  const strip = (s) => s.replace('__BASE__', '');

  const pages = [];

  // Landing pages
  for (const lang of LANGS) {
    const otherLangs = LANGS.filter((l) => l !== lang);
    const meta = LANDING_META[lang];
    const { default: LandingComponent } = await server.ssrLoadModule(
      `/src/landing/Landing.${lang}.tsx`,
    );
    pages.push({
      outPath: path.join(distDir, lang, 'index.html'),
      urlPath: strip(landingHref(lang)),
      alternates: otherLangs.map((l) => ({ lang: l, path: strip(landingHref(l)) })),
      lang,
      title: meta.title,
      description: meta.description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Carb Fueling',
        url: `${SITE}${strip(landingHref(lang))}`,
        description: meta.jsonLdDescription,
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Any (runs in a web browser)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      bodyHtml: renderToStaticMarkup(createElement(LandingComponent)),
    });
  }

  // FAQ pages (index + articles)
  for (const lang of LANGS) {
    const otherFaqLangs = LANGS.filter((l) => l !== lang);

    const indexModPath = `/src/faq/FaqIndex.${lang}.tsx`;
    const { default: IndexComponent } = await server.ssrLoadModule(indexModPath);
    pages.push({
      outPath: path.join(distDir, lang, 'faq/index.html'),
      urlPath: strip(faqHref(lang)),
      alternates: otherFaqLangs.map((l) => ({ lang: l, path: strip(faqHref(l)) })),
      lang,
      title: FAQ_INDEX_META[lang].title,
      description: FAQ_INDEX_META[lang].description,
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
      const modPath = path.join(rootDir, 'src/faq/articles', lang, `${article.slug}.tsx`);
      if (!existsSync(modPath)) {
        throw new Error(
          `build-static: missing component ${modPath} for registry slug "${article.slug}" (${lang})`,
        );
      }
      const { default: ArticleComponent } = await server.ssrLoadModule(
        `/src/faq/articles/${lang}/${article.slug}.tsx`,
      );
      const articleUrlPath = strip(faqHref(lang, article.slug));
      pages.push({
        outPath: path.join(distDir, lang, 'faq', article.slug, 'index.html'),
        urlPath: articleUrlPath,
        alternates: otherFaqLangs.map((l) => ({ lang: l, path: strip(faqHref(l, article.slug)) })),
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
    await writeFile(page.outPath, renderPage({ ...page, base: BASE, noindex: isPreview }), 'utf-8');
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
      noindex: isPreview,
      canonicalOverride: `${SITE}/en/`,
      langRedirectTargets: { pl: '/pl/', de: '/de/' },
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
      renderRedirectStub({ targetPath: stub.targetPath, base: BASE, noindex: isPreview }),
      'utf-8',
    );
  }

  if (!isPreview) {
    // The calculator's pages come from Vite, not from this script, so they never enter
    // `pages` — and without these entries the site's main destination would be missing
    // from the sitemap entirely (on master the calculator *was* the sitemap). Only `urlPath`
    // is read here, so a bare object is all an entry needs.
    await writeSitemap([
      ...pages,
      ...LANGS.map((lang) => ({ urlPath: strip(calculatorHref(lang)) })),
    ]);
  }

  await server.close();
  console.log(`build-static: built ${pages.length + 1 + stubs.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
