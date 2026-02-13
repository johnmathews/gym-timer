# Built-in Workout Presets

## Overview

The app includes built-in workout presets that populate all three sliders (work, rest, repeats) with a single tap. Users can select a preset and then adjust values if needed before starting.

## Presets

| Name | Work | Rest | Reps |
|------|------|------|------|
| EMOM | 0:40 | 0:20 | 10 |
| 30/30 | 0:30 | 0:30 | 6 |
| Endurance | 1:00 | 0:30 | 5 |
| Long Sets | 2:00 | 1:00 | 3 |
| Stretch | 0:30 | 0:05 | 6 |

All values are within slider ranges (work 5–600s, rest 0–300s, reps 1–10) and aligned to the 5-second step grid.

## Architecture

### Data (`src/lib/presets.ts`)

- `Preset` interface: `{ name, work, rest, reps }`
- `PRESETS` array: exported list of built-in presets

### Component (`src/lib/components/PresetList.svelte`)

- Full-screen fixed overlay (same pattern as RulerPicker: `position: fixed; inset: 0; z-index: 100; background: #000`)
- Content constrained to same max-width as the main app (500px mobile, 640px desktop)
- Props: `presets`, `onselect(preset)`, `onclose()`
- Each preset shown as a button with name on the left and summary (`0:40 / 0:20 / x10`) on the right
- Cancel button at the bottom closes the overlay without changes

### Integration (`src/routes/+page.svelte`)

- Presets button (hamburger/list icon) sits in the idle toolbar between Fullscreen and Volume
- `showPresets` state controls overlay visibility
- Selecting a preset sets `duration`, `rest`, `reps`, calls `timer.configure()`, and closes the overlay
- The idle screen condition also checks `!showPresets` to hide config cards while the overlay is open

## Test Coverage

- **Unit tests** (`src/lib/presets.test.ts`): validates all preset values are within slider ranges, on the 5s grid, unique names, non-empty
- **E2e tests** (`tests/timer.test.ts`): button visibility, overlay open/close, preset selection populating sliders, total time update, starting timer after preset
