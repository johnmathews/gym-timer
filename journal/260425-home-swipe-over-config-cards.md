# Home Swipe Over Config Cards

## Date: 2026-04-25

## Problem

On the home screen, swiping horizontally was supposed to cycle through presets, but the
gesture only worked when it started in empty space — swipes that began on one of the
ConfigCards (Work / Rest / Repeat) did nothing. Cards cover most of the home surface on
mobile, so the feature was effectively broken on iOS.

## Root cause

`handleHomePointerDown` in `+page.svelte` had two early-return guards that bailed when the
target was inside `.config-card` or any `<button>`. These guards existed to avoid stealing
the click from ConfigCards (which is what opens the RulerPicker). With the guards in place,
swipes starting on a card were never registered.

Removing the guards alone is not sufficient: the original code also called `setPointerCapture`
on the home div in `pointerdown`. Pointer capture redirects subsequent pointer events to the
capturing element, and (importantly) the synthesized `click` event then targets the capturer
rather than the underlying button. Capturing on every pointerdown would mean a tap on a
ConfigCard never opens the picker — broken in a different way.

The first attempt did exactly that and silently broke the JS hydration canary plus every
interactive Playwright test. Each broken test timed out at 30s; with 89 such tests the suite
took 23 minutes instead of the usual ~30 seconds. Useful reminder that "all green for one test"
does not equal "all green for the whole suite."

## Fix

Defer pointer capture until movement clearly indicates a drag. Standard tap-vs-drag pattern:

1. `pointerdown`: record start position and pointer id, but do **not** capture.
2. `pointermove`: once horizontal movement exceeds 10px, call `setPointerCapture` on the home
   div. This guarantees we still receive `pointerup` even if the finger leaves the home area
   mid-gesture, and now we know the click that follows shouldn't open the picker.
3. `pointerup`: if the gesture was a swipe (>50px horizontal, dominant over vertical), cycle
   the preset and set `suppressNextHomeClick`. A `setTimeout(0)` clears the flag as a failsafe
   if no synthesized click actually follows.
4. `onclickcapture` on the home div consumes the click in the capture phase before it reaches
   the ConfigCard's `onclick`, so a swipe ending on a card does not open the picker.

Only the `.toolbar` ancestor check is kept in `pointerdown` — volume/fullscreen buttons stay
tap-only. ConfigCards now participate in the swipe.

## Tests

Added a Playwright test (`tests/timer.test.ts`) that simulates a horizontal mouse drag
starting on the Work card, asserts the preset dot advances and the card values change, and
asserts the RulerPicker is not visible afterwards. The existing JS-hydration canary plus
the rest of the e2e suite cover the regression where pointer capture broke programmatic
clicks.

## Docs

Updated `docs/design.md` and `docs/presets.md` — they previously claimed config cards were
excluded from swipe capture, which is now the opposite of how the code behaves.

## Test results

- Unit: 157 / 157
- E2e: 90 / 90 (26.6s)
- Lint: clean
