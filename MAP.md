# MAP.md

Quick index of what lives where, so you don't have to search the whole tree first. See `CLAUDE.md` for
conventions/workflow and `README.md` for stack/dev commands. Sizes/dirs below are a snapshot — if something's
moved, trust the filesystem over this file and update it.

## Top level

- `src/` — app source (see below).
- `docs/` — **gitignored**, local-only spec/planning docs (see `docs/backlog.md` for open epics/ideas,
  `docs/adr/` for architecture decisions, `docs/superpowers/` for plans/specs, `docs/tests/` for autoplan
  scenario fixtures).
- `en/`, `pl/`, `de/`, `it/` — prerendered static output (e.g. `en/calculator/index.html`) committed by
  `scripts/build-static.mjs`, per ADR 0001 (language-prefixed static routing). Generated, but tracked in git.
- `public/` — static assets served as-is by Vite.
- `scripts/` — `dev.sh` (start dev server), `build-static.mjs` (prerender `en/`/`pl/`/`de/`/`it/`), `renderPage.mjs`.
- `.github/` — CI workflows.

## src/

- `App.tsx`, `main.tsx` — app entry/root.
- `urls.ts` — URL/route helpers (language-prefixed routing).
- `domain/` — **pure calculation logic, no React**, unit-tested (`*.test.ts` next to each file):
  - `fuel.ts` — supply/demand fueling math (the core model).
  - `autoplan/` — **autoplan v3** (greedy loop): `index.ts` (entry), `search.ts` (the only module
    that chooses), `layout.ts` (a decision → fills/stops), `spans.ts` (fill reach from the need
    curve), `score.ts` (distance to both green badges), `exhaustive.ts` (`improve()` — pruned
    exhaustive search yielding each strictly-better plan, for the thinking modal), `run.ts`
    (`runAutoplan()` — posts the climb then every `improve()` plan then `done`, engine exception
    or not; the framework-free body of the Worker below), `autoplan.worker.ts` (the Web Worker
    entry point the thinking modal's UI spawns — a thin `postMessage`/`onmessage` wrapper around
    `run.ts`, typed against only the slice of the worker global scope it uses since the app
    tsconfig has no WebWorker lib), `types.ts`;
    test-only `oracle.ts` + `oracleExpect.ts` (brute-force check of the search, run with
    `ORACLE=1`); `exhaustive.measure.test.ts` (timing probe for `improve()` on the 194km pacing
    ride, run with `MEASURE=1`).
  - `combinedRefill.ts` — combined stop/refill logic.
  - `printSheet.ts` — printable one-page plan (schedule strip + bottle recipes).
  - `gpx.ts` — GPX file parsing.
  - `dragMath.ts` — drag-and-drop geometry for lanes/timeline.
  - `laneLayout.ts` — lane layout calculations.
  - `settingsExport.ts` — settings import/export.
  - `sharePlan.ts` — encode/decode a plan into the `?p=` share link.
  - `shareSummary.ts` — the figures the share blurb/badge/chart PNG all quote.
  - `shareQr.ts` — QR module matrix for the share panel's image formats.
  - `types.ts` — shared domain types.
  - `__fixtures__/` — sample route data (e.g. `kielceMarkiEle.ts`) used by domain tests;
    `pacing194.ts` (route/mix/gear/foodLib/selection for the rider's 194km ride, shared by
    `autoplanPacing.test.ts` and `exhaustive.measure.test.ts`).
- `store/` — `appStore.ts` (zustand, single source of app state) + `persistStorage.ts`
  (localStorage persistence). No backend.
- `i18n/strings.ts` — **all** user-facing copy; don't inline strings in components.
- `components/` — organized by area:
  - `mobile/` — mobile app shell and screens (`MobileApp.tsx`, `MobilePlanCard.tsx`,
    `MobileRouteSheet.tsx`, `MobileMix.tsx`, etc.) — this is the primary UI surface.
  - `panels/` — desktop side panels (`RoutePanel.tsx`, `FoodPanel.tsx`, `GearPanel.tsx`,
    `MixPanel.tsx`, `SettingsPanel.tsx`, `PanelShell.tsx`).
  - `chart/` — the main fuel/elevation chart (`Chart.tsx`, `ElevationLayer.tsx`, `StopMarkers.tsx`, `theme.ts`).
  - `lanes/` — fill/food lane bars and drag handlers (`FillBar.tsx`, `FoodBar.tsx`, `dragHandlers.ts`).
  - `timeline/` — `TimelineSection.tsx`.
  - `recipes/` — `RecipesSection.tsx`.
  - `tour/` — onboarding tour overlay (`TourOverlay.tsx`, `tourSteps.ts`).
  - `print/` — printable plan sheet (`PrintSheet.tsx`, `PrintIcon.tsx`).
  - `share/` — share panel and the canvas renderer behind its PNG formats
    (`SharePanel.tsx`, `shareCanvas.ts`, `ShareIcon.tsx`).
  - `ui/` — generic reusable widgets (`ConfirmDialog.tsx`, `NumberInput.tsx`, `SegmentedControl.tsx`, etc.).
  - `Header.tsx`, `Footer.tsx`, `SummaryCards.tsx`, `FoodLibraryChips.tsx`, `RoutePanel.tsx`,
    `SharedPlanPrompt.tsx`, `usePlanFileTransfer.ts` — top-level shared components.
- `faq/` — FAQ pages (`FaqIndex.en/pl/de/it.tsx`, `FaqLayout.tsx`, `registry.ts`, `articles/`).
- `landing/` — marketing landing pages (`Landing.en/pl/de/it.tsx`, `SiteFooter.tsx`).
- `utils/` — `fileSave.ts`, `fileSystemAccess.d.ts`.
- `static/` — components shared by the prerendered static pages (`LangMenu.tsx`, `ThemeToggle.tsx`).
- `styles/`, `assets/` — CSS and static assets bundled into the app.

## Where to look for...

- Fueling math / carb-hydration calculations → `src/domain/fuel.ts`.
- Autoplan (auto-generate a fueling plan) → `src/domain/autoplan/` (v3); rules in
  `docs/autoplan-rules.md` (local, gitignored).
- App state / persistence → `src/store/appStore.ts`.
- Any user-visible text → `src/i18n/strings.ts`.
- Mobile UI → `src/components/mobile/`.
- Desktop UI → `src/components/panels/` + `src/components/chart/` + `src/components/lanes/`.
