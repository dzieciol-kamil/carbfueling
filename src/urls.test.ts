import { describe, expect, test } from 'vitest';
import {
  assetHref,
  calculatorHref,
  FAQ_HREF_FROM_CALCULATOR,
  LANDING_HREF_FROM_CALCULATOR,
  faqHref,
  landingHref,
  nextLangPath,
} from './urls';

describe('faqHref', () => {
  test('index page, per language', () => {
    expect(faqHref('en')).toBe('__BASE__/en/faq/');
    expect(faqHref('pl')).toBe('__BASE__/pl/faq/');
    expect(faqHref('de')).toBe('__BASE__/de/faq/');
    expect(faqHref('it')).toBe('__BASE__/it/faq/');
  });

  test('article page, per language', () => {
    expect(faqHref('en', 'bonk-crisis')).toBe('__BASE__/en/faq/bonk-crisis/');
    expect(faqHref('pl', 'bonk-crisis')).toBe('__BASE__/pl/faq/bonk-crisis/');
    expect(faqHref('de', 'bonk-crisis')).toBe('__BASE__/de/faq/bonk-crisis/');
    expect(faqHref('it', 'bonk-crisis')).toBe('__BASE__/it/faq/bonk-crisis/');
  });
});

describe('calculatorHref', () => {
  test('per language', () => {
    expect(calculatorHref('en')).toBe('__BASE__/en/calculator/');
    expect(calculatorHref('pl')).toBe('__BASE__/pl/calculator/');
    expect(calculatorHref('de')).toBe('__BASE__/de/calculator/');
    expect(calculatorHref('it')).toBe('__BASE__/it/calculator/');
  });
});

describe('landingHref', () => {
  test('per language', () => {
    expect(landingHref('en')).toBe('__BASE__/en/');
    expect(landingHref('pl')).toBe('__BASE__/pl/');
    expect(landingHref('de')).toBe('__BASE__/de/');
    expect(landingHref('it')).toBe('__BASE__/it/');
  });
});

describe('assetHref', () => {
  test('prefixes an arbitrary root-relative asset path', () => {
    expect(assetHref('/faq/bonk-crisis/supply-demand-gap.png')).toBe(
      '__BASE__/faq/bonk-crisis/supply-demand-gap.png',
    );
  });
});

describe('FAQ_HREF_FROM_CALCULATOR', () => {
  test('is a plain relative path — the live SPA never needs to know its own base path', () => {
    expect(FAQ_HREF_FROM_CALCULATOR).toBe('../faq/');
  });
});

describe('nextLangPath', () => {
  test('swaps the language segment', () => {
    expect(nextLangPath('/en/calculator/', 'pl')).toBe('/pl/calculator/');
  });

  test('is base-path aware for free, since it substitutes within whatever pathname it is given', () => {
    expect(nextLangPath('/preview/en/calculator/', 'pl')).toBe('/preview/pl/calculator/');
  });

  test('is a no-op when already at the target language — the pushState guard relies on this', () => {
    expect(nextLangPath('/pl/calculator/', 'pl')).toBe('/pl/calculator/');
  });

  test('swaps to and from German too', () => {
    expect(nextLangPath('/en/calculator/', 'de')).toBe('/de/calculator/');
    expect(nextLangPath('/de/calculator/', 'en')).toBe('/en/calculator/');
  });
});

describe('LANDING_HREF_FROM_CALCULATOR', () => {
  test('is a plain relative path, so it survives the /preview sub-path like the FAQ link does', () => {
    expect(LANDING_HREF_FROM_CALCULATOR).toBe('../');
  });

  test("resolves to the calculator's own language landing page, with or without a base path", () => {
    const resolve = (from: string) =>
      new URL(LANDING_HREF_FROM_CALCULATOR, `https://x${from}`).pathname;
    expect(resolve('/en/calculator/')).toBe('/en/');
    expect(resolve('/pl/calculator/')).toBe('/pl/');
    expect(resolve('/preview/pl/calculator/')).toBe('/preview/pl/');
  });
});
