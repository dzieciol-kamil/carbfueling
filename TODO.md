# Open items — landing page restructure branch

Found during the `feat/landing-page-restructure` work and its reviews. None of these
block the design; all of them should be settled before the branch ships.

## Needs a decision from the rider

- [x] **`/en/` and `/en/calculator/` ship byte-identical `<title>` and `<meta description>`**
      (same for the Polish pair). Settled 2026-08-20: the landing keeps its product line
      unchanged, the calculator took a tool-shaped pair of its own — "Route sheet: bottles,
      gels, stops — Carb Fueling" / "Rozpiska na trasę: bidony, żele, postoje — Carb Fueling",
      with a description that states input and output. All four titles are now distinct.

- [x] **Polish pages carry an English JSON-LD `description`.** Fixed in the same pass: the
      `WebApplication` block in `build-static.mjs` now branches on `lang` (so `/pl/` is Polish
      and `/`, which reuses the EN landing, stays English), and `pl/calculator/index.html`
      carries the Polish sentence.

## Straightforward fixes

- [x] **The calculator is absent from `sitemap.xml`.** Fixed 2026-08-20: `writeSitemap` now
      receives `pages` plus a `calculatorHref()`-derived entry per language, so both calculator
      URLs are listed even though Vite, not this script, builds those pages. Priority is no
      longer flat either — landing `1.0`, calculator `0.9`, FAQ keeps `0.6` as the default.

- [x] **Redirect stubs carry no `canonical`, no `<title>`, no `<html lang>`.** Fixed in the
      same pass: `renderRedirectStub` now emits `<html lang="en">` (every retired path was
      English), a SITE-absolute canonical naming the target, and a `Moved — Carb Fueling`
      title for link unfurlers. Covered by a new test in `renderPage.test.mjs`.

- [x] **`noindex` and the sitemap gate use two spellings of one condition.** Collapsed to
      one `const isPreview = BASE !== ''`, used by both the sitemap gate and all three
      `noindex` call sites.

- [x] **`appStore.test.ts`'s two new merge tests call `vi.stubGlobal('document', …)` without
      `try/finally`.** Replaced by one `afterEach(() => vi.unstubAllGlobals())` on the describe
      block, so a failed assertion can no longer leak a stubbed `document` into later tests.

## Frozen

- **All four slides are signed off, desktop and phone — do not touch them.** As of
  2026-08-20 the freeze covers every slide and everything in it: layout, elements,
  colours, fonts, copy. Nothing there moves without asking first. Slide 1 additionally
  has a local tag, `landing-slide1-frozen`. The phone rules live in one shared
  `max-width: 760px` block, so any landing CSS edit reaches every slide at once —
  before committing one, diff against the tag:
  `git diff landing-slide1-frozen -- src/landing/` and re-check at phone width.

## Verification still owed

- [x] **The landing has been checked at phone width** (420px). It now has a purpose-built
      layout rather than a squeezed desktop one — see the commit. Two real defects surfaced
      and were fixed there: words glued together where a hidden `<br />` had been carrying the
      only space, and a wrapping header overflowing its fixed 61px bar.

- [x] **Checked between 760px and ~1100px**, 2026-08-20, both languages, all four slides plus
      the FAQ, measured in a fixed-width iframe. No horizontal overflow at any width and no
      vertical overflow down to 600px-tall viewports. Two real defects surfaced, both fixed:
      the header wrapped every element onto a second line between 761px and 778px (EN; PL
      stopped at 769px), which covers 768px — iPad portrait; and the closing slide's rider was
      cropped to a forearm on portrait tablets, because all four photographs are 1376×768 under
      `object-fit: cover`, so a 768×1024 window keeps only 45% of the frame against 96% on a
      laptop. See "Landing at tablet widths" below for what the fixes cost elsewhere.

- [x] **Whole-branch review re-run** against `master...HEAD` at high effort, 2026-08-20.
      0 Critical. Two Mediums (the language switch capturing the Back button; the persisted
      mobile sheets reopening on the next visit) and two Lows; three are fixed, the fourth is
      recorded under "Noted, not scheduled".

- [ ] **First push to `master` is a required live check on `/preview`.** The spec says the
      sub-path behaviour — relative links, redirects, base-prefixed assets — cannot be fully
      validated until it is actually deployed to GitHub Pages.

## Landing at tablet widths — what the two fixes changed

- The header now holds its line at every width: the wordmark and the CTA carry
  `white-space: nowrap` in their own styles, and between 761px and 800px the tagline drops,
  exactly as it already does on a phone. `renderPage.mjs` carries the same band so the FAQ
  header stays in step.
- The closing slide's backdrop takes its trim two parts right to one part left
  (`object-position: 33%`) while the window is narrower than the photograph's own 1376/768.
  The threshold has to sit there: an earlier cut-off at 5/4 made the frame lurch 59px as the
  window crossed 1156px. Because there is no horizontal trim left to place at 1376/768, the
  rule switching off is invisible, and the shift tapers off on its own as windows widen —
  0px at 1512×860 and 1920×1080, 11px at 1440×900, 41px at 1024×768, 163px at 768×1024.
  The phone keeps its own stronger 11.5% and is untouched.

## Noted, not scheduled

- Number fields render comma decimal separators (`8,4`, `0,16`) even in the English UI.
  Pre-existing app-level locale formatting, visible in the landing screenshots. Not caused
  by this branch.
- Boilerplate (CSP meta, `@font-face`, goatcounter, favicon/theme tags) is hand-duplicated
  across the two calculator entries and `renderPage.mjs`'s template. The ADR accepts this as
  a tracked follow-up. Checked during review: the three copies have **not** drifted yet.
- `Lang` is declared twice, in `src/urls.ts` and `src/i18n/strings.ts`. Structurally
  identical; a divergence would surface as a `tsc` error, never a runtime bug.
- **An explicit in-app language choice cannot survive re-entry through `/`.** `merge` lets the
  HTML-seeded language win over the persisted one (deliberate — otherwise a shared
  `/pl/calculator/` link would be overridden by a stored preference), while
  `public/lang-redirect.js` routes `/` on `navigator.language` alone. So a rider with a Polish
  browser who deliberately chose English is sent back to Polish every time they come in through
  the front door. Reviewed 2026-08-20 and left alone: both rules are individually right, the
  conflict is a design question, and every fix has a real cost — teaching the redirect script
  the store's persist schema, or reconstructing whether the URL was language-pinned after
  `location.replace` has already erased the evidence.
