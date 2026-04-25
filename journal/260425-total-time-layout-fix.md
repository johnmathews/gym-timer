# Fix total time positioning in landscape and desktop layouts

## What changed

The total time display on the home screen had an awkward layout in landscape
(mobile) and desktop modes: a large gap between the play button and the total
time text, with the time pushed to the far right edge and rendered too small.

### Root cause

`.time` had `flex: 1` which made it expand to fill all remaining row space,
and the inherited `text-align: right` pushed the text to the far edge of
that expanded container.

### Fix

**Landscape mobile** (`orientation: landscape, max-height: 500px`):
- `.time`: `flex: 1` -> `flex: none` (content width, not full row)
- Font size increased: `min(13vw, 7rem)` -> `min(15vw, 8rem)`
- Added `text-align: center`
- Play button slightly smaller, row gap tightened

**Desktop** (`min-width: 1024px`):
- Same `flex: none` + `text-align: center` fix
- Grid columns changed from 50/50 to 45/55 (cards / total-time)
- Play button and time both scaled up 10%

The play button and total time are now a tight centered group in both layouts.
