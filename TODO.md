# Open items — landing page restructure branch

Found during the `feat/landing-page-restructure` work and its reviews. None of these
block the design; all of them should be settled before the branch ships.

## Needs a decision from the rider

- [ ] **`/en/` and `/en/calculator/` ship byte-identical `<title>` and `<meta description>`**
      (same for the Polish pair). Two indexable, self-canonical pages carrying the same
      metadata is the textbook near-duplicate signal — Google picks one and suppresses the
      other, and which one it picks is not ours to choose. On `master` that copy described
      exactly one URL; the restructure split it across two. Fix is copy, not code: keep the
      marketing line on the landing and give the calculator something tool-shaped
      ("Fueling calculator — enter your route, get a bottle-by-bottle plan"). Sources:
      `scripts/build-static.mjs` (landing title/description) and
      `en/calculator/index.html` / `pl/calculator/index.html`.

- [ ] **Polish pages carry an English JSON-LD `description`.** `pl/calculator/index.html`
      and the `WebApplication` block `build-static.mjs` emits for both landings. Worth doing
      in the same sitting as the item above, since it is the same content pass.

## Straightforward fixes

- [ ] **The calculator is absent from `sitemap.xml`.** The sitemap is built purely from
      `build-static.mjs`'s `pages` array, which holds landing + FAQ only; the calculator's two
      entries come from Vite and never enter it. On `master` the calculator _was_ the sitemap
      (the hardcoded `/` entry at priority 1.0 that the spec correctly deleted). Both URLs are
      internally linked so they will still be found, but the explicit signal is gone. Fix: push
      `/en/calculator/` and `/pl/calculator/` into the array `writeSitemap` receives — only
      `urlPath` is read. Consider also lifting the landing pages above the flat `0.6` priority,
      since `/en/` is the home page now.

- [ ] **Redirect stubs carry no `canonical`, no `<title>`, no `<html lang>`.**
      `scripts/renderPage.mjs`'s `renderRedirectStub`. The ADR accepts the retired `/faq/*`
      paths as a known SEO risk; a canonical pointing at the target and a title for
      link-unfurlers is cheap hardening well inside that decision.

- [ ] **`noindex` and the sitemap gate use two spellings of one condition** —
      `BASE !== ''` at `build-static.mjs:15` versus `!BASE` at the sitemap call. Equivalent
      today, but the spec was emphatic about this predicate for good reason. Collapse to a
      single `const isPreview`.

- [ ] **`appStore.test.ts`'s two new merge tests call `vi.stubGlobal('document', …)` without
      `try/finally`.** A failed assertion skips `vi.unstubAllGlobals()` and leaks a stubbed
      `document` into the rest of the file, turning one clean failure into a confusing cascade.
      `afterEach(() => vi.unstubAllGlobals())` is the usual shape.

## Verification still owed

- [ ] **The landing has never been looked at on a narrow viewport.** The mobile
      aspect-distortion bug is fixed structurally (all three screenshots share one sizing rule,
      so there is no per-image override left to fight), but that is reasoning, not evidence.
      The hand-set line breaks also switch off below 760px, and how those questions re-wrap
      on their own has not been seen.

- [ ] **Re-run the whole-branch review.** The last one returned 0 Critical, but it judged
      commit `44dcec5`; every landing commit since then is unreviewed.

- [ ] **First push to `master` is a required live check on `/preview`.** The spec says the
      sub-path behaviour — relative links, redirects, base-prefixed assets — cannot be fully
      validated until it is actually deployed to GitHub Pages.

## Noted, not scheduled

- Number fields render comma decimal separators (`8,4`, `0,16`) even in the English UI.
  Pre-existing app-level locale formatting, visible in the landing screenshots. Not caused
  by this branch.
- Boilerplate (CSP meta, `@font-face`, goatcounter, favicon/theme tags) is hand-duplicated
  across the two calculator entries and `renderPage.mjs`'s template. The ADR accepts this as
  a tracked follow-up. Checked during review: the three copies have **not** drifted yet.
- `Lang` is declared twice, in `src/urls.ts` and `src/i18n/strings.ts`. Structurally
  identical; a divergence would surface as a `tsc` error, never a runtime bug.
