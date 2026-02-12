import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTime, totalSeconds, createTimer, GET_READY_DURATION, getMasterVolume, setMasterVolume, MAX_VOLUME, initVolume, playFinishSound, playRestStartSound, playWorkStartSound, resetAudioContext, resumeAudioContext } from "./timer";
import { get } from "svelte/store";

describe("formatTime", () => {
  it("formats zero", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats seconds only", () => {
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(59)).toBe("00:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(61)).toBe("01:01");
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(5999)).toBe("99:59");
  });
});

describe("totalSeconds", () => {
  it("converts minutes and seconds", () => {
    expect(totalSeconds(0, 0)).toBe(0);
    expect(totalSeconds(1, 30)).toBe(90);
    expect(totalSeconds(5, 0)).toBe(300);
    expect(totalSeconds(0, 45)).toBe(45);
  });
});

describe("createTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state with 0 remaining", () => {
    const timer = createTimer();
    expect(get(timer.status)).toBe("idle");
    expect(get(timer.remaining)).toBe(0);
    timer.destroy();
  });

  it("sets duration correctly", () => {
    const timer = createTimer();
    timer.setDuration(1, 30);
    expect(get(timer.duration)).toBe(90);
    expect(get(timer.remaining)).toBe(90);
    expect(get(timer.status)).toBe("idle");
    timer.destroy();
  });

  it("does not start with 0 duration", () => {
    const timer = createTimer();
    timer.setDuration(0, 0);
    timer.start();
    expect(get(timer.status)).toBe("idle");
    timer.destroy();
  });

  it("enters getReady phase on start", () => {
    const timer = createTimer();
    timer.setDuration(0, 5);
    timer.start();

    expect(get(timer.status)).toBe("running");
    expect(get(timer.phase)).toBe("getReady");
    expect(get(timer.remaining)).toBe(GET_READY_DURATION);

    timer.destroy();
  });

  it("transitions from getReady to work after countdown", () => {
    const timer = createTimer();
    timer.setDuration(0, 5);
    timer.start();

    // Advance through getReady (3 seconds)
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.remaining)).toBe(5);

    timer.destroy();
  });

  it("counts down each second after getReady", () => {
    const timer = createTimer();
    timer.setDuration(0, 5);
    timer.start();

    // Skip getReady
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.remaining)).toBe(5);

    vi.advanceTimersByTime(1000);
    expect(get(timer.remaining)).toBe(4);

    vi.advanceTimersByTime(1000);
    expect(get(timer.remaining)).toBe(3);

    timer.destroy();
  });

  it("finishes when reaching zero", () => {
    const timer = createTimer();
    timer.setDuration(0, 3);
    timer.start();

    // getReady + work
    vi.advanceTimersByTime((GET_READY_DURATION + 3) * 1000);
    expect(get(timer.remaining)).toBe(0);
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });

  it("pauses and resumes", () => {
    const timer = createTimer();
    timer.setDuration(0, 10);
    timer.start();

    // Skip getReady
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);
    expect(get(timer.phase)).toBe("work");

    vi.advanceTimersByTime(3000);
    expect(get(timer.remaining)).toBe(7);

    timer.pause();
    expect(get(timer.status)).toBe("paused");

    vi.advanceTimersByTime(5000);
    expect(get(timer.remaining)).toBe(7); // didn't change

    timer.start();
    expect(get(timer.status)).toBe("running");

    vi.advanceTimersByTime(2000);
    expect(get(timer.remaining)).toBe(5);

    timer.destroy();
  });

  it("can pause during getReady phase", () => {
    const timer = createTimer();
    timer.setDuration(0, 10);
    timer.start();

    expect(get(timer.phase)).toBe("getReady");
    vi.advanceTimersByTime(1000);
    expect(get(timer.remaining)).toBe(GET_READY_DURATION - 1);

    timer.pause();
    expect(get(timer.status)).toBe("paused");
    expect(get(timer.phase)).toBe("getReady");

    vi.advanceTimersByTime(5000);
    expect(get(timer.remaining)).toBe(GET_READY_DURATION - 1); // didn't change

    timer.start();
    vi.advanceTimersByTime((GET_READY_DURATION - 1) * 1000);
    // Should have transitioned to work
    expect(get(timer.phase)).toBe("work");

    timer.destroy();
  });

  it("resets to original duration", () => {
    const timer = createTimer();
    timer.setDuration(0, 10);
    timer.start();

    vi.advanceTimersByTime((GET_READY_DURATION + 5) * 1000);
    expect(get(timer.remaining)).toBe(5);

    timer.reset();
    expect(get(timer.remaining)).toBe(10);
    expect(get(timer.status)).toBe("idle");
    expect(get(timer.phase)).toBe("work");

    timer.destroy();
  });

  it("resets after finishing", () => {
    const timer = createTimer();
    timer.setDuration(0, 2);
    timer.start();

    vi.advanceTimersByTime((GET_READY_DURATION + 2) * 1000);
    expect(get(timer.status)).toBe("finished");

    timer.reset();
    expect(get(timer.remaining)).toBe(2);
    expect(get(timer.status)).toBe("idle");

    timer.destroy();
  });
});

