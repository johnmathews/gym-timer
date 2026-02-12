<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let supported = $state(false);
  let isFullscreen = $state(false);

  function handleChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  onMount(() => {
    supported = !!document.fullscreenEnabled;
    isFullscreen = !!document.fullscreenElement;
    document.addEventListener("fullscreenchange", handleChange);
  });

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("fullscreenchange", handleChange);
    }
  });

  function toggle() {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }
</script>

{#if supported}
  <button class="fullscreen-btn" onclick={toggle} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
{/if}

<style>
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
</style>
