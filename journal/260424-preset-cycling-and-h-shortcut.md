# Preset Cycling on Home Screen + H Keyboard Shortcut

## What Changed

Brought presets back to life in a new form. Instead of the old preset list overlay (mothballed
in the 260414 session), presets are now cycled through by swiping left/right on the home screen
(touch devices) or pressing Left/Right arrow keys (desktop). A dot indicator below the config
cards shows which preset is active.

Two presets for now:
1. Work 60s, Rest 0s, Reps 10 (EMOM — the previous hardcoded default)
2. Work 30s, Rest 15s, Reps 10 (interval training)

Also added H as a keyboard shortcut to go home from paused or finished states.

## Implementation Details

- `src/lib/presets.ts` — Simplified the `Preset` interface (removed `name` field, presets are
  position-identified). Updated the preset array with the two configurations.
- `src/routes/+page.svelte` — Added `presetIndex` state, `applyPreset()`/`cyclePreset()` functions,
  separate pointer event handlers for the home screen (excludes buttons, toolbar, config cards from
  swipe capture), Left/Right arrow key handling when idle, H key shortcut, and dot indicator UI.
- `src/lib/components/KeyboardShortcuts.svelte` — Added H shortcut entry, updated arrow key
  descriptions to mention preset cycling.
- Home screen swipe uses the same 50px threshold and pointer capture pattern as the active screen.
- Arrow keys serve dual purpose: cycle presets when idle, skip segments when active. The idle check
  runs first in the handler chain.

## Key Decisions

- **No preset names** — with only 2-4 presets, the dot indicator is sufficient. Names can be added
  later if the list grows.
- **Manual changes discarded on swipe** — simpler mental model. Swiping always loads the clean preset.
- **H doesn't change Escape behavior** — Escape still only works when finished (not paused). H works
  for both paused and finished, giving a dedicated "go home" key.
- **Separate pointer handlers** for home vs active screen, rather than a shared handler with branching,
  to keep the logic clean and avoid accidental interactions.

## Tests

- Updated `src/lib/presets.test.ts` — removed name-based tests, added uniqueness and default-match tests
- Added 7 new e2e tests: arrow key cycling (left, right, wraparound), dot indicator state, H key from
  finished/paused/running states
- Final counts: 121 unit tests, 88 e2e tests (all passing)

## CI/CD

- Added `workflow_dispatch` trigger to the Docker workflow for manual re-runs.
