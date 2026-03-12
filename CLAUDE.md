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
- Requires Node 22+ (use `nvm use 22`)

## Key Files
- `src/lib/timer.ts` — timer logic (stores, pure functions, sound effects)
- `src/lib/presets.ts` — built-in workout presets (EMOM6, EMOM10)
- `src/lib/components/` — ConfigCard, RulerPicker, CountdownDisplay, TotalTimeDisplay, PhaseHeader, VolumeControl, FullscreenButton, PresetList
- `src/routes/+page.svelte` — main page (layout, state, circular icon buttons, wake lock)
- `src/lib/timer.test.ts` — 105 unit tests
- `src/lib/presets.test.ts` — 6 preset validation tests
- `tests/timer.test.ts` — 61 e2e tests (Playwright)
- `documentation/` — detailed docs (timer engine, audio, slider scales, wake lock, design, presets)

## Timer Phases
- `getReady` (10s) → `work` → `rest` → `work` → ... → `finished`
- Sounds: bell on work start, descending chime on rest start, countdown dings at 5/4/3/2/1 (including during work when rest=0), fanfare on finish
- Pause/resume: subtle toggle sounds, tap screen to resume (no resume button)
- Background colors: getReady/rest = yellow `#FFBA08`, work = green `#2ECC71`, paused = black, finished = 3-color flash (red/yellow/green, 12s)
- Swipe back to work segment inserts a getReady countdown before it

## Deployment
- Production is deployed on the infra VM as part of its Docker Compose stack
- Push to `main` and redeploy the Docker Compose stack on the infra VM to update production
