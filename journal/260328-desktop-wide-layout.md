# Desktop Wide-Screen Layout

On desktop monitors (1024px+), the home screen was a narrow 640px column centered in
a wide viewport, wasting most of the screen as black gutters.

## Change

Added a `@media (min-width: 1024px)` breakpoint to `src/routes/+page.svelte` that
switches the home screen to a 2-column CSS grid layout:

- Left column: config cards (Work, Rest, Repeat)
- Right column: total time display + play button
- Toolbar spans both columns at the top
- Max-width increased from 640px to 960px
- 40px column gap for comfortable spacing

This reuses the same grid pattern already in use for phone landscape mode
(`@media (orientation: landscape) and (max-height: 500px)`) but keeps full-size
config cards and desktop-appropriate font sizes rather than the compressed phone
landscape variants.

Active timer states (running, paused, finished) were already full-viewport and
needed no changes.

## Files changed

- `src/routes/+page.svelte` — new desktop media query (lines 779-820)
- `docs/design.md` — updated layout and breakpoint documentation
