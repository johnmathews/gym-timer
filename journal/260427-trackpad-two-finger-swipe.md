# 2026-04-27 — Trackpad 2-finger swipe on home screen

## Context

On a laptop without a touchscreen, the home-screen preset carousel was only reachable via the Left/Right arrow keys. The user wanted a trackpad gesture too. A true 3-finger swipe is not feasible in a regular webapp on macOS — the OS captures it before the browser sees it (mapped by default to "Swipe between pages" / browser back/forward) — and there is no standard web API for trackpad multi-finger gestures. The closest input the browser does receive is a 2-finger horizontal swipe, which fires `wheel` events with non-zero `deltaX`.

## Implementation

- New `handleHomeWheel` listener on the `.home` div in `src/routes/+page.svelte`.
- Vertical-dominant gestures (`|deltaY| >= |deltaX|`) are ignored so normal scrolling still works.
- Horizontal-dominant gestures call `preventDefault()` (suppresses Mac browser history-swipe) and accumulate `deltaX` into `wheelAccumX`.
- When `|wheelAccumX| > 60`, fire a single `cyclePreset(±1)` and set `wheelLocked = true`. A 150ms idle timer (refreshed on every wheel event) resets both the accumulator and the lock when the gesture ends. This gives "one swipe = one preset change" without retriggering on the same burst.

## Direction convention

Matches the touch drag-to-pan convention (and the regression test from `260424-reverse-home-swipe-direction.md`): physical finger-right advances to the next preset.

With macOS natural scrolling on (the default), 2-finger swipe right produces `deltaX < 0`, so the mapping is:

- `deltaX < 0` → `cyclePreset(1)` (next)
- `deltaX > 0` → `cyclePreset(-1)` (previous)

If a user has natural scrolling disabled the direction will feel inverted; we accept that trade-off rather than maintain a setting toggle.

## Tests

Three new e2e tests in `tests/timer.test.ts` driving `page.mouse.wheel(deltaX, deltaY)`:

1. `deltaX < 0` (finger-right) cycles to next preset.
2. `deltaX > 0` (finger-left) cycles to previous preset (wraps to last).
3. Vertical-only wheel does nothing — confirms vertical scroll is not hijacked.

All 95 e2e tests and 157 unit tests pass.

## Docs

- `docs/design.md` Preset Cycling section: added trackpad row; corrected the stale "swipe left = next" line that contradicted the existing regression test.
