# Visual Design

## Layout

The app uses a single-page layout centered on screen with responsive width constraints:

- **Mobile** (<768px): max-width 500px, single-column vertical layout
- **Desktop** (768px–1023px): max-width 640px, single-column vertical layout
- **Desktop wide** (≥1024px): full-width with responsive padding, **2-column grid** (`minmax(0, 1fr)` columns for fixed 50/50 split) — config cards on the left, total time + play button on the right, all elements scale with viewport
- **Phone landscape** (<500px height): full-width 2-column grid (`minmax(0, 1fr)`) with compressed card sizes

On narrow screens, the layout is a vertical flex column with three sections:
1. **Config area** (idle) or **Phase header** (active) — top
2. **Countdown display** — center, fills available space
3. **Toolbar** — bottom, with action buttons

On wide desktop screens (≥1024px), the idle/home screen switches to a 2-column CSS grid:
- **Left column**: Three config cards (Work, Rest, Repeat) stacked vertically
- **Right column**: Total time display and play button, vertically centered
- **Toolbar row**: Spans both columns at the top (fullscreen, volume)

This reuses the same grid pattern as the phone landscape layout but with larger fonts and more generous spacing. All sizing uses `clamp()` to scale smoothly from 1024px to ultrawide displays.

## Color Scheme

| State         | Background Color | Text Color |
|---------------|-----------------|------------|
| Idle          | `#000` (black)  | White      |
| Get Ready     | `#FFBA08` (yellow) | Black   |
| Work          | `#2ECC71` (green)  | Black   |
| Rest          | `#FFBA08` (yellow) | Black   |
| Paused        | `#000` (black)  | Amber (phase header), white (timer) |
| Finished      | 4-color flash (red/yellow/green/cyan, ~288ms each, 10 cycles ~11.5s), ends on cyan `#00bcd4`, phase label shows "Well Done!" | White |

The full-screen background color provides an unmistakable visual signal of the current phase — visible from across the gym.

## Typography

- Time displays (countdown, total time, config card values) use `"Bebas Neue", sans-serif` — a tall, condensed, heavy font loaded from Google Fonts
- `font-variant-numeric: tabular-nums` ensures digits don't shift as the countdown changes
- Base countdown size: `min(30vw, 35vh)`
- Desktop countdown size: `min(20vw, 40vh)` — larger since there's more empty space

## Responsive Breakpoints

Three responsive breakpoints:

**`@media (min-width: 768px)`** — tablet/desktop baseline:
- Wider app container (500px → 640px)
- Larger countdown font
- Chunkier progress bar segments (8px → 12px height, 4px → 6px radius)
- Phase labels scale up (2.5rem → 2.6rem)

**`@media (min-width: 1024px)`** — wide desktop:
- App fills full viewport width with responsive padding (`clamp(40px, 5vw, 80px)`)
- Home screen switches from single column to 2-column grid
- Config cards scale up: height `clamp(90px, 12vh, 160px)`, labels `clamp(2.5rem, 3.5vw, 4rem)` at weight 600, values up to `6rem`
- Total time font: `clamp(7rem, 12vw, 20rem)` — sized to fit within a 50/50 grid column
- Play button: `clamp(80px, 10vw, 160px)`
- Toolbar icons: 36px (up from 28px on mobile)

**`@media (orientation: landscape) and (max-height: 500px) and (max-width: 1023px)`** — phone landscape:
- Full-width (no max-width), compressed config cards (78px height)
- 2-column grid with reduced font sizes and tighter spacing

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

### Desktop — Keyboard Shortcuts

On hover-capable devices, the following keyboard shortcuts are available:

| Key       | Action                                              |
|-----------|-----------------------------------------------------|
| `Space`   | Play / Pause / Resume                               |
| `←`       | Previous segment (active) / Previous preset (idle)  |
| `→`       | Next segment (active) / Next preset (idle)          |
| `↑`       | Add a rep (live edit)                               |
| `↓`       | Remove a rep (live edit)                            |
| `R`       | Restart workout (active/paused/finished)            |
| `H`       | Go home (paused/finished)                           |
| `M`       | Toggle mute / unmute                                |
| `F`       | Toggle fullscreen (works on any screen)             |
| `Esc`     | Close overlay / Go home when finished               |
| `?`       | Toggle keyboard shortcuts help modal                |

**Escape behavior by context:**
- Shortcuts modal open → closes modal
- Picker open → cancels picker (reverts value)
- Timer finished → returns to home screen
- Timer running/paused → does nothing (except browser's native fullscreen exit)

The `?` key opens a modal overlay listing all available shortcuts. It works from any screen (home, active timer, picker). The modal is implemented as a `KeyboardShortcuts` component (`src/lib/components/KeyboardShortcuts.svelte`).

### Desktop — Arrow Buttons

`<` and `>` arrow buttons positioned on left/right edges of the countdown area:
- Only visible on hover-capable devices: `@media (hover: hover)`
- Semi-transparent (`rgba(0,0,0,0.4)`) with hover brightening
- Adapts to paused state (white on black background)
- Hidden during finished state
- Uses Material Design chevron SVG icons

## Preset Cycling

The home screen supports cycling through preset timer configurations:

- **Touch**: Drag-to-pan semantics — swipe right = next preset, swipe left = previous preset (50px threshold, matches the Right/Left arrow keys)
- **Trackpad (laptop)**: 2-finger horizontal swipe on the home screen. Wheel `deltaX` is accumulated until it crosses 60px, then the preset cycles once and the gesture is locked until 150ms of inactivity. With macOS natural scrolling on (default), physical finger-right produces `deltaX < 0` and advances to the next preset, matching the touch and arrow-key direction. Vertical-dominant scrolls are ignored.
- **Keyboard**: Left/Right arrow keys when on the idle home screen (no picker open)
- The list wraps around in both directions
- A **dot indicator** below the config cards shows which preset is active (bright dot = current, dim dots = others)
- Manual config changes (via pickers) are discarded when cycling to a new preset
- Presets are defined in `src/lib/presets.ts` as an array of `{ work, rest, reps }` objects

Current presets:
1. Work 60s, Rest 0s, Reps 10 (default)
2. Work 30s, Rest 15s, Reps 10

Swipe handling on the home screen excludes only the toolbar (volume, fullscreen) from swipe capture. Config cards participate in the gesture so swipes that begin on a card still cycle presets — the synthesized click that follows a swipe is consumed by a capture-phase click handler on `.home`, so the picker only opens on a real tap.

## Config Cards

Idle screen shows three config cards (Work, Rest, Repeats) that open full-screen ruler pickers when tapped. Each card displays:
- Label (e.g., "Work")
- Formatted current value (e.g., "00:30")
- Colored accent matching the phase color

## Pause Screen

When the timer is paused, the PhaseHeader remains visible at the top showing the current phase and rep count in amber text on a black background. The countdown display shows the paused time. Tapping the screen (or using skip gestures) resumes the timer — no separate resume button is displayed.

## Progress Bar

During active timer, a segmented progress bar shows:
- One segment per rep
- Completed segments are dark (`rgba(0,0,0,0.7)`)
- Current segment is half-filled (`linear-gradient` left-to-right, dark 50% then light 50%) — left half matches completed, right half matches future, clearly showing progress
- Future segments are light (`rgba(0,0,0,0.15)`)
- When paused: completed = amber, current = half-filled (amber left, dim white right), future = dim white
- When finished: all segments show as completed (dark)
- Phase label and rep counter displayed above
