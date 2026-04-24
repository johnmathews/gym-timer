# presets.yml Feature, iOS Swipe Fix & Runtime Preset Loading

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
- Rewrote `src/lib/presets.ts` to import from `$presets`, validate with `parsePresets()`, and export `DEFAULT_PRESETS`
- Added TypeScript declarations for `.yml` and `$presets` module imports

**Test isolation:** The `$presets` alias swaps to `tests/fixtures/presets.yml` when either `VITEST` or `TEST_PRESETS` env var is set. Vitest sets `VITEST` automatically; Playwright's webServer command sets `TEST_PRESETS=1`. This means editing the production `presets.yml` never breaks any tests.

### 3. Runtime Preset Loading

**Goal:** Allow presets to be changed on the infra VM without rebuilding or redeploying the Docker container.

**How it works:**
- On page load, the app fetches `/presets.yml` from the server
- If the server has a mounted config file (via Docker volume), those presets replace the build-time defaults
- If the fetch fails (404, parse error), the app silently uses compiled defaults
- No loading state — app renders instantly with defaults, swaps in runtime presets within milliseconds

**Key implementation details:**
- Added `js-yaml` as a runtime dependency for parsing YAML in the browser
- `fetchPresets()` in `presets.ts` does fetch → parse YAML → validate → return
- nginx.conf serves `/presets.yml` from `/config/presets.yml` with `no-store` caching
- Presets are reactive `$state` in `+page.svelte`, updated on mount

### 4. Docker Directory Mount Fix

**Problem:** Editing `presets.yml` on the infra VM host didn't reflect inside the container, even after page reload.

**Root cause:** Docker bind mounts of individual files use the file's inode. Text editors (vim, nano) create a new file with a new inode when saving, so the container's mount points to the old inode with stale content.

**Fix:** Changed from file mount (`./timer/presets.yml:/presets.yml`) to directory mount (`./timer:/config`). nginx now reads from `/config/presets.yml`. Directory mounts always reflect current file content regardless of inode changes.

### 5. Git Pre-Push Hook

Added a local pre-push hook (`.git/hooks/pre-push`) that runs lint and unit tests before every `git push`. Aborts the push if either fails. E2e tests are excluded (too slow for a hook — CI handles those). This hook is local-only and not tracked by git.

### 6. Test Coverage for New Features

Added tests that were missing for the session's changes:
- 6 unit tests for `fetchPresets()`: success, 404 fallback, network error, malformed YAML, invalid preset data, multiple presets
- 1 e2e test: home screen has `touch-action: pan-y` for iOS swipe compatibility

## Test Results

- Unit tests: 139 passed (was 121 at start of session)
- E2e tests: 89 passed (was 88 at start of session)
- Lint: 0 errors (31 pre-existing warnings)
- Build: successful
