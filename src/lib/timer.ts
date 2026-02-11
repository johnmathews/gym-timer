import { writable, derived, type Readable } from "svelte/store";

export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type TimerPhase = "work" | "rest";

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

        if (currentPhase === "work" && rep < _totalReps && _restDuration > 0) {
          // Work done, start rest
          phase.set("rest");
          return _restDuration;
        } else if (
          currentPhase === "work" &&
          rep < _totalReps &&
          _restDuration === 0
        ) {
          // Work done, skip rest, next rep
          currentRep.set(rep + 1);
          return _workDuration;
        } else if (currentPhase === "rest") {
          // Rest done, next rep
          currentRep.set(rep + 1);
          phase.set("work");
          return _workDuration;
        } else {
          // Final rep work done
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

    if (currentRemaining <= 0) return;
    if (currentStatus === "running") return;

    status.set("running");
    clearTick();

    intervalId = setInterval(tick, 1000);
  }

  function pause() {
    const currentStatus = getStore(status);
    if (currentStatus !== "running") return;

    clearTick();
    status.set("paused");
  }

  function reset() {
    clearTick();
    remaining.set(_workDuration);
    phase.set("work");
    currentRep.set(1);
    status.set("idle");
  }

  function destroy() {
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

export function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.3;

    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.stop(ctx.currentTime + 0.8);

    // Second beep after a short pause
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "square";
    osc2.frequency.value = 880;
    gain2.gain.value = 0.3;
    osc2.start(ctx.currentTime + 1.0);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 1.0);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    osc2.stop(ctx.currentTime + 1.8);

    // Third beep
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = "square";
    osc3.frequency.value = 1100;
    gain3.gain.value = 0.3;
    osc3.start(ctx.currentTime + 2.0);
    gain3.gain.setValueAtTime(0.3, ctx.currentTime + 2.0);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
    osc3.stop(ctx.currentTime + 3.0);

    setTimeout(() => ctx.close(), 4000);
  } catch {
    // Web Audio API not available — silent fallback
  }
}
