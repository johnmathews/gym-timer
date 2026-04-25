# iOS swipe direction regression + looser vertical tolerance

Two bugs reported on iPhone landscape mode:

1. Swipe direction was wrong again — swipe-left moved to the next preset instead
   of the previous one.
2. A horizontal swipe with even modest vertical drift would fail to register.

## Root cause: direction regression

History of the home-screen swipe direction (`handleHomePointerUp` in
`src/routes/+page.svelte`):

- `7257daa` (Apr 24) — set swipe-left → previous preset (drag-to-pan / matches
  `ArrowLeft`/`ArrowRight`). This is what the user wants.
- `194aaf6` (Apr 25) — reversed to swipe-left → next, citing "iOS convention."
  In the same commit, the existing e2e test was rewritten to lock in the wrong
  direction.

Why the test didn't catch it: the test fixture had only **2 presets**, so
`cyclePreset(1)` and `cyclePreset(-1)` from index 0 both wrap to index 1.
The wraparound made the assertion direction-blind.

**Fix:** swap the cyclePreset args in `handleHomePointerUp` so swipe-right
(`deltaX > 0`) → next, swipe-left (`deltaX < 0`) → previous.

**Test fix:** added a third preset (`Test HIIT`) to `tests/fixtures/presets.yml`
so direction is observable. Rewrote the swipe test as two separate cases
(swipe-right → next, swipe-left → previous wraps to last). The
`ArrowLeft cycles to previous preset` and `preset cycling wraps around` tests
were updated to match the new fixture; `preset dot indicator` test now expects
3 dots.

## Root cause: vertical tolerance too strict

Both `handlePointerUp` (active screen, skip forward/back) and
`handleHomePointerUp` (home screen, preset cycling) used:

```js
if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) { ... }
```

The `|deltaX| > |deltaY|` requirement rejects any swipe where vertical drift
exceeds horizontal motion — common on a phone in landscape with the device
held casually.

**Fix:** replaced with a forgiving combined rule applied to both handlers:

```js
if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.max(100, Math.abs(deltaX) * 1.5)) { ... }
```

- 100px absolute vertical baseline (always-forgive small drift)
- 1.5× horizontal as proportional cap (extra tolerance for big swipes)
- The `max()` of the two means whichever is more permissive wins.

The user explicitly said "vertical swiping does nothing, so it's not important
to preserve vertical-swipe interpretation" — vertical-only gestures don't
trigger anything, so being generous is safe.

## Tests added/changed

- `tests/timer.test.ts` — replaced single direction-blind swipe test with three
  dedicated cases:
  - `home swipe right cycles to NEXT preset` (regression, asymmetric)
  - `home swipe left cycles to PREVIOUS preset` (regression, asymmetric)
  - `home swipe registers despite vertical drift` (new tolerance)
- `tests/timer.test.ts` — `vertical swipe does not trigger skip` now exercises
  the new boundary (deltaY = 150 exceeds the cap).
- `tests/fixtures/presets.yml` — third preset added.
- Three keyboard-shortcut tests updated for the 3-preset fixture.

## Final counts

- Unit tests: 157 (timer.test.ts 133 + presets.test.ts 24)
- E2E tests: 92
