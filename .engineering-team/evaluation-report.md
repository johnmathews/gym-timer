# Evaluation Report — Timer

**Date:** 2026-03-23

## Executive Summary

Timer is a well-built, focused workout timer web app (SvelteKit static site) designed for iOS PWA and desktop use. The codebase is clean, well-tested (105 unit tests, 82 e2e tests, 86% line coverage), and has solid architecture (wall-clock based timer engine). The main issue is a **confirmed bug** in the multi-skip-backward logic that inserts redundant getReady countdowns. Secondary concerns are the absence of a linter, missing `/journal` and `/docs` directories, and a minor test comment inaccuracy.

## Test Suite Results

**Unit tests:** 105/105 passed (792ms)
**E2E tests:** 82 tests (not run in this evaluation — requires browser)

**Coverage (v8):**

| File       | Stmts | Branch | Funcs | Lines |
|------------|-------|--------|-------|-------|
| timer.ts   | 85.3% | 77.4%  | 86.0% | 86.7% |
| logger.ts  | 100%  | 100%   | 100%  | 100%  |
| presets.ts  | 100%  | 100%   | 100%  | 100%  |
| **All**    | **85.4%** | **77.7%** | **86.4%** | **86.9%** |

Uncovered lines in timer.ts are primarily the audio functions (playPauseSound, playResumeSound, warmAudioContext, startKeepAlive, stopKeepAlive) — reasonable since these require a real AudioContext.

## Project Overview

- **Purpose:** Workout interval timer (work/rest/repeats with getReady countdown)
- **Architecture:** SvelteKit + adapter-static, Svelte 5 runes, TypeScript
- **Deployment:** Multi-stage Docker build (node:22-alpine → nginx:alpine), GitHub Actions pushes to ghcr.io
- **Primary use:** Equal iOS PWA and desktop browser

## Strengths

1. **Wall-clock timer engine** (`timer.ts:77-143`): Elegant design that survives browser suspension — records `Date.now()` at start, builds a timeline of segments, and recalculates position from elapsed time. This is exactly the right approach for a mobile timer.

2. **Comprehensive test suite:** 105 unit tests covering timer lifecycle, skip logic, volume, audio, edge cases. 82 e2e tests via Playwright. Good test quality — tests verify behavior, not implementation details.

3. **iOS audio handling:** The audio session management (ambient mode, silent WAV trick, keepalive oscillator, DynamicsCompressor for volume boost) is well-engineered and battle-tested per the memory notes.

4. **Clean component architecture:** 9 focused components with clear responsibilities. Props use Svelte 5 `$props()` pattern consistently.

5. **Responsive design:** Handles portrait, landscape, desktop, PWA standalone mode, safe-area insets.

6. **CI/CD:** GitHub Actions workflow correctly builds multi-arch Docker images and pushes to ghcr.io.

## Weaknesses

### Bug: Multiple skipBackward inserts redundant getReady segments

**Priority: Critical**
**Status: [VERIFIED]** — confirmed by code analysis (no test exists for this scenario)

**Location:** `timer.ts:318-354` (`skipBackward` function) and `timer.ts:302-316` (`insertGetReady`)

**The problem:** Each `skipBackward()` call that lands on a work segment inserts a getReady countdown before it (line 345-346). When the user skips back multiple times, each intermediate work segment gets a getReady inserted. These leftover getReady segments remain in the timeline. When the timer runs forward, it plays a 10s getReady before *every* work segment that was skipped over, not just the first one.

**Example timeline corruption:**

Original: `[getReady][work1][rest1][work2][rest2][work3][rest3][work4]`

After 3 skipBackward calls from work4:
1. Skip to work3: inserts getReady → `...[rest2][GR*][work3]...`
2. Skip past getReady to rest2 (<=2s)
3. Skip from rest2 to work2: inserts getReady → `...[rest1][GR*][work2][rest2][GR*][work3]...`

Running forward from work2 hits the leftover getReady before work3.

**Root cause:** `insertGetReady` only checks whether the *immediately preceding* segment is already a getReady (line 345). It does not clean up previously-inserted getReady segments further ahead in the timeline.

