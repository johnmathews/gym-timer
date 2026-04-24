# Fix Desktop Grid Column Widths and Home Screen Swipe Direction

## Date: 2026-04-25

## Grid Layout Fix

On desktop (>=1024px) and phone landscape, the two-column home screen layout used
`grid-template-columns: 1fr 1fr`. CSS Grid's `1fr` defaults to `minmax(auto, 1fr)`, meaning
a column can never shrink below its content's intrinsic width. When the total time text was
"10:00" (5 characters at a very large font), it pushed the right column wider than 50%,
making the left column (config cards) narrower. Switching presets between "10:00" and "2:00"
visibly shifted column widths.

**Fix:** Changed to `minmax(0, 1fr) minmax(0, 1fr)` in both the desktop and landscape media
queries. This forces a strict 50/50 split regardless of content.

With fixed-width columns, the viewport-relative font-size (`20vw`) was too large for a column
that's only ~50% of the viewport. Scaled down proportionally:
- Time font: `clamp(10rem, 20vw, 24rem)` -> `clamp(7rem, 12vw, 20rem)`
- Play button: `clamp(100px, 14vw, 200px)` -> `clamp(80px, 10vw, 160px)`
- Gap: `clamp(20px, 3vw, 50px)` -> `clamp(16px, 2vw, 40px)`
- Landscape time: `min(25vw, 10rem)` -> `min(13vw, 7rem)`

Added `overflow: hidden` on `.total-time-display` and `flex: 1; min-width: 0` on `.time`
so the text element respects column boundaries.

## Swipe Direction Fix (Second Attempt)

The previous session's swipe direction "fix" (commit 7257daa) was incorrect -- it set
swipe left = previous and swipe right = next, which is backwards from iOS convention.
Standard iOS carousel behavior: swipe left = next item, swipe right = previous item
(you "push" content left to reveal the next thing).

Swapped `cyclePreset()` arguments in `handleHomePointerUp()` to match the active timer's
skip direction and iOS convention:
- Swipe left (`deltaX < 0`) -> `cyclePreset(1)` (next)
- Swipe right (`deltaX > 0`) -> `cyclePreset(-1)` (previous)

## Verified at

- 1024x768, 1440x900, 1920x1080 (desktop grid)
- 390x844 (mobile portrait, single column unaffected)
- All 139 unit tests pass, lint clean
