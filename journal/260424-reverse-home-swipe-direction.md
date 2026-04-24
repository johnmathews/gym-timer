# Reverse Home Screen Swipe Direction for Preset Cycling

## Date: 2026-04-24

## Problem

On iOS, swiping left/right on the home screen to cycle through presets moved in the wrong
direction. The mapping was inverted relative to the iOS convention (where swiping left reveals
the next item, like swiping between home screen pages).

## Fix

Swapped the `cyclePreset()` direction arguments in `handleHomePointerUp()` in
`src/routes/+page.svelte`:

- Swipe left (`deltaX < 0`) now calls `cyclePreset(-1)` (previous) instead of `cyclePreset(1)`
- Swipe right (`deltaX > 0`) now calls `cyclePreset(1)` (next) instead of `cyclePreset(-1)`

Desktop keyboard arrows (ArrowLeft = previous, ArrowRight = next) were already correct and
unchanged.

## Test Results

- Unit tests: 139 passed
- E2e tests: 89 passed
- Lint: 0 errors (31 pre-existing warnings)
