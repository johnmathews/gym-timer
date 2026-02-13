# Timer Engine

## Overview

The timer engine (`src/lib/timer.ts`) manages countdown state using a wall-clock based approach. It uses Svelte stores for reactive state and pure functions for time calculations.

## Architecture

### Wall-Clock Design

Instead of decrementing a counter each second (which drifts when the browser suspends `setInterval`), the timer:

1. Records `Date.now()` at start (`_startTime`)
2. Builds a timeline of all phases with their offsets
3. On each tick, calculates elapsed time and finds the current position in the timeline

This ensures the timer catches up correctly when the browser resumes after suspension (e.g., phone screen off).

### Timeline

The timeline is an array of segments, each with:
- `phase`: `"getReady"` | `"work"` | `"rest"`
- `rep`: repeat number (1-based)
- `duration`: length in seconds
- `startOffset`: cumulative seconds from timer start

Example for Work=30s, Rest=10s, Repeats=3:
```
[0s]  getReady (5s)
[5s]  work rep 1 (30s)
[35s] rest rep 1 (10s)
[45s] work rep 2 (30s)
[75s] rest rep 2 (10s)
[85s] work rep 3 (30s)
[115s] → finished
```

Note: no rest period after the final work rep.

### syncState()

The core function that runs every second (and on visibility change):

1. Calculates `elapsed = floor((Date.now() - _startTime) / 1000)`
2. Iterates through timeline segments
3. When `elapsed < segEnd`, sets remaining time, phase, and current rep
4. If past all segments → timer is finished

### Pause/Resume

- **Pause**: stores `_pausedElapsed = Date.now() - _startTime` (ms of elapsed time)
- **Resume**: reconstructs `_startTime = Date.now() - _pausedElapsed` so elapsed time continues from where it left off

### Visibility Handler

A `visibilitychange` listener triggers `syncState()` immediately when the page becomes visible. This covers the case where the phone screen was off — the timer catches up instantly rather than waiting for the next `setInterval` tick.

## Stores

| Store        | Type          | Description                        |
|--------------|---------------|------------------------------------|
| `duration`   | `number`      | Total duration of current phase    |
| `remaining`  | `number`      | Seconds remaining in current phase |
| `status`     | `TimerStatus` | `idle` / `running` / `paused` / `finished` |
| `phase`      | `TimerPhase`  | `getReady` / `work` / `rest`       |
| `currentRep` | `number`      | Current repeat (1-based)           |
| `totalReps`  | `number`      | Total repeats configured           |

## API

| Method              | Description                                      |
|---------------------|--------------------------------------------------|
| `configure(w,r,r)`  | Set work/rest/reps and reset to idle             |
| `setDuration(m,s)`  | Configure single countdown (no rest/reps)        |
| `setDurationSeconds` | Configure single countdown from seconds          |
| `start()`           | Start or resume the timer                        |
| `pause()`           | Pause a running timer                            |
| `reset()`           | Stop and return to idle                          |
| `destroy()`         | Clean up interval and event listeners            |
| `skipForward()`     | Jump to start of next segment (or finish if last)|
| `skipBackward()`    | Restart current segment (>2s in) or go to previous|

## Skip/Rewind

`skipForward()` and `skipBackward()` allow jumping between timeline segments while the timer is running or paused. They work by computing the current segment from elapsed time and using `seekTo()` to reposition.

### Internal Helpers

- **`getElapsedMs()`**: Returns elapsed ms — `Date.now() - _startTime` when running, `_pausedElapsed` when paused
- **`segmentIndexAt(elapsedSec)`**: Binary search through timeline to find which segment contains a given elapsed time
- **`seekTo(elapsedMs)`**: Repositions the timer to a target elapsed time. Adjusts `_startTime` (running) or `_pausedElapsed` (paused) and directly updates stores (remaining, phase, currentRep). If the target is past all segments, finishes the timer.

### skipForward

1. Find current segment index from elapsed time
2. If on last segment → finish the timer
3. Otherwise → seek to `startOffset` of next segment

### skipBackward

1. Find current segment index and time spent in it
2. If >2s into segment → restart it (seek to its `startOffset`)
3. If <=2s and not first segment → seek to previous segment's `startOffset`
4. If first segment → restart it (seek to 0)

## Constants

- `GET_READY_DURATION`: 5 seconds
- `MAX_VOLUME`: 32.0 (3200% for cutting through gym noise)
