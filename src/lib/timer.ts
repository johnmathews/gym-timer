import { writable, derived, type Readable } from "svelte/store";
import { log } from "./logger";

export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type TimerPhase = "getReady" | "work" | "rest";

export const GET_READY_DURATION = 5;

const VOLUME_STORAGE_KEY = "timer-volume";
export const MAX_VOLUME = 32.0;
let _masterVolume = MAX_VOLUME * 0.60;

export function getMasterVolume(): number {
  return _masterVolume;
}

export function setMasterVolume(v: number): void {
  _masterVolume = Math.max(0, Math.min(MAX_VOLUME, v));
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(_masterVolume));
  } catch {
    // localStorage not available
  }
}

const DEFAULT_VOLUME = MAX_VOLUME * 0.60;
const DESKTOP_DEFAULT_VOLUME = MAX_VOLUME * 0.40;

export function initVolume(): void {
  _masterVolume = DEFAULT_VOLUME;
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) {
        _masterVolume = Math.max(0, Math.min(MAX_VOLUME, parsed));
        return;
      }
    }
  } catch {
    // localStorage not available
  }
  // No stored value — use lower default on desktop (hover-capable devices)
  try {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      _masterVolume = DESKTOP_DEFAULT_VOLUME;
    }
  } catch {
    // matchMedia not available
  }
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function totalSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

export function createTimer() {
  const duration = writable(0);
  const remaining = writable(0);
  const status = writable<TimerStatus>("idle");
  const phase = writable<TimerPhase>("work");
  const currentRep = writable(1);
  const totalReps = writable(1);

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let _workDuration = 0;
  let _restDuration = 0;
  let _totalReps = 1;

  // Wall-clock state: the timer calculates its position from elapsed real
  // time rather than counting interval ticks, so it catches up correctly
  // when the browser suspends setInterval (e.g. screen off on mobile).
  let _timeline: { phase: TimerPhase; rep: number; duration: number; startOffset: number }[] = [];
  let _startTime = 0;          // Date.now() when the timer effectively started
  let _pausedElapsed = 0;      // ms elapsed when paused (restored on resume)
  let _visibilityHandler: (() => void) | null = null;

  function clearTick() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function getStore<T>(store: {
    subscribe: (fn: (v: T) => void) => () => void;
  }): T {
    let value: T;
    store.subscribe((v) => (value = v))();
    return value!;
  }

  function buildTimeline(): typeof _timeline {
    const segments: typeof _timeline = [];
    let offset = 0;

    segments.push({ phase: "getReady", rep: 1, duration: GET_READY_DURATION, startOffset: offset });
    offset += GET_READY_DURATION;

    for (let rep = 1; rep <= _totalReps; rep++) {
      segments.push({ phase: "work", rep, duration: _workDuration, startOffset: offset });
      offset += _workDuration;

      if (rep < _totalReps && _restDuration > 0) {
        segments.push({ phase: "rest", rep, duration: _restDuration, startOffset: offset });
        offset += _restDuration;
      }
    }

    return segments;
  }

  /** Recalculate timer state from wall-clock elapsed time. */
  function syncState() {
    // Guard: ignore stale tick callbacks that fire after clearInterval
    // (iOS Safari batches timer events and flushes them from the event
    // queue even after the interval is cleared).
    if (getStore(status) !== "running") return;

    const elapsed = Math.floor((Date.now() - _startTime) / 1000);

    for (const seg of _timeline) {
      const segEnd = seg.startOffset + seg.duration;
      if (elapsed < segEnd) {
        remaining.set(segEnd - elapsed);
        phase.set(seg.phase);
        currentRep.set(seg.rep);
        return;
      }
    }

    // Past all segments — finished
    clearTick();
    remaining.set(0);
    status.set("finished");
  }

  function configure(work: number, rest: number, reps: number) {
    log("configure", { work, rest, reps });
    _workDuration = work;
    _restDuration = rest;
    _totalReps = reps <= 0 ? 1 : reps;
    duration.set(work);
    remaining.set(work);
    phase.set("work");
    currentRep.set(1);
    totalReps.set(_totalReps);
    status.set("idle");
    clearTick();
    _timeline = [];
    _startTime = 0;
    _pausedElapsed = 0;
  }

  function setDuration(minutes: number, seconds: number) {
    configure(totalSeconds(minutes, seconds), 0, 1);
  }

  function setDurationSeconds(secs: number) {
    configure(secs, 0, 1);
  }

  function tick() {
    syncState();
  }

  function start() {
    const currentRemaining = getStore(remaining);
    const currentStatus = getStore(status);

    if (currentStatus === "running") return;
    if (currentStatus === "idle" && _workDuration <= 0) return;
    if (currentStatus !== "idle" && currentRemaining <= 0) return;

    log("start", { status: currentStatus, remaining: currentRemaining });

    if (currentStatus === "idle") {
      _timeline = buildTimeline();
      _startTime = Date.now();
      _pausedElapsed = 0;
      phase.set("getReady");
      remaining.set(GET_READY_DURATION);
    } else if (currentStatus === "paused") {
      // Restore the effective start time so elapsed picks up where it left off
      _startTime = Date.now() - _pausedElapsed;
    }

    status.set("running");
    clearTick();
    intervalId = setInterval(tick, 1000);

    // Catch up immediately when the page becomes visible after suspension
    if (typeof document !== "undefined" && !_visibilityHandler) {
      _visibilityHandler = () => {
        if (document.visibilityState === "visible" && getStore(status) === "running") {
          syncState();
        }
      };
      document.addEventListener("visibilitychange", _visibilityHandler);
    }
  }

  function pause() {
    const currentStatus = getStore(status);
    if (currentStatus !== "running") return;

    _pausedElapsed = Date.now() - _startTime;
    log("pause", { remaining: getStore(remaining) });
    clearTick();
    status.set("paused");
  }

  function reset() {
    log("reset");
    clearTick();
    remaining.set(_workDuration);
    phase.set("work");
    currentRep.set(1);
    status.set("idle");
    _timeline = [];
    _startTime = 0;
    _pausedElapsed = 0;
  }

  function destroy() {
    log("destroy");
    clearTick();
    if (typeof document !== "undefined" && _visibilityHandler) {
      document.removeEventListener("visibilitychange", _visibilityHandler);
      _visibilityHandler = null;
    }
  }

  return {
    duration: { subscribe: duration.subscribe } as Readable<number>,
    remaining: { subscribe: remaining.subscribe } as Readable<number>,
    status: { subscribe: status.subscribe } as Readable<TimerStatus>,
    phase: { subscribe: phase.subscribe } as Readable<TimerPhase>,
    currentRep: { subscribe: currentRep.subscribe } as Readable<number>,
    totalReps: { subscribe: totalReps.subscribe } as Readable<number>,
    setDuration,
    setDurationSeconds,
    configure,
    start,
    pause,
    reset,
    destroy,
  };
}