describe("configure and multi-round", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("configure sets work/rest/reps correctly", () => {
    const timer = createTimer();
    timer.configure(30, 10, 3);

    expect(get(timer.duration)).toBe(30);
    expect(get(timer.remaining)).toBe(30);
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(1);
    expect(get(timer.totalReps)).toBe(3);
    expect(get(timer.status)).toBe("idle");

    timer.destroy();
  });

  it("configure treats reps=0 as reps=1", () => {
    const timer = createTimer();
    timer.configure(30, 10, 0);

    expect(get(timer.totalReps)).toBe(1);

    timer.destroy();
  });

  it("configure treats negative reps as reps=1", () => {
    const timer = createTimer();
    timer.configure(30, 10, -5);

    expect(get(timer.totalReps)).toBe(1);

    timer.destroy();
  });

  it("single rep works with getReady", () => {
    const timer = createTimer();
    timer.configure(5, 0, 1);
    timer.start();

    // getReady phase
    expect(get(timer.phase)).toBe("getReady");
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);

    // work phase
    expect(get(timer.phase)).toBe("work");
    vi.advanceTimersByTime(5000);
    expect(get(timer.remaining)).toBe(0);
    expect(get(timer.status)).toBe("finished");
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(1);

    timer.destroy();
  });

  it("multi-rep with rest cycles getReady→work→rest→work→...→finished", () => {
    const timer = createTimer();
    timer.configure(3, 2, 2);
    timer.start();

    // getReady phase
    expect(get(timer.phase)).toBe("getReady");
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);

    // Rep 1 work: 3s
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(1);
    expect(get(timer.remaining)).toBe(3);

    vi.advanceTimersByTime(3000);
    // After 3s: work done, switch to rest
    expect(get(timer.phase)).toBe("rest");
    expect(get(timer.currentRep)).toBe(1);
    expect(get(timer.remaining)).toBe(2);

    vi.advanceTimersByTime(2000);
    // After 2s rest: switch to rep 2 work
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(2);
    expect(get(timer.remaining)).toBe(3);

    vi.advanceTimersByTime(3000);
    // After 3s: final rep done, finished
    expect(get(timer.remaining)).toBe(0);
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });

  it("multi-rep with rest=0 skips rest", () => {
    const timer = createTimer();
    timer.configure(3, 0, 3);
    timer.start();

    // Skip getReady
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);

    // Rep 1 work
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(1);

    vi.advanceTimersByTime(3000);
    // Skip rest, go to rep 2
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(2);
    expect(get(timer.remaining)).toBe(3);

    vi.advanceTimersByTime(3000);
    // Skip rest, go to rep 3
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(3);
    expect(get(timer.remaining)).toBe(3);

    vi.advanceTimersByTime(3000);
    // Finished
    expect(get(timer.remaining)).toBe(0);
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });

  it("reset mid-run returns to rep 1, work phase", () => {
    const timer = createTimer();
    timer.configure(3, 2, 3);
    timer.start();

    // Skip getReady
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);

    // Advance into rest phase of rep 1
    vi.advanceTimersByTime(3000);
    expect(get(timer.phase)).toBe("rest");
    expect(get(timer.currentRep)).toBe(1);

    vi.advanceTimersByTime(1000);
    // Mid-rest, reset
    timer.reset();

    expect(get(timer.status)).toBe("idle");
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.currentRep)).toBe(1);
    expect(get(timer.remaining)).toBe(3);

    timer.destroy();
  });

  it("reset during getReady returns to idle", () => {
    const timer = createTimer();
    timer.configure(5, 2, 2);
    timer.start();

    expect(get(timer.phase)).toBe("getReady");
    vi.advanceTimersByTime(1000);

    timer.reset();
    expect(get(timer.status)).toBe("idle");
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.remaining)).toBe(5);

    timer.destroy();
  });

  it("phase and currentRep stores update during countdown", () => {
    const timer = createTimer();
    timer.configure(2, 1, 2);
    timer.start();

    // Skip getReady
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);

    const phases: string[] = [];
    const reps: number[] = [];

    // Track each second
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    vi.advanceTimersByTime(1000); // work remaining=1
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    vi.advanceTimersByTime(1000); // work done → rest remaining=1
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    vi.advanceTimersByTime(1000); // rest done → work rep 2 remaining=2
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    vi.advanceTimersByTime(1000); // work remaining=1
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    vi.advanceTimersByTime(1000); // finished
    phases.push(get(timer.phase));
    reps.push(get(timer.currentRep));

    expect(phases).toEqual(["work", "work", "rest", "work", "work", "work"]);
    expect(reps).toEqual([1, 1, 1, 2, 2, 2]);
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });
});

