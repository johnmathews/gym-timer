# Built-in Workout Presets

## Status

Presets are **active** — users cycle through them on the home screen by swiping left/right (touch) or pressing Left/Right arrow keys (desktop). The preset list wraps around in both directions. A dot indicator below the config cards shows which preset is active.

## Presets

| # | Work | Rest | Reps | Total Time |
|---|------|------|------|------------|
| 1 | 1:00 | 0:00 | 10   | 10:00      |
| 2 | 0:30 | 0:15 | 10   | 7:15       |

Presets have no names — they are identified by position only. The first preset is loaded by default on page load.

All values are within slider ranges (work 5–600s, rest 0–300s, reps 1–20) and aligned to the 5-second step grid.

## Architecture

### Data (`src/lib/presets.ts`)

- `Preset` interface: `{ work, rest, reps }`
- `PRESETS` array: exported list of built-in presets

### Cycling Logic (`src/routes/+page.svelte`)

- `presetIndex` state tracks the current preset (starts at 0)
- `applyPreset(index)` sets `duration`, `rest`, `reps` from the preset and calls `timer.configure()`
- `cyclePreset(direction)` increments/decrements the index with modular wrapping
- Home screen swipe handling uses pointer events (same 50px threshold as active screen)
- Left/Right arrow keys cycle presets when `$status === "idle"` and no picker is open
- Config cards, toolbar, and buttons are excluded from swipe detection

### Dot Indicator

- Rendered inside `.cards` div, below the Repeat card
- Each dot is a `<span class="dot">` — active dot is brighter (`rgba(255,255,255,0.85)`) vs inactive (`rgba(255,255,255,0.25)`)
- Dots use CSS transition for smooth visual feedback

## Test Coverage

- **Unit tests** (`src/lib/presets.test.ts`): validates preset values are within slider ranges, on 5s grid, unique combinations, first preset matches defaults
- **E2E tests** (`tests/timer.test.ts`): arrow key cycling, wraparound, dot indicator state updates
