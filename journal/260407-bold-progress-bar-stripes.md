# Bold Progress Bar Stripes

**Date:** 2026-04-07

## Summary

Made the progress bar's current-segment diagonal stripes much bolder and higher contrast. The previous 3px stripes with 3px gaps were too fine and appeared grey from a distance, defeating the purpose of the stripe pattern.

## Changes

- **PhaseHeader.svelte**: Increased stripe width from 3px to 7px, gap from 3px to 6px (13px repeat cycle), opacity from 0.7 to 0.85
- **+page.svelte**: Same stripe dimension changes for paused-state amber stripes
- **docs/design.md**: Updated progress bar section to reflect new stripe dimensions

## Decisions

- 7px stripe + 6px gap = 13px repeat cycle gives approximately 3 bold stripes per segment at the default 6-rep mobile layout (~50px wide segments)
- Increased opacity from 0.7 to 0.85 for higher contrast against the green/transparent background
- The stripe count naturally varies with segment width (fewer reps = wider segments = more stripes), but the key goal is that each stripe is individually visible rather than blending into grey