describe("edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("start while already running is a no-op", () => {
    const timer = createTimer();
    timer.configure(10, 0, 1);
    timer.start();
    expect(get(timer.status)).toBe("running");

    // Second start should not reset anything
    timer.start();
    expect(get(timer.status)).toBe("running");
    expect(get(timer.phase)).toBe("getReady");
    expect(get(timer.remaining)).toBe(GET_READY_DURATION);

    timer.destroy();
  });

  it("pause when not running is a no-op", () => {
    const timer = createTimer();
    timer.configure(10, 0, 1);

    // Pause while idle
    timer.pause();
    expect(get(timer.status)).toBe("idle");

    // Pause while finished
    timer.start();
    vi.advanceTimersByTime((GET_READY_DURATION + 10) * 1000);
    expect(get(timer.status)).toBe("finished");
    timer.pause();
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });

  it("start after finished does not restart", () => {
    const timer = createTimer();
    timer.configure(3, 0, 1);
    timer.start();
    vi.advanceTimersByTime((GET_READY_DURATION + 3) * 1000);
    expect(get(timer.status)).toBe("finished");
    expect(get(timer.remaining)).toBe(0);

    timer.start();
    expect(get(timer.status)).toBe("finished");

    timer.destroy();
  });

  it("configure while running stops and resets to idle", () => {
    const timer = createTimer();
    timer.configure(10, 0, 1);
    timer.start();
    vi.advanceTimersByTime(GET_READY_DURATION * 1000);
    expect(get(timer.status)).toBe("running");

    timer.configure(20, 5, 2);
    expect(get(timer.status)).toBe("idle");
    expect(get(timer.remaining)).toBe(20);
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.totalReps)).toBe(2);

    // Timer should not be ticking
    vi.advanceTimersByTime(5000);
    expect(get(timer.remaining)).toBe(20);

    timer.destroy();
  });

  it("setDurationSeconds sets correctly", () => {
    const timer = createTimer();
    timer.setDurationSeconds(45);
    expect(get(timer.duration)).toBe(45);
    expect(get(timer.remaining)).toBe(45);
    timer.destroy();
  });

  it("getReady counts down each second", () => {
    const timer = createTimer();
    timer.configure(10, 0, 1);
    timer.start();

    expect(get(timer.remaining)).toBe(GET_READY_DURATION);
    for (let i = 1; i <= GET_READY_DURATION; i++) {
      vi.advanceTimersByTime(1000);
      if (i < GET_READY_DURATION) {
        expect(get(timer.remaining)).toBe(GET_READY_DURATION - i);
        expect(get(timer.phase)).toBe("getReady");
      }
    }
    // After full getReady, should be in work
    expect(get(timer.phase)).toBe("work");
    expect(get(timer.remaining)).toBe(10);

    timer.destroy();
  });

  it("can restart after reset from finished", () => {
    const timer = createTimer();
    timer.configure(2, 0, 1);
    timer.start();
    vi.advanceTimersByTime((GET_READY_DURATION + 2) * 1000);
    expect(get(timer.status)).toBe("finished");

    timer.reset();
    expect(get(timer.status)).toBe("idle");

    timer.start();
    expect(get(timer.status)).toBe("running");
    expect(get(timer.phase)).toBe("getReady");

    timer.destroy();
  });
});

