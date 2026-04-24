# Built-in Workout Presets

## Status

Presets are **active** — users cycle through them on the home screen by swiping left/right (touch) or pressing Left/Right arrow keys (desktop). The preset list wraps around in both directions. A dot indicator below the config cards shows which preset is active.

## Presets

Presets are defined in `presets.yml` at the project root. Each preset has a name, work duration (seconds), rest duration (seconds), and rep count:

```yaml
- name: EMOM
  work: 60
  rest: 0
  reps: 10

- name: Intervals
  work: 30
  rest: 15
  reps: 10
```

The first preset is loaded by default on page load. All values should be within slider ranges (work 5-600s, rest 0-300s, reps 1-20) and aligned to the 5-second step grid for full slider compatibility.

## Architecture

### Build-Time Defaults

1. **`presets.yml`** (project root) — default preset definitions compiled into the JS bundle
2. **`@modyfi/vite-plugin-yaml`** — Vite plugin that transforms YAML imports into JS objects at build time
3. **`$presets` alias** (vite.config.ts) — resolves to `presets.yml` in production or `tests/fixtures/presets.yml` during tests
4. **`src/lib/presets.ts`** — imports via `$presets`, validates with `parsePresets()`, exports `DEFAULT_PRESETS`

### Runtime Override

On page load, the app fetches `/presets.yml` from the server. If a valid YAML file is served (e.g., from a Docker volume mount), those presets replace the build-time defaults. If the fetch fails (404, parse error), the app silently uses the compiled defaults.

- **`fetchPresets()`** in `src/lib/presets.ts` — fetches `/presets.yml`, parses with `js-yaml`, validates with `parsePresets()`
- **nginx.conf** — `location = /presets.yml` serves `/config/presets.yml` with `no-store` caching

### Docker Deployment

Mount a **directory** containing `presets.yml` to `/config/` in the container:

```yaml
volumes:
  - ./timer:/config
```

**Important:** Mount the directory, not the file directly. Docker bind mounts of individual files don't update when the host file is edited — most editors create a new inode, breaking the bind mount. Directory mounts always reflect the current file content.

### `src/lib/presets.ts`

- `Preset` interface: `{ name, work, rest, reps }`
- `parsePresets(data)` — validates and returns typed presets from raw YAML data. Checks types, non-empty array, positive integers, etc.
- `DEFAULT_PRESETS` — build-time preset array, compiled from `presets.yml`
- `fetchPresets()` — async function that fetches runtime presets from the server

### Cycling Logic (`src/routes/+page.svelte`)

- `presets` reactive state, initialized with `DEFAULT_PRESETS`, updated on mount if runtime fetch succeeds
- `presetIndex` state tracks the current preset (starts at 0)
- `applyPreset(index)` sets `duration`, `rest`, `reps` from the preset and calls `timer.configure()`
- `cyclePreset(direction)` increments/decrements the index with modular wrapping
- Home screen swipe handling uses pointer events (50px threshold) with `touch-action: pan-y` on the `.home` element for iOS compatibility
- Left/Right arrow keys cycle presets when `$status === "idle"` and no picker is open
- Config cards, toolbar, and buttons are excluded from swipe detection

### Dot Indicator

- Rendered inside `.cards` div, below the Repeat card
- Each dot is a `<span class="dot">` — active dot is brighter (`rgba(255,255,255,0.85)`) vs inactive (`rgba(255,255,255,0.25)`)
- Dots use CSS transition for smooth visual feedback

## Test Isolation

Tests use a separate `tests/fixtures/presets.yml` instead of the real `presets.yml`, so editing the production presets file never breaks tests:

- **Vite alias**: `$presets` points to `tests/fixtures/presets.yml` when `VITEST` or `TEST_PRESETS` env var is set
- **Unit tests**: run under vitest (sets `VITEST` automatically)
- **E2e tests**: playwright.config.ts builds with `TEST_PRESETS=1`

## Test Coverage

- **Unit tests** (`src/lib/presets.test.ts`): `parsePresets()` validation (valid data, missing fields, bad types, empty arrays), plus fixture validation (slider ranges, 5s grid, unique combinations, expected defaults)
- **E2E tests** (`tests/timer.test.ts`): arrow key cycling, wraparound, dot indicator state updates
