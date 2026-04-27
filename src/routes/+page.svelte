<script lang="ts">
 import { onMount, onDestroy } from "svelte";
 import {
  createTimer,
  playFinishSound,
  playRestStartSound,
  playWorkStartSound,
  playPauseSound,
  playResumeSound,
  playCountdownDing,
  initVolume,
  resumeAudioContext,
  warmAudioContext,
  startKeepAlive,
  stopKeepAlive,
  toggleMute,
 } from "$lib/timer";
 import { log } from "$lib/logger";
 import { DEFAULT_PRESETS, fetchPresets } from "$lib/presets";
 import ConfigCard from "$lib/components/ConfigCard.svelte";
 import RulerPicker from "$lib/components/RulerPicker.svelte";
 import TotalTimeDisplay from "$lib/components/TotalTimeDisplay.svelte";
 import CountdownDisplay from "$lib/components/CountdownDisplay.svelte";
 import PhaseHeader from "$lib/components/PhaseHeader.svelte";
 import VolumeControl from "$lib/components/VolumeControl.svelte";
 import FullscreenButton from "$lib/components/FullscreenButton.svelte";
 import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";

 interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
 }

 interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => void;
 }

 const timer = createTimer();
 const { remaining, status, phase, currentRep, totalReps } = timer;

 let duration = $state(60);
 let rest = $state(0);
 let reps = $state(10);
 let prevStatus: string = "idle";
 let prevPhase: string = "work";
 let prevRep: number = 1;
 let prevRemaining: number = 0;

 let presets = $state(DEFAULT_PRESETS);
 let presetIndex = $state(0);

 let activePicker: "work" | "rest" | "repeat" | null = $state(null);
 let pickerOriginalValue = $state(0);
 let showShortcuts = $state(false);
 let volumeSyncTrigger = $state(0);

 // Wake lock: always-on when timer is active
 let wakeLock: WakeLockSentinel | null = null;
 let canWakeLock = $state(false);

 async function acquireWakeLock() {
  if (!canWakeLock) return;
  try {
   wakeLock = await navigator.wakeLock.request("screen");
   wakeLock.addEventListener("release", () => {
    wakeLock = null;
   });
  } catch {
   // Wake lock request failed (e.g. page not visible)
  }
 }

 async function releaseWakeLock() {
  if (wakeLock) {
   await wakeLock.release();
   wakeLock = null;
  }
 }

 $effect(() => {
  if (isActive) {
   if (canWakeLock) acquireWakeLock();
   startKeepAlive();
  } else {
   releaseWakeLock();
   stopKeepAlive();
  }
 });

 onMount(() => {
  canWakeLock = "wakeLock" in navigator;
  initVolume();
  log("mount", { duration, rest, reps });
  timer.configure(duration, rest, reps);

  // Load runtime presets from server (mounted config file)
  fetchPresets().then((fetched) => {
   if (fetched) {
    presets = fetched;
    presetIndex = 0;
    applyPreset(0);
    log("presets:runtime", { count: fetched.length });
   }
  });

  function handleVisibility() {
   if (document.visibilityState === "visible") {
    if (isActive && !wakeLock) acquireWakeLock();
    if (isActive) warmAudioContext();
   }
  }
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
 });

 onDestroy(() => {
  releaseWakeLock();
  timer.destroy();
 });

 function displayTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
 }

 const totalTime = $derived(() => {
  const workTotal = duration * reps;
  const restTotal = rest * Math.max(0, reps - 1);
  return workTotal + restTotal;
 });

 const totalTimeDisplay = $derived(displayTime(totalTime()));

 function handleStart() {
  resumeAudioContext();
  let currentStatus: string;
  status.subscribe((v) => (currentStatus = v))();
  log("ui:start", { status: currentStatus! });
  if (currentStatus! === "idle") {
   timer.configure(duration, rest, reps);
  }
  timer.start();
 }

 $effect(() => {
  const s = $status;
  const p = $phase;
  const r = $currentRep;
  const rem = $remaining;
  if (s === "finished" && prevStatus !== "finished") {
   log("ui:finishSound");
   playFinishSound();
  }
  if (s === "running") {
   if (p === "work" && (prevPhase !== "work" || r !== prevRep)) {
    log("ui:workStartSound");
    playWorkStartSound();
   } else if (p === "rest" && prevPhase === "work") {
    log("ui:restStartSound");
    playRestStartSound();
   }
   // Countdown ding 5, 4, 3, 2, 1 seconds before work starts
   const beforeWork = p === "getReady" || p === "rest" || (p === "work" && rest === 0 && r < $totalReps);
   const phaseChanged = p !== prevPhase || r !== prevRep;
   if (beforeWork && rem <= 5 && rem >= 1 && (rem < prevRemaining || phaseChanged)) {
    log("ui:countdownDing", { remaining: rem });
    playCountdownDing();
   }
  }
  prevStatus = s;
  prevPhase = p;
  prevRep = r;
  prevRemaining = rem;
 });

 const canStart = $derived(duration > 0);
 const isFinished = $derived($status === "finished");
 const isActive = $derived($status === "running" || $status === "paused");
 const isPaused = $derived($status === "paused");
 const isRunning = $derived($status === "running");
 const isGetReady = $derived(isRunning && $phase === "getReady");
 const isWork = $derived(isRunning && $phase === "work");
 const isRest = $derived(isRunning && $phase === "rest");

 let swipeStartX = 0;
 let swipeStartY = 0;
 let swipePointerId = -1;

 function handlePointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest("button")) return;
  if ((e.target as HTMLElement).closest(".active-toolbar")) return;
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
  swipePointerId = e.pointerId;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
 }

 function handlePointerUp(e: PointerEvent) {
  if (e.pointerId !== swipePointerId) return;
  swipePointerId = -1;

  const deltaX = e.clientX - swipeStartX;
  const deltaY = e.clientY - swipeStartY;

  if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.max(100, Math.abs(deltaX) * 1.5)) {
   resumeAudioContext();
   if (deltaX < 0) {
    timer.skipForward();
   } else {
    timer.skipBackward();
   }
  } else {
   resumeAudioContext();
   if ($status === "running") {
    log("ui:pause");
    playPauseSound();
    timer.pause();
   } else if ($status === "paused") {
    log("ui:resume");
    playResumeSound();
    timer.start();
   }
  }
 }

 function handleReset() {
  log("ui:reset");
  timer.reset();
 }

 // Preset cycling
 function applyPreset(index: number) {
  const preset = presets[index];
  duration = preset.work;
  rest = preset.rest;
  reps = preset.reps;
  timer.configure(duration, rest, reps);
  log("preset:apply", { index, ...preset });
 }

 function cyclePreset(direction: 1 | -1) {
  presetIndex = (((presetIndex + direction) % presets.length) + presets.length) % presets.length;
  applyPreset(presetIndex);
 }

 // Home screen swipe handling
 let homeSwipeStartX = 0;
 let homeSwipeStartY = 0;
 let homeSwipePointerId = -1;
 let homePointerCaptured = false;
 let suppressNextHomeClick = false;

 // Trackpad 2-finger horizontal swipe on home screen.
 // After firing we hold a hard cooldown (events discarded), then the
 // first post-cooldown event is gated by a freshness check: either a
 // real idle gap (>=80ms with no events — the normal between-gestures
 // pause) or a single-event magnitude consistent with a new push
 // (>=30px). Decaying inertia at the cooldown boundary is below both,
 // so it gets filtered and a hard swipe still fires exactly once.
 let wheelAccumX = 0;
 let wheelLockedUntil = 0;
 let lastWheelTime = 0;
 let wheelNeedsFresh = false;
 const WHEEL_THRESHOLD = 60;
 const WHEEL_COOLDOWN_MS = 300;
 const WHEEL_FRESH_GAP_MS = 80;
 const WHEEL_FRESH_MAG = 30;

 function handleHomeWheel(e: WheelEvent) {
  // Only act on horizontal-dominant gestures; let vertical scroll pass through.
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();

  const now = performance.now();
  const gap = now - lastWheelTime;
  const mag = Math.abs(e.deltaX);
  lastWheelTime = now;

  // Hard cooldown after firing — every event in this window is inertia.
  if (now < wheelLockedUntil) {
   wheelAccumX = 0;
   wheelNeedsFresh = true;
   return;
  }

  // First event past cooldown must look like a real new gesture.
  if (wheelNeedsFresh) {
   if (gap < WHEEL_FRESH_GAP_MS && mag < WHEEL_FRESH_MAG) return;
   wheelNeedsFresh = false;
   wheelAccumX = 0;
  }

  wheelAccumX += e.deltaX;
  if (Math.abs(wheelAccumX) <= WHEEL_THRESHOLD) return;

  // Mac default (natural scrolling): finger-right → deltaX < 0.
  // Match touch drag-to-pan: physical finger-right = next preset.
  if (wheelAccumX < 0) cyclePreset(1);
  else cyclePreset(-1);

  wheelLockedUntil = now + WHEEL_COOLDOWN_MS;
  wheelAccumX = 0;
  wheelNeedsFresh = false;
 }

 function handleHomePointerDown(e: PointerEvent) {
  // Toolbar buttons (volume, fullscreen) keep tap-only behaviour;
  // ConfigCards intentionally participate so swipes that start on a card cycle presets.
  if ((e.target as HTMLElement).closest(".toolbar")) return;
  homeSwipeStartX = e.clientX;
  homeSwipeStartY = e.clientY;
  homeSwipePointerId = e.pointerId;
  homePointerCaptured = false;
  // Do NOT setPointerCapture here — that would redirect the synthesized click
  // away from the ConfigCard button, breaking tap-to-open-picker. We only
  // capture once movement clearly indicates a drag (see handleHomePointerMove).
 }

 function handleHomePointerMove(e: PointerEvent) {
  if (e.pointerId !== homeSwipePointerId || homePointerCaptured) return;
  if (Math.abs(e.clientX - homeSwipeStartX) > 10) {
   (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
   homePointerCaptured = true;
  }
 }

 function handleHomePointerUp(e: PointerEvent) {
  if (e.pointerId !== homeSwipePointerId) return;
  homeSwipePointerId = -1;
  homePointerCaptured = false;

  const deltaX = e.clientX - homeSwipeStartX;
  const deltaY = e.clientY - homeSwipeStartY;

  if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.max(100, Math.abs(deltaX) * 1.5)) {
   // Drag-to-pan semantics, matches ArrowLeft/Right: swipe right → next, swipe left → previous.
   if (deltaX < 0) {
    cyclePreset(-1);
   } else {
    cyclePreset(1);
   }
   // Stop the synthesized click that follows pointerup from opening a picker.
   suppressNextHomeClick = true;
   setTimeout(() => {
    suppressNextHomeClick = false;
   }, 0);
  }
 }

 function handleHomeClickCapture(e: MouseEvent) {
  if (suppressNextHomeClick) {
   suppressNextHomeClick = false;
   e.stopPropagation();
   e.preventDefault();
  }
 }

 // Picker helpers
 function openPicker(which: "work" | "rest" | "repeat") {
  if (which === "work") pickerOriginalValue = duration;
  else if (which === "rest") pickerOriginalValue = rest;
  else pickerOriginalValue = reps;
  activePicker = which;
 }

 function handlePickerChange(value: number) {
  if (activePicker === "work") duration = value;
  else if (activePicker === "rest") rest = value;
  else if (activePicker === "repeat") reps = value;
 }

 function closePicker() {
  if (activePicker) {
   log("pickerClose", { picker: activePicker, duration, rest, reps });
   timer.configure(duration, rest, reps);
  }
  activePicker = null;
 }

 function cancelPicker() {
  if (activePicker === "work") duration = pickerOriginalValue;
  else if (activePicker === "rest") rest = pickerOriginalValue;
  else if (activePicker === "repeat") reps = pickerOriginalValue;
  log("pickerCancel", { picker: activePicker });
  activePicker = null;
 }

 function formatRulerTimeLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m}:00`;
 }

 function formatRepLabel(val: number): string {
  return `x${val}`;
 }

 // Non-uniform time scale: 5s steps up to 1min, 15s to 3min, 30s to max
 function generateTimeValues(min: number, max: number): number[] {
  const result: number[] = [];
  let v = min;
  while (v <= max) {
   result.push(v);
   if (v < 60) v += 5;
   else if (v < 300) v += 10;
   else v += 30;
  }
  return result;
 }

 const workValues = generateTimeValues(5, 600);
 const restValues = generateTimeValues(0, 300);
 const repeatValues = Array.from({ length: 20 }, (_, i) => i + 1);

 // Desktop keyboard shortcuts
 function handleKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest("input, textarea, select")) return;

  // ? toggles keyboard shortcuts help
  if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
   e.preventDefault();
   showShortcuts = !showShortcuts;
   return;
  }

  // M to toggle mute works everywhere
  if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey && !e.altKey) {
   e.preventDefault();
   toggleMute();
   volumeSyncTrigger++;
   return;
  }

  // F for fullscreen works everywhere
  if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
   e.preventDefault();
   const el = document.documentElement as WebkitElement;
   const doc = document as WebkitDocument;
   if (document.fullscreenElement || doc.webkitFullscreenElement) {
    if (doc.exitFullscreen) doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
   } else {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
   }
   return;
  }

  // Escape: close shortcuts modal, then picker/presets, then reset if finished
  if (e.key === "Escape" && !document.fullscreenElement) {
   if (showShortcuts) {
    e.preventDefault();
    showShortcuts = false;
    return;
   }
   if (activePicker) {
    e.preventDefault();
    cancelPicker();
    return;
   }
   if (isFinished) {
    e.preventDefault();
    handleReset();
    return;
   }
  }

  // H to go home (same as Escape for finished/paused)
  if ((e.key === "h" || e.key === "H") && !e.metaKey && !e.ctrlKey && !e.altKey && (isFinished || isPaused)) {
   e.preventDefault();
   handleReset();
   return;
  }

  // R to restart current workout (does nothing from home screen)
  if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.altKey && (isActive || isFinished)) {
   e.preventDefault();
   handleReset();
   handleStart();
   return;
  }

  // Timer controls only apply when not in picker
  if (activePicker) return;

  if (e.key === " " && $status === "idle" && canStart) {
   e.preventDefault();
   handleStart();
  } else if (e.key === " " && (isRunning || isPaused)) {
   e.preventDefault();
   resumeAudioContext();
   if (isRunning) {
    log("ui:pause");
    playPauseSound();
    timer.pause();
   } else {
    log("ui:resume");
    playResumeSound();
    timer.start();
   }
  } else if (e.key === "ArrowLeft" && $status === "idle") {
   e.preventDefault();
   cyclePreset(-1);
  } else if (e.key === "ArrowRight" && $status === "idle") {
   e.preventDefault();
   cyclePreset(1);
  } else if (e.key === "ArrowLeft" && isActive) {
   e.preventDefault();
   resumeAudioContext();
   timer.skipBackward();
  } else if (e.key === "ArrowRight" && isActive) {
   e.preventDefault();
   resumeAudioContext();
   timer.skipForward();
  } else if (e.key === "ArrowUp" && isActive) {
   e.preventDefault();
   timer.addRep();
   reps = $totalReps;
  } else if (e.key === "ArrowDown" && isActive) {
   e.preventDefault();
   timer.removeRep();
   reps = $totalReps;
  }
 }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
 <title>Timer</title>
 <meta name="description" content="Simple workout timer" />
 <meta name="apple-mobile-web-app-capable" content="yes" />
 <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<main
 class="app"
 class:finished={isFinished}
 class:getReady={isGetReady}
 class:work={isWork}
 class:rest={isRest}
 class:paused={isPaused}
>
 {#if $status === "idle" && !activePicker}
  <!-- Idle: show config cards + total time -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
   class="home"
   onpointerdown={handleHomePointerDown}
   onpointermove={handleHomePointerMove}
   onpointerup={handleHomePointerUp}
   onwheel={handleHomeWheel}
   onclickcapture={handleHomeClickCapture}
  >
   <div class="cards">
    <ConfigCard label="Work" value={displayTime(duration)} color="#2ECC71" onclick={() => openPicker("work")} />
    <ConfigCard label="Rest" value={displayTime(rest)} color="#E8450E" onclick={() => openPicker("rest")} />
    <ConfigCard label="Repeat" value={`x${reps}`} color="#3498DB" onclick={() => openPicker("repeat")} />
    <div class="preset-dots" data-testid="preset-dots">
     {#each presets as _, i (i)}
      <span class="dot" class:active={i === presetIndex}></span>
     {/each}
    </div>
   </div>

   <div class="home-right">
    <div class="toolbar">
     <FullscreenButton />
     <VolumeControl syncTrigger={volumeSyncTrigger} />
    </div>

    <TotalTimeDisplay totalTime={totalTimeDisplay} {canStart} onstart={handleStart} />
   </div>
  </div>
 {:else if activePicker === "work"}
  <RulerPicker
   label="Work"
   color="#2ECC71"
   value={duration}
   values={workValues}
   formatValue={displayTime}
   formatRulerLabel={formatRulerTimeLabel}
   rulerLabelInterval={60}
   onchange={handlePickerChange}
   onclose={closePicker}
   oncancel={cancelPicker}
  />
 {:else if activePicker === "rest"}
  <RulerPicker
   label="Rest"
   color="#E8450E"
   value={rest}
   values={restValues}
   formatValue={displayTime}
   formatRulerLabel={formatRulerTimeLabel}
   rulerLabelInterval={60}
   onchange={handlePickerChange}
   onclose={closePicker}
   oncancel={cancelPicker}
  />
 {:else if activePicker === "repeat"}
  <RulerPicker
   label="Repeat"
   color="#3498DB"
   value={reps}
   values={repeatValues}
   formatValue={(v) => `x${v}`}
   formatRulerLabel={formatRepLabel}
   rulerLabelInterval={1}
   onchange={handlePickerChange}
   onclose={closePicker}
   oncancel={cancelPicker}
  />
 {:else}
  <!-- Running / Paused / Finished -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="active-screen" data-testid="active-screen" onpointerdown={handlePointerDown} onpointerup={handlePointerUp}>
   <div class="active-toolbar">
    <FullscreenButton />
    <VolumeControl syncTrigger={volumeSyncTrigger} />
   </div>
   <PhaseHeader phase={$phase} currentRep={$currentRep} totalReps={$totalReps} status={$status} />

   <div class="countdown-area">
    {#if !isFinished}
     <button
      class="skip-btn skip-back"
      onclick={() => {
       resumeAudioContext();
       timer.skipBackward();
      }}
      aria-label="Previous segment"
     >
      <svg viewBox="0 0 24 24" aria-hidden="true"
       ><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" /></svg
      >
     </button>
    {/if}
    <CountdownDisplay remaining={$remaining} />
    {#if !isFinished}
     <button
      class="skip-btn skip-fwd"
      onclick={() => {
       resumeAudioContext();
       timer.skipForward();
      }}
      aria-label="Next segment"
     >
      <svg viewBox="0 0 24 24" aria-hidden="true"
       ><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor" /></svg
      >
     </button>
    {/if}
   </div>

   <div class="controls">
    {#if isPaused}
     <!-- Reset, Play, Close buttons -->
     <button class="icon-btn small-btn" data-testid="reset-button" onclick={handleReset} aria-label="Reset">
      <svg viewBox="0 0 50 50" aria-hidden="true">
       <circle cx="25" cy="25" r="23" fill="none" stroke="#FFBA08" stroke-width="2.5" />
       <path d="M17 25a9 9 0 1 1 2.5 6.5" fill="none" stroke="#FFBA08" stroke-width="2.5" stroke-linecap="round" />
       <polyline
        points="17,21 17,26 22,26"
        fill="none"
        stroke="#FFBA08"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
       />
      </svg>
     </button>
    {:else if isFinished}
     <button class="icon-btn small-btn finished-btn" data-testid="reset-button" onclick={handleReset} aria-label="Reset">
      <svg viewBox="0 0 50 50" aria-hidden="true">
       <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" stroke-width="2.5" />
       <path d="M17 25a9 9 0 1 1 2.5 6.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
       <polyline
        points="17,21 17,26 22,26"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
       />
      </svg>
     </button>
    {/if}
   </div>
  </div>
 {/if}
 <KeyboardShortcuts open={showShortcuts} onclose={() => (showShortcuts = false)} />
</main>

<style>
 :global(*, *::before, *::after) {
  box-sizing: border-box;
 }

 :global(body) {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #000;
  color: #fff;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
 }

 @media (min-width: 768px) {
  .app {
   max-width: 640px;
  }
 }

 .app {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 60px 24px 0;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background-color 1s ease;
  background: #000;
 }

 .home {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  touch-action: pan-y;
 }

 .home-right {
  display: contents;
 }

 .cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
 }

 .preset-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 4px;
 }

 .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: background 0.2s ease;
 }

 .dot.active {
  background: rgba(255, 255, 255, 0.85);
 }

 .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 0;
 }

 /* Active states: full-viewport immersive */
 .app.getReady,
 .app.work,
 .app.rest,
 .app.finished,
 .app.paused {
  max-width: none;
  padding: 0;
 }

 .app.getReady {
  background-color: #ffba08;
 }

 .app.work {
  background-color: #2ecc71;
 }

 .app.rest {
  background-color: #ffba08;
 }

 .app.paused {
  background-color: #000;
 }

 .app.finished {
  animation: finished-flash 1.152s step-end 10;
  background-color: #00bcd4;
 }

 .app.finished :global(.time),
 .app.finished .finished-btn {
  color: #fff;
 }

 /* Active screen layout */
 .active-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  height: 100dvh;
  overflow: hidden;
 }

 .active-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 16px 0;
  padding-top: max(12px, env(safe-area-inset-top));
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.85);
 }

 .app.paused .active-toolbar,
 .app.finished .active-toolbar {
  color: #fff;
 }

 .countdown-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
  width: 100%;
 }

 .skip-btn {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  color: rgba(0, 0, 0, 0.4);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  line-height: 0;
 }

 .skip-btn svg {
  width: 36px;
  height: 36px;
 }

 .skip-back {
  left: 16px;
 }

 .skip-fwd {
  right: 16px;
 }

 @media (hover: hover) {
  .skip-btn {
   display: block;
  }

  .skip-btn:hover {
   color: rgba(0, 0, 0, 0.7);
  }

  .app.paused .skip-btn:hover {
   color: rgba(255, 255, 255, 0.7);
  }
 }

 .app.paused .skip-btn {
  color: rgba(255, 255, 255, 0.4);
 }

 .controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  flex-shrink: 0;
 }

 /* Paused state: amber time and phase header */
 .app.paused :global(.time) {
  color: #ffba08;
 }

 .app.paused :global(.phase-label),
 .app.paused :global(.rep-counter) {
  color: #ffba08;
 }

 .app.paused :global(.segment) {
  background: rgba(255, 255, 255, 0.15);
 }

 .app.paused :global(.segment.done) {
  background: #ffba08;
 }

 .app.paused :global(.segment.current) {
  background: linear-gradient(to right, #ffba08 50%, rgba(255, 255, 255, 0.15) 50%);
 }

 .icon-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  line-height: 0;
 }

 .icon-btn:active {
  opacity: 0.7;
  transform: scale(0.92);
 }

 .small-btn {
  width: 50px;
  height: 50px;
 }

 .small-btn svg {
  width: 100%;
  height: 100%;
 }

 @keyframes finished-flash {
  0% {
   background-color: #ff5252; /* red */
  }
  25% {
   background-color: #ffea00; /* yellow */
  }
  50% {
   background-color: #00e676; /* green */
  }
  75% {
   background-color: #00bcd4; /* cyan */
  }
 }

 /* Desktop wide screens — 2-column home layout */
 @media (min-width: 1024px) {
  .app {
   max-width: none;
   padding: clamp(24px, 3vh, 48px) clamp(40px, 5vw, 80px);
   padding-bottom: max(24px, env(safe-area-inset-bottom));
  }

  .home {
   display: grid;
   grid-template-columns: minmax(0, 9fr) minmax(0, 11fr);
   grid-template-rows: auto 1fr;
   gap: 0 clamp(40px, 5vw, 80px);
   flex: 1;
  }

  .home .toolbar {
   grid-column: 1 / -1;
   grid-row: 1;
   align-self: start;
  }

  .home .cards {
   grid-column: 1;
   grid-row: 2;
   align-self: center;
   gap: clamp(12px, 2.5vh, 30px);
  }

  .home .cards :global(.config-card) {
   height: clamp(90px, 12vh, 160px);
   border-radius: 10px;
   padding: 0 clamp(20px, 2vw, 40px);
  }

  .home .cards :global(.label) {
   font-size: clamp(2.5rem, 3.5vw, 4rem);
   font-weight: 600;
  }

  .home .cards :global(.value) {
   font-size: clamp(3.5rem, 4.5vw, 6rem);
  }

  .home :global(.total-time-display) {
   grid-column: 2;
   grid-row: 2;
   align-self: center;
   padding: 0;
   overflow: hidden;
  }

  .home :global(.total-time-display .row) {
   justify-content: center;
   gap: clamp(16px, 2vw, 40px);
  }

  .home :global(.total-time-display .play-btn) {
   width: clamp(105px, 14vw, 215px);
  }

  .home :global(.total-time-display .time) {
   flex: none;
   font-size: clamp(10rem, 16vw, 30rem);
   text-align: center;
  }

  .toolbar :global(svg) {
   width: 48px;
   height: 48px;
  }

  .active-toolbar :global(svg) {
   width: 36px;
   height: 36px;
  }
 }

 /* Landscape layout for small screens (iPhones) — homescreen only */
 @media (orientation: landscape) and (max-height: 500px) and (max-width: 1023px) {
  .app {
   max-width: none;
   padding: max(12px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
  }

  .home {
   display: grid;
   grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
   grid-template-rows: auto 1fr;
   gap: 0 24px;
   padding-bottom: 5%;
  }

  .home-right {
   display: contents;
  }

  .home .toolbar {
   grid-column: 1 / -1;
   grid-row: 1;
   align-self: start;
  }

  .home .cards {
   grid-column: 1;
   grid-row: 2;
   align-self: center;
   gap: 6px;
  }

  .home .cards :global(.config-card) {
   height: 78px;
  }

  .home .cards :global(.label) {
   font-size: 1.8rem;
   font-weight: 600;
  }

  .home .cards :global(.value) {
   font-size: 2.5rem;
  }

  .home :global(.total-time-display) {
   grid-column: 2;
   grid-row: 2;
   align-self: center;
   padding: 0;
   overflow: hidden;
  }

  .home :global(.total-time-display .row) {
   justify-content: center;
   gap: 16px;
  }

  .home :global(.total-time-display .play-btn) {
   width: min(8vw, 4.5rem);
  }

  .home :global(.total-time-display .time) {
   flex: none;
   font-size: min(15vw, 8rem);
   text-align: center;
  }
 }
</style>