describe("GET_READY_DURATION constant", () => {
  it("is exported and equals 5", () => {
    expect(GET_READY_DURATION).toBe(5);
  });
});

describe("master volume", () => {
  beforeEach(() => {
    localStorage.clear();
    setMasterVolume(1.0);
  });

  it("getMasterVolume returns set value", () => {
    expect(getMasterVolume()).toBe(1.0);
  });

  it("default volume is half of MAX_VOLUME and not zero", () => {
    localStorage.clear();
    initVolume(); // no localStorage value — should use the built-in default
    expect(getMasterVolume()).toBe(MAX_VOLUME / 2);
    expect(getMasterVolume()).toBeGreaterThan(0);
  });

  it("setMasterVolume updates value", () => {
    setMasterVolume(0.5);
    expect(getMasterVolume()).toBe(0.5);
  });

  it("setMasterVolume clamps values above MAX_VOLUME", () => {
    setMasterVolume(35.0);
    expect(getMasterVolume()).toBe(32.0);
  });

  it("setMasterVolume allows values up to MAX_VOLUME", () => {
    setMasterVolume(16.0);
    expect(getMasterVolume()).toBe(16.0);
    setMasterVolume(32.0);
    expect(getMasterVolume()).toBe(32.0);
  });

  it("setMasterVolume clamps values below 0", () => {
    setMasterVolume(-0.5);
    expect(getMasterVolume()).toBe(0.0);
  });

  it("setMasterVolume writes to localStorage", () => {
    setMasterVolume(0.7);
    expect(localStorage.getItem("gym-timer-volume")).toBe("0.7");
  });

  it("initVolume reads from localStorage", () => {
    localStorage.setItem("gym-timer-volume", "0.3");
    initVolume();
    expect(getMasterVolume()).toBe(0.3);
  });

  it("initVolume ignores invalid localStorage values", () => {
    localStorage.setItem("gym-timer-volume", "notanumber");
    setMasterVolume(0.8);
    initVolume();
    expect(getMasterVolume()).toBe(0.8);
  });
});

