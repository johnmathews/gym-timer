# Desktop UI Scaling Improvements

Continued refining the desktop (≥1024px) home screen layout for better readability at a distance.

## Changes

- **Toolbar icons**: Increased from 28px to 36px (~30% larger) on desktop via the `@media (min-width: 1024px)` block
- **Config card labels**: Bumped to `clamp(2.5rem, 3.5vw, 4rem)` with font-weight 600 (from 400). Added a desktop media query inside `ConfigCard.svelte` since parent `:global()` overrides weren't reliably reaching the component's scoped styles
- **Total time display**: Font size increased to `clamp(10rem, 20vw, 24rem)` (from 8/15vw/18rem)
- **Play button**: Width increased to `clamp(100px, 14vw, 200px)` (from 80/10vw/160px)
- **Landscape media query**: Scoped to `max-width: 1023px` so it only applies to phones, not desktop browsers with short windows

## Debugging: Svelte scoped styles

Spent time debugging why `:global(.label)` overrides from `+page.svelte` weren't applying to `ConfigCard.svelte`. Even `!important` had no effect. Root cause was the dev server — the browser was connected to a stale server on a different port (5175 vs 5173). Resolved by restarting the dev server and confirming the correct port. Added a desktop media query directly inside `ConfigCard.svelte` as a belt-and-suspenders approach.
