import { writable, derived, type Readable } from "svelte/store";
import { log } from "./logger";

export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type TimerPhase = "getReady" | "work" | "rest";

export const GET_READY_DURATION = 5;

const VOLUME_STORAGE_KEY = "gym-timer-volume";
let _masterVolume = 1.0;

export function getMasterVolume(): number {
  return _masterVolume;
}

export const MAX_VOLUME = 8.0;

export function setMasterVolume(v: number): void {
  _masterVolume = Math.max(0, Math.min(MAX_VOLUME, v));
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(_masterVolume));
  } catch {
    // localStorage not available
  }
}

export function initVolume(): void {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) {
        _masterVolume = Math.max(0, Math.min(MAX_VOLUME, parsed));
      }
    }
  } catch {
    // localStorage not available
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
  }

  function setDuration(minutes: number, seconds: number) {
    configure(totalSeconds(minutes, seconds), 0, 1);
  }

  function setDurationSeconds(secs: number) {
    configure(secs, 0, 1);
  }

  function tick() {
    remaining.update((r) => {
      const next = r - 1;
      if (next <= 0) {
        const currentPhase = getStore(phase);
        const rep = getStore(currentRep);

        if (currentPhase === "getReady") {
          // Get ready done, start first work phase
          log("phase:getReady→work");
          phase.set("work");
          return _workDuration;
        } else if (currentPhase === "work" && rep < _totalReps && _restDuration > 0) {
          // Work done, start rest
          log("phase:work→rest", { rep });
          phase.set("rest");
          return _restDuration;
        } else if (
          currentPhase === "work" &&
          rep < _totalReps &&
          _restDuration === 0
        ) {
          // Work done, skip rest, next rep
          log("phase:skip-rest", { rep: rep + 1 });
          currentRep.set(rep + 1);
          return _workDuration;
        } else if (currentPhase === "rest") {
          // Rest done, next rep
          log("phase:rest→work", { rep: rep + 1 });
          currentRep.set(rep + 1);
          phase.set("work");
          return _workDuration;
        } else {
          // Final rep work done
          log("finished");
          clearTick();
          status.set("finished");
          return 0;
        }
      }
      return next;
    });
  }

  function start() {
    const currentRemaining = getStore(remaining);
    const currentStatus = getStore(status);

    if (currentStatus === "running") return;
    if (currentStatus === "idle" && _workDuration <= 0) return;
    if (currentStatus !== "idle" && currentRemaining <= 0) return;

    log("start", { status: currentStatus, remaining: currentRemaining });

    if (currentStatus === "idle") {
      // Enter getReady phase before starting work
      phase.set("getReady");
      remaining.set(GET_READY_DURATION);
    }

    status.set("running");
    clearTick();

    intervalId = setInterval(tick, 1000);
  }

  function pause() {
    const currentStatus = getStore(status);
    if (currentStatus !== "running") return;

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
  }

  function destroy() {
    log("destroy");
    clearTick();
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
}

/** Resume the shared AudioContext — must be called from a user gesture
 *  handler (tap/click) so iOS Safari unlocks audio playback. */
export function resumeAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // Web Audio API not available
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

  // Use a compressor when volume exceeds 1.0 to boost loudness
  // without harsh digital clipping (useful on iOS over background music)
  if (_masterVolume > 1.0) {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.1;
    gain.connect(compressor);
    compressor.connect(ctx.destination);
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