describe("sound playback", () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockCompressor: any;
  let mockCtx: any;
  let OriginalAudioContext: any;

  beforeEach(() => {
    resetAudioContext();
    setMasterVolume(1.0);
    mockOscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: "",
      frequency: { value: 0 },
    };
    mockGain = {
      connect: vi.fn(),
      gain: {
        value: 1.0,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    mockCompressor = {
      connect: vi.fn(),
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
    };
    mockCtx = {
      currentTime: 0,
      state: "running",
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      createDynamicsCompressor: vi.fn(() => mockCompressor),
      resume: vi.fn(),
      close: vi.fn(),
    };
    OriginalAudioContext = (window as any).AudioContext;
    (window as any).AudioContext = vi.fn(function(this: any) {
      return Object.assign(this, mockCtx);
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetAudioContext();
    if (OriginalAudioContext) {
      (window as any).AudioContext = OriginalAudioContext;
    } else {
      delete (window as any).AudioContext;
    }
  });

  it("playWorkStartSound creates oscillators and sets gain above zero", () => {
    playWorkStartSound();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    const setCalls = mockGain.gain.setValueAtTime.mock.calls;
    expect(setCalls.length).toBeGreaterThan(0);
    for (const call of setCalls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it("playRestStartSound creates oscillators and sets gain above zero", () => {
    playRestStartSound();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const setCalls = mockGain.gain.setValueAtTime.mock.calls;
    expect(setCalls.length).toBeGreaterThan(0);
    for (const call of setCalls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it("playFinishSound creates oscillators and sets gain above zero", () => {
    playFinishSound();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const setCalls = mockGain.gain.setValueAtTime.mock.calls;
    expect(setCalls.length).toBeGreaterThan(0);
    for (const call of setCalls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it("sounds respect masterVolume scaling", () => {
    setMasterVolume(0.5);
    playWorkStartSound();
    const setCalls = mockGain.gain.setValueAtTime.mock.calls;
    expect(setCalls.length).toBeGreaterThan(0);
    for (const call of setCalls) {
      expect(call[0]).toBeLessThanOrEqual(0.5);
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it("sounds are silent when masterVolume is 0", () => {
    setMasterVolume(0);
    playWorkStartSound();
    expect(mockOscillator.start).not.toHaveBeenCalled();
  });

  it("initial gain value is never exactly zero (prevents exponentialRamp bug)", () => {
    playWorkStartSound();
    const setValueCalls = mockGain.gain.setValueAtTime.mock.calls;
    for (const call of setValueCalls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it("clears prior automation before scheduling (cancelScheduledValues)", () => {
    playWorkStartSound();
    expect(mockGain.gain.cancelScheduledValues).toHaveBeenCalled();
  });

  it("uses DynamicsCompressor when volume exceeds 1.0", () => {
    setMasterVolume(1.5);
    playWorkStartSound();
    expect(mockCtx.createDynamicsCompressor).toHaveBeenCalled();
    expect(mockCompressor.connect).toHaveBeenCalledWith(mockCtx.destination);
    expect(mockGain.connect).toHaveBeenCalledWith(mockCompressor);
  });

  it("does not use DynamicsCompressor when volume is 1.0 or below", () => {
    setMasterVolume(1.0);
    playWorkStartSound();
    expect(mockCtx.createDynamicsCompressor).not.toHaveBeenCalled();
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination);
  });

  it("resumes suspended AudioContext defensively in playTone", () => {
    mockCtx.state = "suspended";
    playWorkStartSound();
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("does not call resume when AudioContext is already running", () => {
    mockCtx.state = "running";
    playWorkStartSound();
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });
});

describe("audio session unlock", () => {
  let mockCtx: any;
  let mockAudioPlay: any;

  beforeEach(() => {
    resetAudioContext();
    mockCtx = {
      currentTime: 0,
      state: "running",
      destination: {},
      createOscillator: vi.fn(),
      createGain: vi.fn(),
      resume: vi.fn(),
    };
    (window as any).AudioContext = vi.fn(function(this: any) {
      return Object.assign(this, mockCtx);
    });

    mockAudioPlay = vi.fn(() => Promise.resolve());
    vi.stubGlobal("Audio", vi.fn(function(this: any) {
      this.play = mockAudioPlay;
      return this;
    }));
  });

  afterEach(() => {
    resetAudioContext();
    vi.unstubAllGlobals();
    delete (navigator as any).audioSession;
  });

  it("plays silent WAV via Audio element to unlock iOS audio session", () => {
    resumeAudioContext();
    expect((window as any).Audio).toHaveBeenCalled();
    const src = (window as any).Audio.mock.calls[0][0];
    expect(src).toContain("data:audio/wav;base64,");
    expect(mockAudioPlay).toHaveBeenCalled();
  });

  it("only unlocks audio session once", async () => {
    resumeAudioContext();
    await Promise.resolve(); // let play().then() resolve
    resumeAudioContext();
    expect(mockAudioPlay).toHaveBeenCalledTimes(1);
  });

  it("resetAudioContext resets the unlock flag", async () => {
    resumeAudioContext();
    await Promise.resolve();
    resetAudioContext();
    resumeAudioContext();
    expect(mockAudioPlay).toHaveBeenCalledTimes(2);
  });

  it("sets navigator.audioSession.type to ambient when available", () => {
    const mockSession = { type: "playback" };
    (navigator as any).audioSession = mockSession;
    resumeAudioContext();
    expect(mockSession.type).toBe("ambient");
  });

  it("does not throw when navigator.audioSession is unavailable", () => {
    delete (navigator as any).audioSession;
    expect(() => resumeAudioContext()).not.toThrow();
  });
});
