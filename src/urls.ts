export type Lang = 'en' | 'pl';

const BASE_MARKER = '__BASE__';

/** Root-absolute, `__BASE__`-prefixed. Used only by statically-rendered content
 *  (landing, FAQ) — the marker is substituted for the real base path once, at the
 *  end of `scripts/renderPage.mjs`'s render functions. Never imported by the live
 *  SPA bundle. */
export function faqHref(lang: Lang, slug?: string): string {
  return slug ? `${BASE_MARKER}/${lang}/faq/${slug}/` : `${BASE_MARKER}/${lang}/faq/`;
}

export function calculatorHref(lang: Lang): string {
  return `${BASE_MARKER}/${lang}/calculator/`;
}

export function landingHref(lang: Lang): string {
  return `${BASE_MARKER}/${lang}/`;
}

export function assetHref(path: string): string {
  return `${BASE_MARKER}${path}`;
}

/** Used by the live calculator SPA (Footer, MobileProfile) instead of faqHref().
 *  The calculator always renders from /{lang}/calculator/ — two segments below site
 *  root (three under /preview/{lang}/calculator/) — so a path relative to the
 *  *current* page needs no base-path knowledge at all: "../faq/" reaches the
 *  sibling FAQ directory whether or not a /preview prefix sits in front of it. */
export const FAQ_HREF_FROM_CALCULATOR = '../faq/';

/** Same reasoning as FAQ_HREF_FROM_CALCULATOR, for the way home. The calculator used
 *  to *be* the site root, so its wordmark never needed to link anywhere; now that it
 *  lives at /{lang}/calculator/, "../" reaches its own language's landing page under
 *  any base path. */
export const LANDING_HREF_FROM_CALCULATOR = '../';

/** Substitutes the /en//pl/ segment in `pathname` for `lang`. Pure and idempotent:
 *  calling it with the language already present in `pathname` returns `pathname`
 *  unchanged — App.tsx's pushState effect relies on that no-op to avoid re-pushing
 *  the current URL (which would otherwise corrupt the browser history stack). */
export function nextLangPath(pathname: string, lang: Lang): string {
  return pathname.replace(/\/(en|pl)\//, `/${lang}/`);
}
