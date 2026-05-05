# Timer

## Code Style
- Use spaces, not tabs, for indentation

## Tech Stack
- SvelteKit with `adapter-static` (static output in `build/`)
- Svelte 5 (uses runes: `$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- TypeScript, Vite 7, Vitest 4, Playwright

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test:unit` — run unit tests (vitest)
- `npx playwright test` — run e2e tests
- `npm run lint` — run ESLint
- Requires Node 22+ (use `nvm use 22`)

## Key Files
- `presets.yml` — workout preset definitions (name, work, rest, reps); build-time defaults + runtime override via Docker mount
- `src/lib/timer.ts` — timer logic (stores, pure functions, sound effects)
- `src/lib/presets.ts` — exports `DEFAULT_PRESETS` (build-time), `fetchPresets()` (runtime from `/presets.yml`), `parsePresets()` (validation)
- `src/lib/components/` — ConfigCard, RulerPicker, CountdownDisplay, TotalTimeDisplay, PhaseHeader, VolumeControl, FullscreenButton, PresetList, KeyboardShortcuts
- `src/routes/+page.svelte` — main page (layout, state, circular icon buttons, wake lock)
- `src/lib/timer.test.ts` — 133 unit tests
- `src/lib/presets.test.ts` — 24 preset/parsePresets/fetchPresets tests
- `tests/timer.test.ts` — 92 e2e tests (Playwright)
- `tests/fixtures/presets.yml` — test preset fixture (isolates tests from production presets.yml changes)
- `docs/` — detailed docs (timer engine, audio, slider scales, wake lock, design, presets)

## Timer Phases
- `getReady` (10s) → `work` → `rest` → `work` → ... → `finished`
- Sounds: bell on work start, descending chime on rest start, countdown dings at 5/4/3/2/1 (including during work when rest=0), fanfare on finish
- Pause/resume: subtle toggle sounds, tap screen to resume (no resume button)
- Background colors: getReady/rest = yellow `#FFBA08`, work = green `#2ECC71`, paused = black, finished = 4-color flash (red/yellow/green/cyan, ~11.5s)
- Swipe back to work segment inserts a getReady countdown before it
- Desktop keyboard shortcuts: Space/Enter (play/pause/resume), Left/Right (skip segment when active, cycle preset when idle), Up/Down (add/remove rep), R (restart workout), H (home when paused/finished), F (fullscreen), Esc (close overlay/home from any workout state), ? (shortcuts help modal)
- Home screen preset cycling: swipe left/right (touch) or Left/Right arrow keys (desktop) to cycle through presets with dot indicator

## Presets
- Build-time defaults from `presets.yml` are compiled into the JS bundle via `@modyfi/vite-plugin-yaml`
- At runtime, the app fetches `/presets.yml` from the server; if a mounted config exists, it overrides defaults
- Docker deployment: mount the directory containing `presets.yml` to `/config/` (not a single file — inode issues)
- Edit the file on the host and reload the page to update presets without redeploying

## Deployment
- Production is deployed on the infra VM as part of its Docker Compose stack
- Push to `main` and redeploy the Docker Compose stack on the infra VM to update production
