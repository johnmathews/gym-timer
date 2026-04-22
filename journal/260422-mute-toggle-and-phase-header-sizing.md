# Mute Toggle and PhaseHeader Sizing

## Changes

### Mute toggle (M key)
- Added `toggleMute()` to `timer.ts` — saves pre-mute volume, sets to 0 on mute, restores on unmute
- Falls back to `DEFAULT_VOLUME` if user manually set volume to 0 before muting
- M keyboard shortcut added to `+page.svelte`, works from any screen
- `VolumeControl` gains a `syncTrigger` prop so the slider re-reads master volume when M key toggles mute externally
- Shortcut documented in `KeyboardShortcuts.svelte` help modal
- 6 unit tests covering mute, unmute, round-trip, edge cases, and localStorage persistence

### PhaseHeader font size on phones
- Bumped `.phase-label` and `.rep-counter` from 1.95rem to 2.5rem at the base (phone) size
- Desktop size unchanged at 2.6rem via existing `min-width: 768px` media query
- Visually verified on phone (375x812) and desktop (1280x800) viewports via Playwright

## Documentation
- Updated `docs/design.md`: added M key to keyboard shortcuts table, corrected PhaseHeader font sizes in responsive breakpoints section
