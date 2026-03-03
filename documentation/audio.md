# Audio System

## Overview

The timer uses the Web Audio API to generate synthesized sounds for phase transitions. All audio logic lives in `src/lib/timer.ts`.

## Sounds

| Event       | Function              | Description                              |
|-------------|-----------------------|------------------------------------------|
| Work start  | `playWorkStartSound`  | Bright ascending triad: C6 → E6 → G6    |
| Rest start  | `playRestStartSound`  | Descending two-tone chime: G5 → C5       |
| Pause       | `playPauseSound`      | Descending tone: 500Hz → 350Hz           |
| Resume      | `playResumeSound`     | Ascending tone: 350Hz → 500Hz            |
| Countdown tick (3/2/1 before work) | `playCountdownDing` | 880Hz A5 sine tone (plays during getReady, rest, and work when rest=0) |
| Finish      | `playFinishSound`     | Ascending major chord fanfare: C5 → E5 → G5 |

Each sound is built from overlapping sine wave oscillators with exponential decay envelopes.

## Volume System

Volume is controlled by `_masterVolume`, a multiplier applied to every tone:

- **Mobile range**: 0 to `MAX_VOLUME` (32.0 = 3200% boost)
- **Desktop range**: 0 to `DESKTOP_MAX_VOLUME` (16.0 = 1600% boost)
- **Mobile default**: 60% of MAX_VOLUME (19.2)
- **Desktop default**: 40% of MAX_VOLUME (12.8)
- **Persisted** in `localStorage` under key `timer-volume`

Desktop detection uses `window.matchMedia("(hover: hover)")` — hover-capable devices get a lower default since desktop speakers are typically louder than phone speakers.

### Volume Slider (Quadratic Curve)

The volume slider in `VolumeControl.svelte` uses a quadratic mapping so most of the slider's physical range covers the quiet end:

- `volume = (sliderPosition / SLIDER_MAX)² × MAX_VOLUME`
- At 25% slider → 6% of max volume
- At 50% slider → 25% of max volume
- At 75% slider → 56% of max volume

This gives fine-grained control at low volumes (important for desktop speakers) while still allowing the full 3200% boost at the far end (needed for phone speakers in a noisy gym).

The icon changes based on slider position: muted (0%), low (0–33%), high (33–66%), boost with `+` indicator (66–100%).

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

### Audio Robustness

To handle iOS re-suspension after screen lock/unlock and app backgrounding:

- **`warmAudioContext()`** — Called on visibility change (when page becomes visible) to re-initialize the audio context and reset state
- **`startKeepAlive()` / `stopKeepAlive()`** — Periodic silent oscillator (every 30s) keeps the audio context active and prevents re-suspension during long pauses
- **`_audioSessionUnlocked` flag** — Reset on `visibilitychange→hidden` to detect when audio context needs re-warming on next visibility change

### Trade-offs

- `"ambient"` mode respects the iOS silent switch (sounds won't play if muted) — acceptable for gym use where the phone is typically not on silent
- `"playback"` mode would ignore the silent switch but would pause other apps, which is worse for the use case
