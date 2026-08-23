# CLAUDE.md

Project-specific context for Claude Code sessions in this repo. See `README.md` for stack/dev commands.
See `MAP.md` for a quick index of what's where — check it before searching the tree.

## Running locally

```bash
scripts/dev.sh        # starts the Vite dev server in the background on :5173, logs to /tmp/carb-planner-dev.log
scripts/dev.sh 5174   # optional: pick a different port
```

If the port is already in use, the script prints the running server's URL instead of starting a second instance.

## Release process

- Pushing to `master` deploys a **preview** build to `/preview` on carbfueling.com (noindex). It does not touch production.
- Production (carbfueling.com root) only redeploys when a new `vX.Y.Z` git tag is pushed — bump `version` in `package.json`, commit, then tag and push the tag to release.
- So: routine commits/pushes to `master` are safe and don't need a version bump; only tag when you actually want to ship.
- To cut a release:
  1. Bump `version` in `package.json` (and `package-lock.json` stays in sync via `npm install`).
  2. Commit and push to `master`.
  3. `git tag vX.Y.Z && git push origin vX.Y.Z` — this alone triggers the production deploy.
  4. `gh release create vX.Y.Z --generate-notes` — creates the GitHub Release entry (separate from the tag; the deploy doesn't need it, but skipping it leaves the Releases page showing a stale "Latest").

## Code conventions

- `src/domain/` holds pure calculation logic (no React) — e.g. `fuel.ts` (supply/demand math), `gpx.ts` (GPX parsing), `dragMath.ts`, `laneLayout.ts`. Keep this layer framework-free and unit-tested (`*.test.ts` next to each file).
- `src/store/appStore.ts` (zustand) is the single source of app state, persisted to `localStorage` via `persistStorage.ts`. No backend.
- `src/components/` is organized by area: `mobile/`, `panels/`, `timeline/`, `lanes/`, `chart/`, `recipes/`, `tour/`, `ui/`.
- `src/i18n/strings.ts` holds all user-facing copy — don't inline strings in components.

## Working style

Behavioral guidelines to reduce common LLM coding mistakes, adopted from
[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) (derived from Andrej
Karpathy's observations on LLM coding pitfalls).

**Tradeoff:** these bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity first

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Do remove imports/variables/functions that _your_ changes made unused.

The test: every changed line should trace directly to the request.

### 4. Goal-driven execution

**Define success criteria. Loop until verified.**

Turn tasks into verifiable goals:

- "Add validation" → "write tests for invalid inputs, then make them pass"
- "Fix the bug" → "write a test that reproduces it, then make it pass"
- "Refactor X" → "ensure `npm test` passes before and after"

For multi-step tasks, state a brief plan — one line per step with its verification check. Weak criteria
("make it work") force constant clarification; strong ones let the loop run independently.

Here, "verified" means `npm test` (vitest) for logic and `npx tsc -b` for types; use the browser only for
rendering, layout, and CSS questions that tests can't answer.
