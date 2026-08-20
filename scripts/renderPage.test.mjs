import { describe, expect, test } from 'vitest';
import { prefixInternalUrls, renderPage, renderRedirectStub } from './renderPage.mjs';

describe('prefixInternalUrls', () => {
  test('replaces every __BASE__ marker with the given base', () => {
    const html = `<a href="__BASE__/en/faq/">x</a><link href="__BASE__/favicon.svg">`;
    expect(prefixInternalUrls(html, '/preview')).toBe(
      `<a href="/preview/en/faq/">x</a><link href="/preview/favicon.svg">`,
    );
  });

  test('collapses to a clean unprefixed path when base is empty (production)', () => {
    const html = `<a href="__BASE__/en/faq/">x</a>`;
    expect(prefixInternalUrls(html, '')).toBe(`<a href="/en/faq/">x</a>`);
  });
});

describe('renderRedirectStub', () => {
  test('emits a meta-refresh plus an external, CSP-safe script reference — no inline JS', () => {
    const html = renderRedirectStub({ targetPath: '/en/faq/', base: '', noindex: false });
    expect(html).toContain('<meta http-equiv="refresh" content="0;url=/en/faq/" />');
    expect(html).toContain('<script src="/redirect.js" data-target="/en/faq/"></script>');
    expect(html).not.toMatch(/<script>[^<]/);
  });

  test('base-prefixes both the target and the script src', () => {
    const html = renderRedirectStub({ targetPath: '/en/faq/', base: '/preview', noindex: false });
    expect(html).toContain('content="0;url=/preview/en/faq/"');
    expect(html).toContain('<script src="/preview/redirect.js" data-target="/preview/en/faq/"></script>');
  });

  test('names its destination as canonical, and carries a title and a lang', () => {
    const html = renderRedirectStub({ targetPath: '/en/faq/', base: '/preview', noindex: true });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Moved — Carb Fueling</title>');
    // SITE-absolute and un-prefixed even under /preview, like every other canonical here.
    expect(html).toContain('<link rel="canonical" href="https://carbfueling.com/en/faq/" />');
  });

  test('adds noindex when requested', () => {
    const html = renderRedirectStub({ targetPath: '/en/faq/', base: '/preview', noindex: true });
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});

const basePageArgs = {
  urlPath: '/en/faq/',
  altPath: '/pl/faq/',
  lang: 'en',
  title: 'FAQ',
  description: 'desc',
  jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
  bodyHtml: '<p>hi</p>',
};

describe('renderPage — root landing special case', () => {
  test('carries a canonical override and the conditional lang-redirect script', () => {
    const html = renderPage({
      ...basePageArgs,
      urlPath: '/en/',
      altPath: '/pl/',
      canonicalOverride: 'https://carbfueling.com/en/',
      langRedirectTarget: '/pl/',
    });
    expect(html).toContain('<link rel="canonical" href="https://carbfueling.com/en/" />');
    expect(html).toContain('<script src="/lang-redirect.js" data-pl-target="/pl/"></script>');
    expect(html).not.toContain('data-target='); // not the plain-stub script
  });

  test('a normal page (no langRedirectTarget) ships neither redirect script', () => {
    const html = renderPage(basePageArgs);
    expect(html).not.toContain('lang-redirect.js');
    expect(html).not.toContain('redirect.js" data-target');
  });
});

describe('renderPage — noindex', () => {
  test('production (default) carries no robots meta tag', () => {
    expect(renderPage(basePageArgs)).not.toContain('noindex');
  });

  test('preview (noindex: true) carries the robots meta tag', () => {
    expect(renderPage({ ...basePageArgs, noindex: true })).toContain(
      '<meta name="robots" content="noindex, nofollow" />',
    );
  });
});

describe('renderPage — og:type per JSON-LD type', () => {
  test('FAQPage and WebApplication both map to og:type "website"', () => {
    expect(renderPage(basePageArgs)).toContain('<meta property="og:type" content="website" />');
    const landingArgs = {
      ...basePageArgs,
      jsonLd: { '@context': 'https://schema.org', '@type': 'WebApplication' },
    };
    expect(renderPage(landingArgs)).toContain('<meta property="og:type" content="website" />');
  });

  test('Article maps to og:type "article"', () => {
    const articleArgs = {
      ...basePageArgs,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Article' },
    };
    expect(renderPage(articleArgs)).toContain('<meta property="og:type" content="article" />');
  });
});

describe('renderPage — base-aware asset references', () => {
  test('favicon, goatcounter script, and font URLs all pick up the base prefix', () => {
    const html = renderPage({ ...basePageArgs, base: '/preview' });
    expect(html).toContain('href="/preview/favicon.svg"');
    expect(html).toContain('src="/preview/count.js"');
    expect(html).toContain("url('/preview/fonts/archivo-latin.woff2')");
  });
});
