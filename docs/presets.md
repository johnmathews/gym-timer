# Workout Presets

## Status

Presets are **active** and live **only on the device**: each browser, or each iOS home-screen install, keeps its own list in `localStorage`. The app ships with none. Users cycle through them on the home screen by swiping left/right (touch), swiping with two fingers (trackpad), or pressing Left/Right (desktop). The list wraps around in both directions, and a dot row below the config cards shows the position.

The legacy `presets.yml` pipeline (build-time YAML plus a runtime `/presets.yml` override mounted into the Docker container) was removed on 2026-09-13.

## Device Storage

`src/lib/presetStore.ts` keeps presets on the device in `localStorage` under the key `timer-presets`:

```json
{ "version": 1, "presets": [{ "id": "…", "name": "5 Hangs", "work": 30, "rest": 15, "reps": 5 }] }
```

- `id` is the identity (`crypto.randomUUID()`, with a fallback where it is missing). Names are trimmed, 1–40 characters, and may repeat.
- `work` is a positive integer (seconds), `rest` a non-negative integer, `reps` a positive integer.
- **Loading** (`loadPresets`): a missing key loads as an empty list. Unparseable JSON, an unknown `version`, or a `presets` value that is not an array also load as empty and log `presets:load-invalid`. Before that, the unreadable value is copied to `timer-presets-backup`, so the next save (which overwrites `timer-presets`) cannot destroy it, for example a newer format read by an older cached app; a failed backup write does not stop the load. Inside a valid envelope, entries that fail validation are dropped one by one and the rest load; a repeated `id` keeps the first entry.
- **Saving** (`savePresets`) returns `{ ok: true }` or `{ ok: false, error }`. It never swallows a failure (quota exceeded, storage disabled): callers keep their previous state and show the error.
- **Editing** uses pure functions that return a new array and never mutate their input: `addPreset`, `updatePreset`, `renamePreset`, `removePreset`, `movePreset`. An invalid name or value throws a `RangeError`; an unknown `id` returns the list unchanged.
- **Persistence:** `requestPersistence()` calls `navigator.storage.persist()` where the browser has it, which exempts the data from eviction when the device runs low on space. A home-screen web app already avoids Safari's 7-day storage cap, because opening the app resets it.
- `summaryName()` formats values as `work / rest × reps` (e.g. `0:30 / 0:15 × 5`); the save dialog uses it to prefill the name.
- `matchesValues()` compares a preset with the current card values and drives the "· edited" marker; `normalizeName()` and `MAX_NAME_LENGTH` (40) back the name field's validation and `maxlength`.

## Loading and Cycling

In `src/routes/+page.svelte`:

- On mount, `loadPresets()` reads the stored list. If it is non-empty, the first preset is applied (`duration`, `rest`, `reps`, then `timer.configure()`). If it is empty, the cards keep the defaults 1:00 / 0:00 / x10 and no dots render.
- The page tracks the active preset by `id` (`activePresetId`), not by position, so reordering or removing other presets does not change which one is active.
- `cyclePreset(direction)` moves to the next or previous preset with wraparound. With no active preset, next goes to the first preset and previous to the last.
- Home-screen swipes use pointer events (50px threshold) with `touch-action: pan-y` on `.home` for iOS. Only the toolbar (volume, fullscreen) is excluded from swipe detection; config cards participate, and the synthesized click that follows a swipe is consumed by a capture-phase click handler so a picker does not open.
- Trackpad swipes go through `wheel-gestures` (see [design.md](design.md#preset-cycling)).
- Left/Right arrow keys cycle presets when `$status === "idle"` and no picker, preset sheet or reorder list is open.
- Manual card changes are discarded when cycling to another preset.

## Creating and Editing

- Presets are created, updated, renamed and deleted from the name bar below the cards (next to the dots) and the sheet it opens (layout and behaviour in [design.md](design.md#preset-bar-and-sheet)).
- Every change goes through the store's pure operations and then `savePresets()`. The page adopts the new list only when the save returns `{ ok: true }`; on failure the sheet shows the error and the previous list stays.
- After the first successful save in a session, the page calls `requestPersistence()`.
- A new preset is appended to the end of the list and becomes active. Deleting the active preset keeps the card values and clears the selection; cycling then starts from the first preset (next) or the last (previous).
- **Reorder…** in the sheet (shown with two or more presets) opens `PresetList.svelte`, a list with up/down buttons. Each move runs `movePreset` and saves at once. The active preset stays active, so its dot moves with it and cycling follows the new order.

## Dot Indicator

- Rendered inside the `.cards` div, below the Repeat card, one dot per stored preset, in a row with the name bar to their right; with no presets the row holds only "Save as preset…"
- Each dot is a `<span class="dot">`; the active dot is brighter (`rgba(255,255,255,0.85)`) than the others (`rgba(255,255,255,0.25)`)
- Dots use a CSS transition for smooth visual feedback

## Test Seeding

Playwright starts every test with a clean browser profile, so presets start empty. Tests that need presets write the storage key before the page loads:

```ts
await page.addInitScript((value) => {
  if (localStorage.getItem("timer-presets") === null) localStorage.setItem("timer-presets", value);
}, JSON.stringify({ version: 1, presets }));
await page.goto("/");
```

The `getItem` guard matters: `addInitScript` runs again on every navigation, including `page.reload()`, and an unguarded write would overwrite whatever the test just saved.

## Test Coverage

- **Unit** (`src/lib/presetStore.test.ts`): loading and validation, the backup of unreadable values, saving and save failures, every pure operation, id generation, the persistence request, and the default-storage paths.
- **E2e** (`tests/timer.test.ts`): empty-storage defaults, seeded presets loading and surviving a reload, corrupt storage loading as empty, arrow/swipe/wheel cycling and wraparound, the dot indicator, and the name bar and sheet (create with the button or Enter, the edited marker and Update, save as new, rename, delete with confirmation, cancel, the blank-name guard, a failed save, a swipe that starts on the bar, and Escape), and reordering (the new order drives cycling and survives a reload, the edge buttons are disabled, Reorder is hidden with fewer than two presets, and Escape closes the list), and the `P` shortcut (either case, ignored during a picker or a workout, typing "p" in the name field, arrow keys ignored while the sheet is open, and its entry in the help).
- **E2e, overlays and edge cases:** the page behind an open overlay cannot be reached by keyboard, focus moves into the sheet or list and back to the bar, a double tap on Delete does not delete, cycling after deleting the active preset, deleting the only preset, a failed save while reordering, and `P` being ignored while the help or the reorder list is open.
