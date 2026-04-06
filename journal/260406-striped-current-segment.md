# Striped Current Segment Indicator

**Date:** 2026-04-06

## Summary

Changed the progress bar's current segment indicator from a solid grey fill to a diagonal stripe pattern. The grey fill was difficult to distinguish from completed segments during a workout.

## Changes

- **PhaseHeader.svelte**: Replaced `.segment.current` solid `rgba(0,0,0,0.4)` background with `repeating-linear-gradient(-45deg, ...)` using 3px black stripes with 3px transparent gaps
- **+page.svelte**: Updated paused-state `.segment.current` to use the same diagonal stripe pattern with amber (`#ffba08`) stripes instead of semi-transparent amber fill
- **docs/design.md**: Updated Progress Bar section to describe the stripe pattern
- **tests/timer.test.ts**: Added 2 e2e tests verifying the stripe pattern is applied during running and paused states

## Decisions

- Stripe width of 3px with 3px gaps provides clear visibility on both mobile (8px tall segments) and desktop (12px tall segments)
- Used -45deg angle for the diagonal direction
- Paused state uses amber stripes (matching the amber theme) rather than black stripes (which would be invisible on the black paused background)
