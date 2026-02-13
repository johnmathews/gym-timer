# Audio System

## Overview

The timer uses the Web Audio API to generate synthesized sounds for phase transitions. All audio logic lives in `src/lib/timer.ts`.

## Sounds

| Event       | Function              | Description                              |
|-------------|-----------------------|------------------------------------------|
| Work start  | `playWorkStartSound`  | Bright ascending triad: C6 → E6 → G6    |
| Rest start  | `playRestStartSound`  | Descending two-tone chime: G5 → C5       |
| Finish      | `playFinishSound`     | Ascending major chord fanfare: C5 → E5 → G5 |

Each sound is built from overlapping sine wave oscillators with exponential decay envelopes.

## Volume System

Volume is controlled by `_masterVolume`, a multiplier applied to every tone:

- **Range**: 0 to `MAX_VOLUME` (32.0)
- **Mobile default**: 60% of MAX_VOLUME (19.2)
- **Desktop default**: 40% of MAX_VOLUME (12.8)
- **Persisted** in `localStorage` under key `timer-volume`

Desktop detection uses `window.matchMedia("(hover: hover)")` — hover-capable devices get a lower default since desktop speakers are typically louder than phone speakers.

### Volume Boost & Compression

When `_masterVolume > 1.0`, tones are routed through a shared `DynamicsCompressorNode` to boost loudness without clipping:

- Threshold: -10 dB
- Knee: 10 dB
- Ratio: 4:1
- Attack: 3ms
- Release: 100ms

A single shared compressor prevents distortion when multiple tones overlap (individual per-tone compressors would each pass loud signals whose sum would clip).

## iOS Audio Session

iOS Safari requires special handling for audio:

1. **AudioContext must be resumed on user gesture** — `resumeAudioContext()` is called on tap/click
2. **Audio session type** is set to `"ambient"` via `navigator.audioSession.type` so timer sounds mix with other apps (YouTube, Spotify) instead of pausing them
3. **Silent WAV playback** — a minimal 1-sample WAV is played during the user gesture to fully initialize the iOS audio session
4. **Defensive resume** — `playTone()` checks if the context was re-suspended (e.g., after screen lock/unlock) and resumes it

### Trade-offs

- `"ambient"` mode respects the iOS silent switch (sounds won't play if muted) — acceptable for gym use where the phone is typically not on silent
- `"playback"` mode would ignore the silent switch but would pause other apps, which is worse for the use case
