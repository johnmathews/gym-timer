# Enter key mirrors Space

## Change
Made the `Enter` (Return) key behave identically to `Space` for play/pause/resume in
the desktop keyboard handler in `src/routes/+page.svelte`. Both keys now trigger:
- Start the timer when on the idle home screen and a workout is configured.
- Pause a running timer.
- Resume a paused timer.

All other modes (picker open, finished screen reset, etc.) follow the same rules
that already applied to Space — no new behavior, just a second binding.

## Why
Some users (and external keypad/clicker hardware) map the primary "go" button to
Enter rather than Space. Rather than guess intent, accept either.

## Implementation note
Replaced the two `e.key === " "` checks with a small `isPlayPauseKey` boolean
covering both `" "` and `"Enter"`. No other branches needed updating; arrow keys,
modal escape, mute, fullscreen etc. were already independent.

## Docs / help modal
- `KeyboardShortcuts.svelte` now lists `Enter` alongside `Space`.
- `docs/design.md` keyboard shortcut table updated.
- `CLAUDE.md` shortcuts line updated to `Space/Enter`.

## Tests
Added three Playwright tests in `tests/timer.test.ts`:
- `Enter starts timer from idle screen`
- `Enter pauses a running timer`
- `Enter resumes a paused timer`

The existing `? opens keyboard shortcuts modal` test had to be tweaked
(`getByText("Pause / Resume").first()`) because the modal now contains two rows
that share the "Play / Pause / Resume" label.

Full e2e run: 100 passed. Unit tests: 157 passed. Lint clean.
