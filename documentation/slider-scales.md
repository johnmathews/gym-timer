# Slider Scales (RulerPicker)

## Overview

The app uses a custom vertical ruler picker (`src/lib/components/RulerPicker.svelte`) for selecting work time, rest time, and repeat count. The picker displays a full-screen vertical ruler with tick marks, a colored fill region, and a draggable handle.

## Non-Uniform Time Scales

Time pickers use non-uniform increments to provide fine control at short durations and coarser steps at longer ones:

| Range       | Step Size | Rationale                              |
|-------------|-----------|----------------------------------------|
| 0–60s       | 5s        | Fine-grained for short intervals       |
| 60s–3min    | 15s       | Quarter-minute precision               |
| 3min–10min  | 30s       | Half-minute steps for longer durations |

### Value Ranges

- **Work**: 5s to 10min (5s minimum ensures a meaningful interval)
- **Rest**: 0s to 5min (0 = no rest between reps; lower cap since rest is typically shorter)
- **Repeats**: 1 to 10 (uniform integer scale)

### Scale Generation

The `generateTimeValues(min, max)` function in `+page.svelte` builds the values array:

```typescript
function generateTimeValues(min: number, max: number): number[] {
  const result: number[] = [];
  let v = min;
  while (v <= max) {
    result.push(v);
    if (v < 60) v += 5;
    else if (v < 180) v += 15;
    else v += 30;
  }
  return result;
}
```

## Uniform Visual Spacing

All values are spaced equally on the ruler regardless of their numeric distance. This means 5s→10s occupies the same vertical space as 300s→330s. This is intentional — every selectable value gets equal visual weight, making it easy to tap any value.

The picker works with an index-based system:

- `valueIndex` = position of current value in the `values[]` array
- `fillPercent` = `(valueIndex / maxIndex) * 100`
- `valueFromY()` maps pointer Y position → array index → value

## Tick Labels

Tick labels appear at intervals defined by `rulerLabelInterval` (e.g., every 60s for time pickers, every 1 for repeats). The label at value 0 is suppressed since it would overlap with the bottom of the ruler.

## Interaction

- **Pointer down**: captures pointer, immediately updates value
- **Pointer move**: updates value while dragging
- **Pointer up**: releases pointer, calls `onclose` to dismiss
- **Header tap**: confirms and closes
- **Cancel button**: reverts to pre-open value via `oncancel`
