<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createTimer, GET_READY_DURATION, playFinishSound, playRestStartSound, playRestEndSound } from "$lib/timer";
  import { log } from "$lib/logger";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import RulerPicker from "$lib/components/RulerPicker.svelte";
  import TotalTimeDisplay from "$lib/components/TotalTimeDisplay.svelte";
  import CountdownDisplay from "$lib/components/CountdownDisplay.svelte";
  import PhaseHeader from "$lib/components/PhaseHeader.svelte";

  const timer = createTimer();
  const { remaining, status, phase, currentRep, totalReps } = timer;

  let duration = $state(30);
  let rest = $state(10);
  let reps = $state(1);
  let prevStatus: string = "idle";
  let prevPhase: string = "work";

  let activePicker: "work" | "rest" | "repeat" | null = $state(null);
  let pickerOriginalValue = $state(0);

  onMount(() => {
    log("mount", { duration, rest, reps });
    timer.configure(duration, rest, reps);
  });

  onDestroy(() => {
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
    if (s === "finished" && prevStatus !== "finished") {
      log("ui:finishSound");
      playFinishSound();
    }
    if (s === "running") {
      if (p === "rest" && prevPhase === "work") {
        log("ui:restStartSound");
        playRestStartSound();
      } else if (p === "work" && prevPhase === "rest") {
        log("ui:restEndSound");
        playRestEndSound();
      }
    }
    prevStatus = s;
    prevPhase = p;
  });

  const canStart = $derived(duration > 0);
  const isFinished = $derived($status === "finished");
  const isActive = $derived($status === "running" || $status === "paused");
  const isPaused = $derived($status === "paused");
  const isRunning = $derived($status === "running");
  const isGetReady = $derived(isRunning && $phase === "getReady");
  const isWork = $derived(isRunning && $phase === "work");
  const isRest = $derived(isRunning && $phase === "rest");

  function handleScreenTap(e: MouseEvent) {
    // Don't handle taps on buttons
    if ((e.target as HTMLElement).closest("button")) return;
    if ($status === "running") {
      log("ui:pause");
      timer.pause();
    } else if ($status === "paused") {
      log("ui:resume");
      timer.start();
    }
  }

  function handlePause() {
    log("ui:pause");
    timer.pause();
  }

  function handleResume() {
    log("ui:resume");
    timer.start();
  }

  function handleReset() {
    log("ui:reset");
    timer.reset();
  }

  function handleClose() {
    log("ui:close");
    timer.reset();
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
</script>

<svelte:head>
  <title>Gym Timer</title>
  <meta name="description" content="Simple gym workout timer" />
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
    <div class="cards">
      <ConfigCard
        label="Work"
        value={displayTime(duration)}
        color="#2ECC71"
        onclick={() => openPicker("work")}
      />
      <ConfigCard
        label="Rest"
        value={displayTime(rest)}
        color="#F39C12"
        onclick={() => openPicker("rest")}
      />
      <ConfigCard
        label="Repeat"
        value={`x${reps}`}
        color="#3498DB"
        onclick={() => openPicker("repeat")}
      />
    </div>

    <TotalTimeDisplay totalTime={totalTimeDisplay} {canStart} onstart={handleStart} />
  {:else if activePicker === "work"}
    <RulerPicker
      label="Work"
      color="#2ECC71"
      value={duration}
      maxValue={360}
      step={5}
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
      color="#F39C12"
      value={rest}
      maxValue={120}
      step={5}
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
      minValue={1}
      maxValue={10}
      step={1}
      formatValue={(v) => `x${v}`}
      formatRulerLabel={formatRepLabel}
      rulerLabelInterval={1}
      onchange={handlePickerChange}
      onclose={closePicker}
      oncancel={cancelPicker}
    />
  {:else}
    <!-- Running / Paused / Finished -->
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="active-screen" data-testid="active-screen" onclick={handleScreenTap}>
      {#if !isPaused}
        <PhaseHeader phase={$phase} currentRep={$currentRep} totalReps={$totalReps} />
      {:else}
        <div class="spacer-top"></div>
      {/if}

      <div class="countdown-area">
        <CountdownDisplay remaining={$remaining} />
      </div>

      <div class="controls">
        {#if isRunning}
          <!-- Single pause button -->
          <button class="icon-btn pause-btn" data-testid="pause-button" onclick={handlePause} aria-label="Pause">
            <svg viewBox="0 0 70 70" aria-hidden="true">
              <circle cx="35" cy="35" r="35" fill="rgba(0,0,0,0.85)" />
              <rect x="23" y="20" width="8" height="30" rx="2" fill="currentColor" />
              <rect x="39" y="20" width="8" height="30" rx="2" fill="currentColor" />
            </svg>
          </button>
        {:else if isPaused}
          <!-- Reset, Play, Close buttons -->
          <button class="icon-btn small-btn" data-testid="reset-button" onclick={handleReset} aria-label="Reset">
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="23" fill="none" stroke="#F5A623" stroke-width="2.5" />
              <path d="M17 25a9 9 0 1 1 2.5 6.5" fill="none" stroke="#F5A623" stroke-width="2.5" stroke-linecap="round" />
              <polyline points="17,21 17,26 22,26" fill="none" stroke="#F5A623" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="icon-btn play-active-btn" data-testid="resume-button" onclick={handleResume} aria-label="Resume">
            <svg viewBox="0 0 70 70" aria-hidden="true">
              <circle cx="35" cy="35" r="35" fill="#F5A623" />
              <polygon points="28,20 28,50 52,35" fill="rgba(0,0,0,0.85)" />
            </svg>
          </button>
          <button class="icon-btn small-btn" data-testid="close-button" onclick={handleClose} aria-label="Close">
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="23" fill="none" stroke="#F5A623" stroke-width="2.5" />
              <line x1="17" y1="17" x2="33" y2="33" stroke="#F5A623" stroke-width="2.5" stroke-linecap="round" />
              <line x1="33" y1="17" x2="17" y2="33" stroke="#F5A623" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </button>
        {:else if isFinished}
          <!-- Reset + Close buttons -->
          <button class="icon-btn small-btn finished-btn" data-testid="reset-button" onclick={handleReset} aria-label="Reset">
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" stroke-width="2.5" />
              <path d="M17 25a9 9 0 1 1 2.5 6.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <polyline points="17,21 17,26 22,26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="icon-btn small-btn finished-btn" data-testid="close-button" onclick={handleClose} aria-label="Close">
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" stroke-width="2.5" />
              <line x1="17" y1="17" x2="33" y2="33" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <line x1="33" y1="17" x2="17" y2="33" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {/if}
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

  .cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
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
    background-color: #F5A623;
  }

  .app.work {
    background-color: #2ECC71;
  }

  .app.rest {
    background-color: #F39C12;
  }

  .app.paused {
    background-color: #000;
  }

  .app.finished {
    animation: finished-flash 1s steps(1) infinite;
  }

  .app.finished :global(.time),
  .app.finished .finished-btn {
    animation: finished-flash-text 1s steps(1) infinite;
  }

  /* Active screen layout */
  .active-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    min-height: 100dvh;
  }

  .spacer-top {
    height: max(16px, env(safe-area-inset-top));
  }

  .countdown-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding-bottom: max(32px, env(safe-area-inset-bottom));
    flex-shrink: 0;
  }

  /* Paused state: amber time */
  .app.paused :global(.time) {
    color: #F5A623;
  }

  .icon-btn {
    background: none;
    border: none;
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

  .pause-btn {
    width: 70px;
    height: 70px;
  }

  .pause-btn svg {
    width: 100%;
    height: 100%;
  }

  /* Color for pause bars matches background */
  .app.getReady .pause-btn svg {
    color: #F5A623;
  }

  .app.work .pause-btn svg {
    color: #2ECC71;
  }

  .app.rest .pause-btn svg {
    color: #F39C12;
  }

  .play-active-btn {
    width: 70px;
    height: 70px;
  }

  .play-active-btn svg {
    width: 100%;
    height: 100%;
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
    0% { background-color: #000; }
    50% { background-color: #fff; }
  }

  @keyframes finished-flash-text {
    0% { color: #fff; }
    50% { color: rgba(0, 0, 0, 0.85); }
  }
</style>
