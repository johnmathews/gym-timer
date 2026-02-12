<script lang="ts">
  import { onMount } from "svelte";
  import { getMasterVolume, setMasterVolume, initVolume } from "$lib/timer";

  let volume = $state(100);
  let open = $state(false);
  let containerEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    initVolume();
    volume = Math.round(getMasterVolume() * 100);

    function handleClickOutside(e: MouseEvent) {
      if (open && containerEl && !containerEl.contains(e.target as Node)) {
        open = false;
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });

  function toggleSlider() {
    open = !open;
  }

  function handleInput(e: Event) {
    volume = Number((e.target as HTMLInputElement).value);
    setMasterVolume(volume / 100);
  }

  const iconLevel = $derived(volume === 0 ? "muted" : volume <= 50 ? "low" : "high");
</script>

<div class="volume-control" bind:this={containerEl}>
  <button class="volume-btn" onclick={toggleSlider} aria-label="Volume">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="white" stroke="none" />
      {#if iconLevel === "muted"}
        <line x1="18" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="18" y2="15" />
      {:else if iconLevel === "low"}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      {:else}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      {/if}
    </svg>
  </button>
  {#if open}
    <div class="slider-container">
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        oninput={handleInput}
        class="volume-slider"
        aria-label="Volume level"
      />
    </div>
  {/if}
</div>

<style>
  .volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .volume-btn {
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

  .volume-btn:active {
    opacity: 0.7;
  }

  .slider-container {
    display: flex;
    align-items: center;
  }

  .volume-slider {
    width: 100px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
  }

  .volume-slider::-moz-range-track {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    height: 4px;
  }
</style>
