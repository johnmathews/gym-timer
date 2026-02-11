# Gym Timer

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
- `src/lib/timer.ts` — timer logic (stores + pure functions)
- `src/lib/components/` — DurationPicker, CountdownDisplay, TimerControls
- `src/routes/+page.svelte` — main page
- `src/lib/timer.test.ts` — unit tests
- `tests/timer.test.ts` — e2e tests (Playwright)
