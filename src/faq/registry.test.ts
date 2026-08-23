import { describe, expect, it } from 'vitest';
import { ARTICLES } from './registry';

// Real files on disk relative to this test file — no filesystem mocking needed. Vite's
// import.meta.glob resolves these paths at build/test time, so a missing component file
// shows up as a missing key here rather than a runtime import failure.
const articleModules = import.meta.glob('./articles/*.tsx');

describe('ARTICLES registry', () => {
  it('has a unique, URL-safe slug per article', () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('has a non-empty en and pl title/description for every article', () => {
    for (const article of ARTICLES) {
      for (const lang of ['en', 'pl'] as const) {
        expect(article[lang].title.trim().length).toBeGreaterThan(0);
        expect(article[lang].description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has a valid ISO datePublished for every article', () => {
    for (const article of ARTICLES) {
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(article.datePublished))).toBe(false);
    }
  });

  it('ships exactly the 16 articles scoped for this round', () => {
    expect(ARTICLES.map((a) => a.slug).sort()).toEqual(
      [
        'bonk-crisis',
        'bottle-refill-planning',
        'bottle-vs-gel',
        'carb-transporter-mix',
        'carbs-per-hour-by-intensity',
        'diy-flavor-additives',
        'fueling-100km-vs-300km',
        'gut-training-carb-tolerance',
        'heat-carb-plan',
        'honey-sugar-diy-mix',
        'hydration-water-per-hour',
        'malto-fructose-blend',
        'pace-power-absorption',
        'running-vs-cycling-carbs',
        'sodium-electrolytes-cycling',
        'what-the-chart-shows',
      ].sort(),
    );
  });

  it('has a component file on disk for every {slug, lang} pair', () => {
    for (const article of ARTICLES) {
      for (const lang of ['en', 'pl'] as const) {
        const componentPath = `./articles/${article.slug}.${lang}.tsx`;
        expect(componentPath in articleModules, `missing ${componentPath}`).toBe(true);
      }
    }
  });
});
