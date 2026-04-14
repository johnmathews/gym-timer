# Mothball Presets, Default Update, R Hotkey, and Sizing Fixes

**Date:** 2026-04-14

## Summary

Five changes to simplify the UI and improve the workout experience:

1. **Mothballed presets** — removed the preset button and overlay from the main page. The preset data files (`presets.ts`, `PresetList.svelte`) are kept in the codebase for potential future use. The presets hamburger button is gone from the home screen toolbar, leaving only fullscreen and volume controls.

2. **Default workout changed to EMOM10** — reps default changed from 6 to 10 (60s work, 0s rest, 10 reps = 10:00 total). This matches the most common usage pattern.

3. **R hotkey to restart workout** — pressing R (case-insensitive) during any active workout state (running, paused, or finished) resets and immediately restarts the workout. Does nothing from the home screen. Added to the keyboard shortcuts modal as "Restart workout".

4. **Larger desktop toolbar icons** — home screen toolbar icons increased from 36px to 48px on desktop (≥1024px). Active-screen toolbar icons remain at 36px.

5. **Phase-label matches rep-counter size** — the phase label ("Get Ready!", "Work", "Rest", "Well Done!") now uses the same font-size as the rep counter ("1/10") at all breakpoints: 1.95rem on mobile, 2.6rem on desktop (≥768px).

## Test Changes

- Removed 8 preset-related e2e tests
- Added 4 R hotkey e2e tests (restart active, restart paused, case-insensitive, no-op on idle)
- Updated default value assertions (x6 → x10, 6:00 → 10:00)
- Final count: 115 unit tests, 82 e2e tests — all passing

## Files Changed

- `src/routes/+page.svelte` — removed preset imports/state/handler/button, changed default reps, added R hotkey
- `src/lib/components/PhaseHeader.svelte` — matched phase-label to rep-counter font-size
- `src/lib/components/KeyboardShortcuts.svelte` — added R shortcut row
- `tests/timer.test.ts` — updated defaults, removed preset tests, added R hotkey tests
- `docs/design.md`, `docs/presets.md`, `CLAUDE.md` — updated to reflect changes
