# 2026-04-27 — Trackpad 2-finger swipe (via wheel-gestures)

## Context

Wanted a trackpad equivalent of the touch-screen home swipe and the Left/Right arrow keys, so a laptop user can cycle through presets without a keyboard. macOS does not expose true 3-finger swipes to webapps (the OS captures them for back/forward / Spaces), so the only viable input is the 2-finger horizontal swipe, which the browser delivers as `wheel` events with non-zero `deltaX`.

## Failed hand-rolled attempts (then reverted)

Four hand-rolled iterations on top of `deltaX` accumulation and various release strategies all broke in one or another mode (lock pinned by inertia, multi-cycle from a single hard swipe, or the gate filtering every fresh swipe). Reverted in commit `ddbe0ca`. The core mistake was reasoning about a mental model of the wheel-event stream without recording what a real Mac trackpad actually emits — see the [research findings in this conversation](https://github.com/anthropic-ai/...) (and the wheel-gestures source) for what the stream really looks like:

- ~16 ms tick rate (display-refresh-locked) for the entire 1–3 s tail of a single swipe — no useful idle gap inside an inertia trail.
- Peak `|deltaX|` is often single digits; magnitudes ramp up at the start of a fresh swipe just like they decay at the end. Magnitude alone cannot distinguish "fresh push" from "decay".
- No phase signal in standard or webkit `WheelEvent`. Detection has to come from per-event acceleration ratios.

## What we did

Adopted [`wheel-gestures`](https://github.com/xiel/wheel-gestures) (also used by Embla). Its `WheelEventState` exposes `isStart`, `isMomentum`, `isMomentumCancel`, `isEnding` flags computed from a rolling buffer of acceleration ratios. We fire on `isStart || isMomentumCancel` for horizontal-dominant gestures only.

Configuration:

- `preventWheelAction: 'x'` — calls `preventDefault()` on horizontal-dominant wheels to suppress the macOS browser back/forward gesture.
- `reverseSign: false` — disables the library's default sign flip so `axisDelta[0]` matches raw `deltaX`. With macOS natural scrolling, finger-right → `deltaX < 0` → next preset, matching the touch and arrow-key direction.

Wired with `bind:this` on the `.home` div and a Svelte 5 `$effect` that creates a `WheelGestures` instance, observes the container, and tears it all down when the home screen unmounts (e.g. when a picker opens).

## Tests

Five Playwright tests cover the gesture: single right-swipe → next, single left-swipe → previous, consecutive swipes separated by a clock fast-forward, a synthesised peak-then-decay inertia tail (verifies single fire), and vertical-only wheel (verifies no-op).

The existing 92 e2e tests and 133 unit tests still pass.
