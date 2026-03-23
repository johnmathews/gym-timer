# 260323 — New Features

## Slider Scale Refinement

Changed the non-uniform time scale for work/rest pickers:
- **Before:** 5s steps to 60s, 15s to 3min, 30s to 10min
- **After:** 5s steps to 60s, 10s to 5min, 30s to 10min

The 15s/30s increments above 60s were too coarse. The new 10s steps give much finer control in the 1-5 minute range where most intervals land. The 30s steps above 5min are kept since precision matters less at longer durations.

Also increased max repeats from 10 to 20.

## Progress Bar — Current Segment Indicator

The progress bar at the top of the active screen now distinguishes three segment states:
- **Completed** (dark): reps that are done
- **Current** (grey): the rep in progress
- **Future** (light): upcoming reps

Previously, completed and current segments both appeared dark, making it hard to tell which segment was active at a glance.

In paused state, completed segments are amber and the current segment is semi-transparent amber.

## Live Rep Editing (Desktop)

New keyboard shortcuts during an active workout:
- **Up arrow**: adds a rep to the end of the workout
- **Down arrow**: removes the last rep (only if it hasn't been reached yet)

This allows on-the-fly adjustment without restarting. The timeline is modified in place — `addRep()` appends work (and rest if applicable) segments, `removeRep()` pops them off the end. No progress is lost.

Guard rails: can't remove the current or past reps, can't go below 1 rep, no-op when idle or finished.

## Finished Animation

- Flash speed increased 40% (cycle time 1.92s to 1.152s)
- Cycle count increased from 6 to 10 (same ~11.5s total duration)
- Ends on cyan (`#00bcd4`) instead of black — more celebratory