**Fix:** When inserting a new getReady, also scan forward and remove any previously-inserted getReady segments (any getReady at index > 0 that isn't the one just inserted). The original timeline only has getReady at index 0, so any other getReady is a dynamic insertion.

**Missing test:** No test for "multiple consecutive skipBackward calls across several segments." Only the "repeated skipBackward to *same* segment" case is tested (line 1094).

---

### No linter configured

**Priority: Medium**

No ESLint, Prettier, or any linting tool. The code is consistently styled (spaces, Svelte 5 patterns), but there's no automated enforcement. For a project with this level of quality, a linter would catch regressions.

**Recommendation:** Add ESLint with `@eslint/js` + `typescript-eslint` + `eslint-plugin-svelte`.

---

### Missing `/journal` directory

**Priority: Low**

Per global instructions, every project must have a `/journal` directory with dated entries. None exists.

---

### Missing `/docs` directory

**Priority: Low**

The project uses `/documentation` instead of `/docs`. Per global instructions, documentation should be in `/docs`. The existing documentation in `/documentation/` is thorough and accurate:
- `timer-engine.md` — accurate description of wall-clock architecture
- `audio.md` — iOS audio handling
- `slider-scales.md` — non-uniform picker scales
- `wake-lock.md` — wake lock behavior
- `design.md` — visual design
- `presets.md` — preset definitions

---

### README.md Node version mismatch

**Priority: Low**

README says "Node.js 20+" but `.nvmrc` specifies Node 22 and CLAUDE.md says "Node 22+". Should be updated to match.

---

### Test comment inaccuracy

**Priority: Low**

`timer.test.ts:748` says `getReady: offset 0, duration 5` but `GET_READY_DURATION` is 10. The comment is wrong; the tests themselves use the constant correctly.

---

### Code duplication in audio functions

**Priority: Low**

`playPauseSound` (lines 543-582) and `playResumeSound` (lines 584-623) share ~90% identical code (compressor setup, gain routing). Only the frequency ramp direction differs. Could be extracted to a helper, but this is minor — the code works correctly.

## Assessment Dimensions

| Dimension                   | Score | Justification |
|-----------------------------|-------|---------------|
| **Simplicity**              | 4/5   | Clean, focused code. Minor duplication in pause/resume audio. The timeline manipulation in skipBackward is the most complex part and the source of the bug. |
| **Robustness**              | 4/5   | Wall-clock design handles browser suspension well. iOS audio workarounds are thorough. The multi-skip bug is the main robustness gap. |
| **Security**                | 5/5   | Static site with no backend, no user input beyond timer config, no secrets, no external APIs. Attack surface is essentially zero. |
| **Flexibility**             | 4/5   | Clean component separation makes changes easy. Timer logic is well-encapsulated. Preset system is extensible. |
| **Test coverage**           | 4/5   | 86% line coverage, 105 unit + 82 e2e tests. Good quality. Gap in multi-skip scenario. Audio functions reasonably excluded. |
| **Documentation accuracy**  | 4/5   | Documentation matches code behavior. One minor inaccuracy in `segmentIndexAt` description ("binary search" — it's actually a linear scan, timer.ts:248-256). |
| **Documentation completeness** | 4/5 | Core features well-documented. Missing: keyboard shortcuts doc, component API reference. But for a project this size, the existing docs are thorough. |
| **Deployment quality**      | 5/5   | Multi-stage Docker build, GitHub Actions CI/CD to ghcr.io, nginx serving. Clean and working. |

## Bug Candidates

1. **[VERIFIED] Multiple skipBackward getReady accumulation** — described above. Critical priority.

2. **[SUSPECTED] `segmentIndexAt` returns `_timeline.length` when past all segments** (line 255) — this is used by `skipForward` (line 292) which checks `idx >= _timeline.length - 1`, so it works. But `skipBackward` checks `idx >= _timeline.length` (line 326) as a separate guard. Technically correct but fragile — if someone adds code between the index check and the segment access, they might forget this edge case.

## Gap Analysis

1. **Missing test:** Multiple consecutive `skipBackward` calls (the bug scenario)
2. **Missing test:** `skipBackward` 3+ times then letting timer run to completion
3. **No linter:** Should have ESLint for automated code quality enforcement
4. **No `/journal` directory:** Required by project conventions
5. **`/documentation` vs `/docs`:** Convention mismatch

## Problem Space Fit

This is an excellent implementation for a workout timer. The wall-clock approach is exactly right for mobile browsers where `setInterval` gets suspended. The iOS audio handling is thorough and well-documented. The timeline-based architecture makes skip logic possible (even if the multi-skip case has a bug). The PWA features (wake lock, fullscreen detection, safe-area handling) are appropriate for the use case.

## Architectural Assessment

The timer engine's approach of building a mutable timeline array and splicing segments into it during skipBackward is the source of the bug. The architecture is fundamentally sound, but the mutation strategy needs a cleanup mechanism — when inserting a new getReady, stale insertions further ahead in the timeline should be removed. This is a targeted fix, not an architectural change.
