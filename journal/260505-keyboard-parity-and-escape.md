# Space/Enter parity audit + Escape goes home from any workout

## Trigger
After yesterday's "Enter mirrors Space" change, John reported it as "a disaster" —
the parity wasn't actually proven, and Escape behaviour during an active or paused
workout was wrong. Two follow-ups:

1. Make Space and Enter truly interchangeable in every state, with tests that
   prove cross-key sequences (Space pause → Enter resume, etc).
2. Pressing `Escape` in the middle of a workout (running, paused, or finished)
   should return to the home screen.

## Code changes
`src/routes/+page.svelte` — Escape handler now resets when `isActive || isFinished`,
not only when `isFinished`. Picker and shortcuts-modal close paths are unchanged
and still take precedence.

The play/pause branch already routed both `" "` and `"Enter"` through one
`isPlayPauseKey` boolean, so no source change was needed for parity itself —
only proof.

## Tests
- Replaced two e2e tests that previously asserted the wrong behaviour:
  - `Escape does nothing while timer is running` → `Escape returns to home while timer is running`
  - `Escape does nothing while timer is paused` → `Escape returns to home while timer is paused`
- Added four cross-key/parity e2e tests:
  - `Space pause then Enter resume (cross-key parity)`
  - `Enter pause then Space resume (cross-key parity)`
  - `Enter is ignored when picker is open (parity with Space)`
  - `Enter does nothing when finished (parity with Space)`

Final e2e suite: 104 passed. Unit tests: 157 passed. Lint clean.

## Visual verification
Used Playwright MCP against a local preview build:
- `?` opens modal showing `Space Enter` chips on a single row, and an updated
  `Esc` row reading "Close overlay / Home from any workout".
- Pressed Space (start) → Space (pause, screen turns black) → Enter (resume,
  yellow getReady screen) → Escape (home screen with Work/Rest/Repeat cards).

## Docs
- `docs/design.md` — keyboard table updated; Escape behaviour-by-context table
  rewritten; added a paragraph stating Space and Enter are fully interchangeable
  with no exceptions.
- `CLAUDE.md` — Esc shortcut description updated to "home from any workout state".
- `KeyboardShortcuts.svelte` — Space and Enter collapsed onto one row sharing
  the action, making the parity self-evident in the UI. Added a small `.keys`
  flex wrapper class for the kbd group.
