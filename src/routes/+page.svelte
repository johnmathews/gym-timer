<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createTimer, playAlertSound } from "$lib/timer";
  import { log } from "$lib/logger";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import RulerPicker from "$lib/components/RulerPicker.svelte";
  import TotalTimeDisplay from "$lib/components/TotalTimeDisplay.svelte";
  import CountdownDisplay from "$lib/components/CountdownDisplay.svelte";
  import TimerControls from "$lib/components/TimerControls.svelte";

  const timer = createTimer();
  const { remaining, status, phase, currentRep, totalReps } = timer;

  let duration = $state(30);
  let rest = $state(10);
  let reps = $state(1);
  let prevStatus: string = "idle";

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
    if (s === "finished" && prevStatus !== "finished") {
      log("ui:alertSound");
      playAlertSound();
    }
    prevStatus = s;
  });

  const canStart = $derived(duration > 0);
  const isFinished = $derived($status === "finished");
  const isActive = $derived($status === "running" || $status === "paused");
  const isWork = $derived(isActive && $phase === "work");
  const isRest = $derived(isActive && $phase === "rest");

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

<main class="app" class:finished={isFinished} class:work={isWork} class:rest={isRest}>
  {#if $status === "idle" && !activePicker}
    <!-- Idle: show config cards + total time -->
    <div class="cards">
      <ConfigCard
        label="Work"
        value={displayTime(duration)}
        color="#4ECDC4"
        onclick={() => openPicker("work")}
      />
      <ConfigCard
        label="Rest"
        value={displayTime(rest)}
        color="#FF6B5B"
        onclick={() => openPicker("rest")}
      />
      <ConfigCard
        label="Repeat"
        value={`x${reps}`}
        color="#FFAA33"
        onclick={() => openPicker("repeat")}
      />
    </div>

    <TotalTimeDisplay totalTime={totalTimeDisplay} {canStart} onstart={handleStart} />
  {:else if activePicker === "work"}
    <RulerPicker
      label="Work"
      color="#4ECDC4"
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
      color="#FF6B5B"
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
      color="#FFAA33"
      value={reps}
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
    <CountdownDisplay remaining={$remaining} phase={$phase} currentRep={$currentRep} totalReps={$totalReps} />

    <TimerControls
      status={$status}
      {canStart}
      onstart={handleStart}
      onpause={() => { log("ui:pause"); timer.pause(); }}
      onreset={() => { log("ui:reset"); timer.reset(); }}
    />
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
    padding: 60px 24px 0;
    padding-bottom: max(24px, env(safe-area-inset-bottom));
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: background-color 0.3s ease;
    background: #000;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  /* Full-screen state colors */
  .app.work {
    background-color: #4ECDC4;
  }

  .app.rest {
    background-color: #FF6B5B;
  }

  .app.finished {
    background-color: #e74c3c;
    animation: pulse 0.6s ease-in-out infinite alternate;
  }

  /* Buttons on colored backgrounds */
  .app.work :global(.control-btn),
  .app.rest :global(.control-btn),
  .app.finished :global(.control-btn) {
    background: rgba(255, 255, 255, 0.9);
    color: #2c3e50;
  }

  @keyframes pulse {
    from {
      background-color: #e74c3c;
    }
    to {
      background-color: #ff6b6b;
    }
  }
</style>
