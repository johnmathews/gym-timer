# Visual Design

## Layout

The app uses a single-page layout centered on screen with a maximum width constraint:

- **Mobile**: max-width 500px
- **Desktop** (≥768px viewport): max-width 640px

The layout is a vertical flex column with three sections:
1. **Config area** (idle) or **Phase header** (active) — top
2. **Countdown display** — center, fills available space
3. **Toolbar** — bottom, with action buttons

## Color Scheme

| State         | Background Color | Text Color |
|---------------|-----------------|------------|
| Idle          | `#000` (black)  | White      |
| Get Ready     | `#FFBA08` (yellow) | Black   |
| Work          | `#2ECC71` (green)  | Black   |
| Rest          | `#FFBA08` (yellow) | Black   |
| Paused        | `#000` (black)  | Amber (phase header), white (timer) |
| Finished      | Rainbow party flash (~10s) | White |

The full-screen background color provides an unmistakable visual signal of the current phase — visible from across the gym.

## Typography

- Time displays (countdown, total time, config card values) use `"Bebas Neue", sans-serif` — a tall, condensed, heavy font loaded from Google Fonts
- `font-variant-numeric: tabular-nums` ensures digits don't shift as the countdown changes
- Base countdown size: `min(30vw, 35vh)`
- Desktop countdown size: `min(20vw, 40vh)` — larger since there's more empty space

## Responsive Breakpoints

Desktop breakpoint: `@media (min-width: 768px)` is used for:
- Wider app container (500px → 640px)
- Larger countdown font
- Chunkier progress bar segments (8px → 12px height, 4px → 6px radius)
- Larger phase labels (1.75rem → 2rem)

## Buttons & Icons

- Circular icon buttons using inline SVG with `currentColor`
- Buttons need explicit `color: inherit` — iOS Safari defaults button text to system blue
- Touch targets use `touch-action: manipulation` to prevent double-tap zoom

## PWA / Standalone Mode

- Fullscreen button is hidden when running as an installed PWA (already fullscreen)
- Detected via `navigator.standalone` (iOS) or `display-mode: standalone` media query
- Safe area insets respected via `env(safe-area-inset-bottom)` for notched devices

## Skip/Rewind Controls

During an active timer (running or paused, not finished), users can skip to the next or previous segment:

### Mobile — Swipe Gestures

Horizontal swipe on the active screen:
- **Swipe left** (right-to-left, deltaX > 50px): Skip forward to next segment
- **Swipe right** (left-to-right, deltaX > 50px): Skip backward (restart current or go to previous)
- Vertical swipes and short movements fall through to tap behavior (pause/resume)

Implemented via `onpointerdown`/`onpointerup` handlers that track start position and compute delta on release. Critical CSS/JS for reliable mobile swipes:
- `touch-action: none` on `.active-screen` prevents the browser from intercepting swipes (e.g. Safari back/forward navigation)
- `setPointerCapture()` on pointer down ensures `pointerup` fires even if the finger drifts outside the element

### Desktop — Arrow Buttons

`<` and `>` arrow buttons positioned on left/right edges of the countdown area:
- Only visible on hover-capable devices: `@media (hover: hover)`
- Semi-transparent (`rgba(0,0,0,0.4)`) with hover brightening
- Adapts to paused state (white on black background)
- Hidden during finished state
- Uses Material Design chevron SVG icons

## Config Cards

Idle screen shows three config cards (Work, Rest, Repeats) that open full-screen ruler pickers when tapped. Each card displays:
- Label (e.g., "Work")
- Formatted current value (e.g., "00:30")
- Colored accent matching the phase color

## Pause Screen

When the timer is paused, the PhaseHeader remains visible at the top showing the current phase and rep count in amber text on a black background. The countdown display shows the paused time. Tapping the screen (or using skip gestures) resumes the timer — no separate resume button is displayed.

## Progress Bar

During active timer, a segmented progress bar shows:
- One segment per phase (getReady + work/rest pairs)
- Current segment fills proportionally based on time remaining
- Completed segments are fully filled
- Phase label and rep counter displayed above
