<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let {
    enabled = $bindable(true),
    timerActive = false,
  }: {
    enabled: boolean;
    timerActive: boolean;
  } = $props();

  let canWakeLock = $state(false);
  let wakeLock: WakeLockSentinel | null = null;

  onMount(() => {
    canWakeLock = "wakeLock" in navigator;
  });

  async function acquire() {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch {
      // Wake lock request failed (e.g. page not visible)
    }
  }

  async function release() {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  }

  // Acquire/release the actual lock based on both user preference and timer state
  $effect(() => {
    if (enabled && timerActive && canWakeLock) {
      acquire();
    } else {
      release();
    }
  });

  function handleVisibility() {
    if (document.visibilityState === "visible" && enabled && timerActive && !wakeLock) {
      acquire();
    }
  }

  onMount(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  });

  onDestroy(() => {
    release();
  });

  function toggle() {
    enabled = !enabled;
  }
</script>

{#if canWakeLock}
<button class="wakelock-btn" onclick={toggle} aria-label={enabled ? "Allow screen sleep" : "Keep screen on"}>
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5" fill={enabled ? "currentColor" : "none"} />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
</button>
{/if}

<style>
  .wakelock-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    line-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wakelock-btn:active {
    opacity: 0.7;
  }
</style>
