# 260323 — Codebase Evaluation and Multi-Skip Bug Fix

## What happened

Ran a full engineering team evaluation of the timer codebase. Found one critical bug and several minor housekeeping
items.

## Bug: Multiple skipBackward inserts redundant getReady segments

When skipping backward multiple times through a workout (e.g., from segment 7 back to segment 4), each `skipBackward()`
call that landed on a work segment inserted a getReady countdown before it. These leftover getReady segments remained in
the timeline. When the timer ran forward, it played a 10s getReady before every work segment that had been skipped over,
not just the first one.

**Root cause:** `insertGetReady` only checked whether the immediately preceding segment was already a getReady. It did
not clean up previously-inserted getReady segments further ahead in the timeline.

**Fix:** After inserting a new getReady (or seeking to an existing one), scan forward and remove any other
dynamically-inserted getReady segments (any getReady at index > 0 after the current position). Then recalculate all
startOffsets.

Added 3 new unit tests covering:

- Multiple skipBackward with rest periods, then run forward
- Multiple skipBackward with rest=0, then run forward
- Skip back 3 times then verify correct total duration to finish

All 108 tests pass (was 105).

## Other changes

- Fixed test comment: getReady duration was listed as 5, should be 10
- Fixed README: Node version 20+ changed to 22+ (matches .nvmrc)
- Renamed `/documentation` to `/docs` per project conventions
- Updated CLAUDE.md reference from `documentation/` to `docs/`
- Updated timer-engine docs to describe the stale getReady cleanup behavior
- Created this `/journal` directory
