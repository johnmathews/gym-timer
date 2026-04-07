# Progress Bar Current-Segment Indicator

**Date:** 2026-04-07

## Summary

Iterated on the progress bar's current-segment indicator. Started by making the diagonal stripes bolder, then replaced stripes entirely with a half-filled design (left half dark, right half light) for maximum clarity at a distance.

## Changes

### Commit 1: Bolder stripes
- **PhaseHeader.svelte**: Increased stripe width from 3px to 7px, gap from 3px to 6px, opacity from 0.7 to 0.85
- **+page.svelte**: Same changes for paused-state amber stripes

### Commit 2: Half-filled replacement
- **PhaseHeader.svelte**: Replaced `repeating-linear-gradient` stripes with `linear-gradient(to right, dark 50%, light 50%)`
- **+page.svelte**: Same pattern for paused state (amber left, dim white right)
- **tests/timer.test.ts**: Updated 2 e2e tests — renamed and changed assertion from `repeating-linear-gradient` to `linear-gradient`
- **docs/design.md**: Updated progress bar section to describe half-filled pattern

## Decisions

- Half-filled is simpler and more universally readable than stripes at any segment width
- Left half uses the "done" color, right half uses the "future" color — visually intuitive as "in progress"
- Paused state right half uses `rgba(255, 255, 255, 0.15)` to match the paused future segment color
