# presets.yml Feature & iOS Swipe Bug Fix

## Date: 2026-04-24

## Changes

### 1. iOS Swipe Bug Fix

**Problem:** Preset cycling via swipe worked on desktop (arrow keys) but not on iOS touch. The dots indicator showed multiple presets were available, but swiping did nothing.

**Root cause:** The `.home` div in `+page.svelte` used `onpointerdown`/`onpointerup` for swipe detection but lacked a `touch-action` CSS property. Without it, iOS Safari interprets horizontal swipes as potential browser navigation gestures and doesn't deliver pointer events properly. The `.active-screen` (running timer) already had `touch-action: none` and worked fine.

**Fix:** Added `touch-action: pan-y` to the `.home` CSS rule. This tells the browser to handle vertical scrolling normally but let JS handle horizontal swipes.

### 2. presets.yml Feature

**Goal:** Move preset definitions from TypeScript code (`src/lib/presets.ts`) to a YAML file (`presets.yml`) at the project root, so presets can be edited without touching code.

**Implementation:**
- Created `presets.yml` at project root with EMOM and Intervals presets
- Installed `@modyfi/vite-plugin-yaml` to transform YAML imports into JS at build time
- Added `$presets` Vite alias in `vite.config.ts` that resolves to the correct YAML file:
  - Production: `presets.yml`
  - Tests (vitest/playwright): `tests/fixtures/presets.yml`
- Rewrote `src/lib/presets.ts` to import from `$presets`, validate with `parsePresets()`, and export `PRESETS`
- Added TypeScript declarations for `.yml` and `$presets` module imports

**Test isolation:** The `$presets` alias swaps to `tests/fixtures/presets.yml` when either `VITEST` or `TEST_PRESETS` env var is set. Vitest sets `VITEST` automatically; Playwright's webServer command sets `TEST_PRESETS=1`. This means editing the production `presets.yml` never breaks any tests.

## Test Results

- Unit tests: 133 passed (was 121 — added 12 new `parsePresets` validation tests)
- E2e tests: 88 passed (unchanged)
- Lint: 0 errors (31 pre-existing warnings)
- Build: successful

## Files Changed

- `presets.yml` — new, preset definitions
- `tests/fixtures/presets.yml` — new, test fixture presets
- `src/lib/presets.ts` — rewritten to import from YAML
- `src/lib/presets.test.ts` — rewritten with parsePresets tests + fixture validation
- `src/yml.d.ts` — new, TypeScript declarations for YAML imports
- `vite.config.ts` — added YAML plugin and `$presets` alias
- `playwright.config.ts` — added `TEST_PRESETS=1` to build command
- `src/routes/+page.svelte` — added `touch-action: pan-y` to `.home` CSS
- `package.json` — added `@modyfi/vite-plugin-yaml` dependency
- `CLAUDE.md` — updated key files section
- `docs/presets.md` — rewritten for YAML-based preset system
