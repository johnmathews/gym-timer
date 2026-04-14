# Built-in Workout Presets (Mothballed)

## Status

Presets are currently **mothballed** — the preset data and component files still exist in the codebase (`src/lib/presets.ts`, `src/lib/components/PresetList.svelte`) but are not imported or rendered in the UI. They may be brought back in a future iteration.

The default workout is now EMOM10: 10 reps, 60s work, 0s rest (hardcoded in `+page.svelte`).

## Presets

| Name | Work | Rest | Reps |
|------|------|------|------|
| EMOM6 | 1:00 | 0:00 | 6 |
| EMOM10 | 1:00 | 0:00 | 10 |

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

## Test Coverage

- **Unit tests** (`src/lib/presets.test.ts`): validates all preset values are within slider ranges, on the 5s grid, unique names, non-empty
