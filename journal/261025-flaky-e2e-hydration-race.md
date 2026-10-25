# Flaky E2e Test: Clicks Before Hydration

**Date:** 2026-10-25

## Summary

Issue #17: "Space and arrows are ignored when picker is open" failed once on `main` (run 40171645452, attempt 1). The click on the Work card succeeded, then `ruler-picker` never appeared. A re-run passed. Since #16 a red `test` job blocks the image publish, and the home server auto-deploys `:latest`, so a flake now blocks a deploy.

## Root cause

The page is prerendered (`adapter-static`, `prerender = true`). The HTML already holds the config cards, but SvelteKit hydrates afterwards: the inline bootstrap `import()`s the entry chunks and then runs `kit.start`, and neither delays the `load` event that `page.goto` waits for. A Playwright click in that gap passes every actionability check, lands on a button with no handler, and does nothing. Nothing about the failing test was special: almost every test clicks straight after `goto`, so which one loses the race on a slow runner is chance.

Reproduced on demand by delaying `/_app/immutable/*.js` by 1.5 s with `page.route` and clicking right after `goto`: the same `element(s) not found` as CI.

## Fix

- `src/routes/+layout.svelte` sets `<html data-hydrated>` in `onMount`. A layout's `onMount` runs after its page has mounted, so the attribute means the handlers are live.
- `tests/fixtures.ts` extends Playwright's `page` so `goto` and `reload` wait for that attribute. `tests/timer.test.ts` imports `test`/`expect` from it, so every existing and future test gets the wait without touching a call site.
- New test, "navigation waits for hydration even when the JS is slow", delays the JS by 1 s. It passes with the fixture and fails with the wait removed, with the CI error.

No retries were added: the cause is in the tests, not outside them, and a retry would only hide the next race.

## Verification

- With every JS chunk delayed 500 ms (a temporary edit, not committed), the full suite passed: 142 of 142.
- CI: several consecutive green runs on the PR; see the PR for the run IDs.
