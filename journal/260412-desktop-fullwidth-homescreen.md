# Desktop Full-Width Homescreen

**Date:** 2026-04-12

## Changes

Made the desktop homescreen (>=1024px) use the full viewport width and height
instead of being constrained to a 960px max-width. The 2-column grid layout is
preserved but all elements now scale responsively.

### CSS changes (`+page.svelte`)

- Removed `max-width: 960px` on `.app` for the 1024px+ breakpoint
- Added responsive horizontal padding with `clamp(40px, 5vw, 80px)`
- Config cards scale: height `clamp(90px, 15vh, 160px)`, labels up to 3.5rem,
  values up to 6rem
- Total time font scales to `clamp(8rem, 15vw, 18rem)`
- Play button scales to `clamp(80px, 10vw, 160px)`
- Column gap and card spacing also use `clamp()` for fluid scaling

### Test update (`tests/timer.test.ts`)

- Updated "app is constrained to max-width on desktop" test to verify the app
  now fills the full viewport width on desktop, renamed to
  "app fills full width on desktop homescreen"

### Documentation

- Updated `docs/design.md` to reflect new full-width desktop layout

## Verified at

- 1024x768, 1440x900, 1920x1080 (desktop screenshots)
- 375x812 (mobile — unchanged)
