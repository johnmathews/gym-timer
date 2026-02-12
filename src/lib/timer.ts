import { writable, derived, type Readable } from "svelte/store";
import { log } from "./logger";

export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type TimerPhase = "getReady" | "work" | "rest";

export const GET_READY_DURATION = 3;

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

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume = 0.25,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

/** Ascending major chord fanfare: C5 → E5 → G5 */
export function playFinishSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 523, t, 0.3);
    playTone(ctx, 659, t + 0.2, 0.3);
    playTone(ctx, 784, t + 0.4, 0.5, 0.3);
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio API not available
  }
}

/** Descending two-tone chime: G5 → C5 (signals rest) */
export function playRestStartSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 784, t, 0.25);
    playTone(ctx, 523, t + 0.2, 0.35);
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Web Audio API not available
  }
}

/** Ascending two-tone chime: C5 → G5 (signals back to work) */
export function playRestEndSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 523, t, 0.25);
    playTone(ctx, 784, t + 0.2, 0.35);
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Web Audio API not available
  }
}
