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
- Production (carbfueling.com root) only redeploys when a `vX.Y.Z` git tag exists — master alone never touches it.
- So: routine commits/pushes to `master` are safe and don't need a version bump; only release when you actually want to ship.
- To cut a release: run the **Release** workflow from the Actions tab (`Actions → Release → Run workflow`) with the version as a bare semver string, e.g. `1.20.0`. It does everything:
  1. Validates the input and refuses a version whose tag already exists.
  2. Bumps `version` in `package.json`/`package-lock.json` and pushes that to `master` — skipped when master already carries that version (the usual case when the bump was committed by hand).
  3. Gates on a green build (`npm ci`, `npx tsc -b --noEmit`, `npm test`, `npm run build`) before tagging, so a broken master can't become a release.
  4. Creates and pushes the annotated tag `vX.Y.Z` and the GitHub Release (`--generate-notes`).
  5. Runs the production + preview deploy.
- The deploy runs as a `workflow_call` job inside the release run rather than via the tag-push trigger: a tag pushed by a workflow using `GITHUB_TOKEN` doesn't start new workflow runs, so relying on `deploy.yml`'s `on: push: tags` there would leave production stale. See the comments in `.github/workflows/release.yml` before changing that.
- Tagging by hand (`git tag vX.Y.Z && git push origin vX.Y.Z`) still works and still triggers `deploy.yml` — the workflow is just the supported path.

## Code conventions

- `src/domain/` holds pure calculation logic (no React) — e.g. `fuel.ts` (supply/demand math), `gpx.ts` (GPX parsing), `dragMath.ts`, `laneLayout.ts`. Keep this layer framework-free and unit-tested (`*.test.ts` next to each file).
- `src/store/appStore.ts` (zustand) is the single source of app state, persisted to `localStorage` via `persistStorage.ts`. No backend.
- `src/components/` is organized by area: `mobile/`, `panels/`, `timeline/`, `lanes/`, `chart/`, `recipes/`, `tour/`, `print/`, `ui/`.
- `src/i18n/strings.ts` holds all user-facing copy — don't inline strings in components.
- `MAP.md` is a hand-maintained index and goes stale fast. When a change adds, removes, renames, or moves a file/directory under `src/` (or another top-level dir `MAP.md` describes), update the relevant `MAP.md` entry in the same commit.

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
