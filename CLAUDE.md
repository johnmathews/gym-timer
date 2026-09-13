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
- `src/lib/timer.ts` — timer logic (stores, pure functions, sound effects)
- `src/lib/presetStore.ts` — on-device presets: `loadPresets()` / `savePresets()` (localStorage) plus pure add/update/rename/remove/move operations
- `src/lib/components/` — ConfigCard, RulerPicker, CountdownDisplay, TotalTimeDisplay, PhaseHeader, VolumeControl, FullscreenButton, PresetList, KeyboardShortcuts
- `src/routes/+page.svelte` — main page (layout, state, circular icon buttons, wake lock)
- `src/lib/timer.test.ts` — 133 unit tests
- `src/lib/presetStore.test.ts` — preset store unit tests
- `tests/timer.test.ts` — 92 e2e tests (Playwright)
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
- Presets live only on the device, in `localStorage` key `timer-presets` (versioned JSON envelope); see `docs/presets.md`
- `savePresets()` returns `{ ok, error }` and never fails silently; callers keep their previous state and show the error
- The app ships with no presets; with none, the cards show the defaults (1:00 / 0:00 / x10)
- E2e tests seed presets by writing `timer-presets` in `page.addInitScript` before `page.goto`

## Deployment
- Production is deployed on the infra VM as part of its Docker Compose stack
- Push to `main` and redeploy the Docker Compose stack on the infra VM to update production
