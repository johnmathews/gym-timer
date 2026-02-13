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
- `src/lib/components/` — ConfigCard, RulerPicker, CountdownDisplay, TotalTimeDisplay, PhaseHeader, VolumeControl, FullscreenButton
- `src/routes/+page.svelte` — main page (layout, state, circular icon buttons, wake lock)
- `src/lib/timer.test.ts` — 68 unit tests
- `tests/timer.test.ts` — 40 e2e tests (Playwright)
- `documentation/` — detailed docs (timer engine, audio, slider scales, wake lock, design)

## Timer Phases
- `getReady` (5s) → `work` → `rest` → `work` → ... → `finished`
- Sounds: bell on work start, descending chime on rest start, fanfare on finish
- Background colors: getReady/rest = yellow `#FFBA08`, work = green `#2ECC71`, paused = black, finished = black/white flash (3s)