let _audioCtx: AudioContext | null = null;
let _audioSessionUnlocked = false;
let _masterCompressor: DynamicsCompressorNode | null = null;

// Minimal silent WAV (1 sample, 16-bit mono, 44.1kHz) used to upgrade
// iOS Safari's audio session from "ambient" to "playback".
const SILENT_WAV = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";

/** Get or create the shared AudioContext. Call resumeAudioContext() on user
 *  gesture to unlock playback on iOS Safari. */
function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

/** Reset the shared AudioContext (for testing). */
export function resetAudioContext(): void {
  _audioCtx = null;
  _audioSessionUnlocked = false;
  _masterCompressor = null;
}

/** Resume the shared AudioContext and upgrade the audio session — must be
 *  called from a user gesture handler (tap/click) so iOS Safari unlocks
 *  audio playback and allows mixing with other apps. */
export function resumeAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // Web Audio API not available
  }

  // Set iOS audio session to "ambient" so our short alert sounds mix
  // with other apps (YouTube, Spotify, etc.) instead of stopping them.
  // Playing a silent WAV via <audio> during a user gesture ensures iOS
  // Safari fully initialises the audio session.
  if (!_audioSessionUnlocked) {
    try {
      const nav = navigator as any;
      if (nav.audioSession) {
        nav.audioSession.type = "ambient";
      }
    } catch {
      // audioSession API not available
    }
    try {
      const audio = new Audio(SILENT_WAV);
      audio.play().then(() => {
        _audioSessionUnlocked = true;
      }).catch(() => {});
    } catch {
      // Audio element not available
    }
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume = 1.0,
): void {
  // Defensive resume: if iOS re-suspended the context (e.g. after
  // screen lock/unlock), try to resume it so sounds aren't dropped.
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);

  // Route through a shared compressor when volume exceeds 1.0 to boost
  // loudness without clipping. A single compressor for all tones prevents
  // distortion when multiple tones overlap (each per-tone compressor would
  // independently pass a loud signal, and the sum would clip at the output).
  if (_masterVolume > 1.0) {
    if (!_masterCompressor) {
      _masterCompressor = ctx.createDynamicsCompressor();
      _masterCompressor.threshold.value = -10;
      _masterCompressor.knee.value = 10;
      _masterCompressor.ratio.value = 4;
      _masterCompressor.attack.value = 0.003;
      _masterCompressor.release.value = 0.1;
      _masterCompressor.connect(ctx.destination);
    }
    gain.connect(_masterCompressor);
  } else {
    gain.connect(ctx.destination);
  }

  osc.type = "sine";
  osc.frequency.value = freq;
  const effectiveVolume = volume * _masterVolume;
  if (effectiveVolume <= 0) return;

  // Ensure scheduled time is slightly in the future so iOS Safari
  // doesn't discard automation events that land in the past.
  const safeStart = Math.max(start, ctx.currentTime + 0.005);

  // Direct assignment as fallback if all scheduled automation is ignored.
  gain.gain.value = effectiveVolume;
  // Clear any prior automation, then start at full volume and decay.
  // Avoids the ramp-up from near-zero which iOS can silently skip.
  gain.gain.cancelScheduledValues(0);
  gain.gain.setValueAtTime(effectiveVolume, safeStart);
  gain.gain.exponentialRampToValueAtTime(0.001, safeStart + duration);
  osc.start(safeStart);
  osc.stop(safeStart + duration);
}

/** Ascending major chord fanfare: C5 → E5 → G5 */
export function playFinishSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 523, t, 0.3, 1.0);
    playTone(ctx, 659, t + 0.2, 0.3, 1.0);
    playTone(ctx, 784, t + 0.4, 0.5, 1.0);
  } catch {
    // Web Audio API not available
  }
}

/** Descending two-tone chime: G5 → C5 (signals rest) */
export function playRestStartSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 784, t, 0.25, 1.0);
    playTone(ctx, 523, t + 0.2, 0.35, 1.0);
  } catch {
    // Web Audio API not available
  }
}

/** Bright bell: quick ascending triad C6 → E6 → G6 with shimmer */
export function playWorkStartSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Bright bell tones (octave higher for energy)
    playTone(ctx, 1047, t, 0.15, 0.9);       // C6
    playTone(ctx, 1319, t + 0.08, 0.15, 0.9); // E6
    playTone(ctx, 1568, t + 0.16, 0.3, 1.0);  // G6 (ring longer)
  } catch {
    // Web Audio API not available
  }
}
