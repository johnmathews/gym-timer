<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let isFullscreen = $state(false);
  let canFullscreen = $state(false);
  let isStandalone = $state(false);
  let showHint = $state(false);
  let hintTimeout: ReturnType<typeof setTimeout> | null = null;

  function getFullscreenElement(): Element | null {
    return document.fullscreenElement
      || (document as any).webkitFullscreenElement
      || null;
  }

  function handleChange() {
    isFullscreen = !!getFullscreenElement();
  }

  onMount(() => {
    const el = document.documentElement as any;
    canFullscreen = !!(el.requestFullscreen || el.webkitRequestFullscreen);
    isFullscreen = !!getFullscreenElement();
    isStandalone = (navigator as any).standalone === true
      || window.matchMedia("(display-mode: standalone)").matches;
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
  });

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    }
    if (hintTimeout) clearTimeout(hintTimeout);
  });

  function toggle() {
    if (!canFullscreen) {
      showHint = true;
      if (hintTimeout) clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => { showHint = false; }, 4000);
      return;
    }
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    }
  }
</script>

{#if !(isStandalone && !canFullscreen)}
<div class="fullscreen-wrapper">
  <button class="fullscreen-btn" onclick={toggle} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      {#if isFullscreen}
        <!-- Compress arrows -->
        <polyline points="4,14 10,14 10,20" />
        <polyline points="20,10 14,10 14,4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      {:else}
        <!-- Expand arrows -->
        <polyline points="15,3 21,3 21,9" />
        <polyline points="9,21 3,21 3,15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      {/if}
    </svg>
  </button>
  {#if showHint}
    <div class="hint">
      Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> for fullscreen
    </div>
  {/if}
</div>
{/if}

<style>
  .fullscreen-wrapper {
    position: relative;
  }

  .fullscreen-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    line-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fullscreen-btn:active {
    opacity: 0.7;
  }

  .hint {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    background: rgba(255, 255, 255, 0.95);
    color: #000;
    font-size: 13px;
    padding: 8px 12px;
    border-radius: 8px;
    white-space: nowrap;
    z-index: 10;
    animation: fade-in 0.2s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
