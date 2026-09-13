# On-Device Presets Replace presets.yml

**Date:** 2026-09-13

## Summary

Presets can now be created, updated, renamed, deleted and reordered inside the app. They live only on the device, in `localStorage` under `timer-presets` (a versioned JSON envelope). The legacy `presets.yml` pipeline is gone: the build-time YAML import, the runtime `/presets.yml` fetch, its nginx route, `js-yaml`, and the YAML Vite plugin. The app now ships with no presets. That was the user's decision: start empty and recreate presets on the phone, with no migration.

The work ran through the engineering-team workflow: a discussion of the options, a scoped evaluation, a five-unit plan (store, YAML removal, name bar and sheet, reorder, `P` shortcut), test-first implementation per unit, and a `/done` wrap-up.

## Decisions

1. **Device-only storage, not server write-back.** The timer hostname is public through Traefik with no Cloudflare Access, so a write endpoint would have needed authentication first. The user opens the app from an iOS home-screen icon, which keeps its own day counter and so avoids Safari's 7-day script-storage cap. The page calls `navigator.storage.persist()` after the first successful save.
2. **Versioned envelope.** Stored data is `{ "version": 1, "presets": [...] }`. Invalid entries are dropped one by one. After the code review, an unreadable value is first copied to `timer-presets-backup`, so a later save can't destroy it. One way that could happen: a future format read by an older cached app.
3. **Save first, then adopt.** `savePresets()` returns `{ ok, error }`, and the page switches to a new list only when the save succeeded. The volume code's pattern of swallowing storage errors was deliberately not copied.
4. **The active preset is tracked by id.** Reordering or deleting other presets never changes which one is active. Deleting the active preset keeps the card values and clears the selection.
5. **UI.**
   - A name bar above the cards shows the active preset, marked "· edited" when the cards differ from it. It opens a sheet with Update, Save as new, Rename, Reorder and Delete.
   - Reorder uses up/down buttons. Drag handles were rejected because they would fight the home-screen swipe.
   - `P` opens the sheet from the idle home screen.
6. **Overlay safety (from code review).** While the sheet or the reorder list is open, the home screen is `inert`. Focus moves into the overlay and returns to the name bar when it closes. Confirm delete stays disabled for 500 ms, so a double tap can't delete.

## Verification

Every item below was observed.

- **Tests failed first.** Each unit's new tests were run and seen failing before the change: W1 43/43, W2 4/4, W3 11/11, W4 4/5 and W5 3/5.
  - Three tests couldn't fail first because they assert an absence. They now guard against regressions.
  - The W5 test that arrow keys are ignored while the sheet is open was made to fail by temporarily removing the W3 key guard. The guard was then restored.
  - For the review fixes, 2 unit tests and 4 e2e tests failed first.
- **Final suite.** 184 unit tests (51 store, 133 timer) and 138 e2e tests all pass. `svelte-check` reports 0 errors, plus the 2 existing warnings in `KeyboardShortcuts.svelte`. Lint is clean. Coverage is 97.23% statements and 90.41% branches overall; `presetStore.ts` is at 98.92% and 97.01%.
- **nginx.** A local `docker build` succeeded, `nginx -t` passed inside the image, and `GET /presets.yml` now returns the SPA index (200, `text/html`).
- **Production audit.** `npm audit --omit=dev` went from 6 findings (4 high, including `js-yaml`, which was bundled into the client) to 0.
- **Screenshots** at 390×844, 844×390 and 1440×900 show no overlap. These are Chromium renders, not iOS Safari. Landscape at 390 px tall is tight: the dots sit about 9 px from the bottom edge.

## Found During Wrap-Up

- **Code review: keyboard focus behind the sheet.** The play button behind the open sheet could take keyboard focus. That is confirmed by the red test.
  - That Enter would then start the timer underneath the sheet is strongly supported but was not observed: the page's key guard returns without `preventDefault`, so the button's own activation runs.
  - Fixed with `inert` and focus management.
- **Code review: two more.** A double tap could delete a preset, and unreadable stored data would be overwritten by the next save. Both are fixed.
- **Docs audit.**
  - The readme had no documentation index; one has been added.
  - `CLAUDE.md` was missing the `M` shortcut and trackpad cycling.
  - Several `design.md` values that predate this work were wrong: the desktop grid is `9fr/11fr`, not 50/50, and two desktop sizes and the wake-lock code sample were out of date.
- **Evaluation.** CI publishes `:latest` without waiting for the test job, and `main` has no branch protection. So the checks on this branch's PR had to be confirmed green by hand before merging.

## What Is Deliberately Not Done

1. No sync, no backup export or import, and no migration of the old presets. These were the user's decisions.
2. The CI gaps from the evaluation are not fixed here: publishing doesn't wait for tests, PRs never build the Docker image, and the 85% coverage floor is never evaluated in CI. They need a separate CI change, recommended as the next piece of work.
3. The infra VM's compose file still mounts `./timer/:/config` for the timer (home-server repo, `roles/infra_vm/templates/docker-compose.yml.j2`). It is harmless and can be removed when convenient.
4. **Smaller review suggestions not taken:**
   - No upper bounds on stored values, because a cap could reject values the app itself produces, such as reps added during a workout.
   - The first-load flash of default values was not addressed; the cards already did this before this work.
   - The duplicated `clock()` and `displayTime()` formatters, and the component name `PresetList` for what is now a reorder screen, were left as they are.
5. The old `docs/presets.md` was rewritten in place rather than archived, because it still covers the same topic. The reasoning behind the YAML design stays in `journal/260424-presets-yml-and-ios-swipe-fix.md`.

## Tooling Notes

This session ran in a git worktree. The harness refused writes to the main checkout and compound git shell commands, so the engineering-team run's evaluation report, plan and `run.yaml` were kept in the session scratchpad. Multi-part edits to a single file were made with small Python patch scripts that check every match before writing.
