# Improvement Plan — Timer

**Date:** 2026-03-23
**Based on:** Evaluation Report (same date)

## Work Units

### WU1: Fix multi-skipBackward getReady accumulation bug

**Priority:** Critical
**Dependencies:** None

**Changes:**
- `src/lib/timer.ts` — Modify `skipBackward()` to clean up stale dynamically-inserted getReady segments when inserting a new one. After `insertGetReady(targetIdx)`, scan forward from `targetIdx + 1` and remove any getReady segments at index > 0 (these are always dynamic insertions since the original timeline only has getReady at index 0). Recalculate startOffsets after removal.
- `src/lib/timer.test.ts` — Add tests:
  1. Multiple consecutive skipBackward across 3+ segments, then run forward — only one getReady should play
  2. skipBackward 3 times then let timer complete — verify correct total duration
  3. skipBackward multiple times with rest=0 (consecutive work segments)

**Acceptance criteria:** All existing skip tests still pass. New tests verify that only one getReady exists after multiple consecutive skipBackward calls.

---

### WU2: Fix test comment inaccuracy

**Priority:** Low
**Dependencies:** None

**Changes:**
- `src/lib/timer.test.ts:748` — Change `duration 5` to `duration 10` in the timeline comment

**Acceptance criteria:** Comment matches GET_READY_DURATION constant.

---

### WU3: Fix README Node version

**Priority:** Low
**Dependencies:** None

**Changes:**
- `readme.md` — Change "Node.js 20+" to "Node.js 22+"

**Acceptance criteria:** README matches .nvmrc and CLAUDE.md.

---

### WU4: Rename /documentation to /docs

**Priority:** Low
**Dependencies:** None

**Changes:**
- `git mv documentation docs`
- Update any references in CLAUDE.md, readme.md, or other files that point to `/documentation/`

**Acceptance criteria:** `/docs` directory exists with all 6 doc files. No references to `/documentation/` remain.

---

### WU5: Create /journal directory with retrospective entry

**Priority:** Low
**Dependencies:** WU1 (so we can document the bug fix)

**Changes:**
- Create `journal/260323-evaluation-and-bug-fix.md` documenting today's evaluation findings and the multi-skip bug fix

**Acceptance criteria:** Journal directory exists with a dated entry.

---

### WU6: Update documentation for skipBackward cleanup behavior

**Priority:** Low
**Dependencies:** WU1

**Changes:**
- `docs/timer-engine.md` — Update the "Get-ready insertion" paragraph to mention the cleanup of stale getReady segments on multi-skip

**Acceptance criteria:** Documentation accurately describes the new cleanup behavior.
