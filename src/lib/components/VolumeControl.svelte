<script lang="ts">
  import { onMount } from "svelte";
  import { getMasterVolume, setMasterVolume, initVolume, MAX_VOLUME } from "$lib/timer";

  const SLIDER_MAX = 1000;
  let sliderValue = $state(0);
  let open = $state(false);
  let containerEl: HTMLDivElement | undefined = $state();

  /** Quadratic curve: most of the slider covers the quiet range. */
  function sliderToVolume(s: number): number {
    const t = s / SLIDER_MAX; // 0 to 1
    return t * t * MAX_VOLUME;
  }

  function volumeToSlider(v: number): number {
    return Math.round(Math.sqrt(v / MAX_VOLUME) * SLIDER_MAX);
  }

  onMount(() => {
    initVolume();
    sliderValue = volumeToSlider(getMasterVolume());

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
    sliderValue = Number((e.target as HTMLInputElement).value);
    setMasterVolume(sliderToVolume(sliderValue));
  }

  const iconLevel = $derived(
    sliderValue === 0 ? "muted" : sliderValue <= SLIDER_MAX / 3 ? "low" : sliderValue <= SLIDER_MAX * 2 / 3 ? "high" : "boost"
  );
</script>

<div class="volume-control" bind:this={containerEl}>
  <button class="volume-btn" onclick={toggleSlider} aria-label="Volume">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
      {#if iconLevel === "muted"}
        <line x1="18" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="18" y2="15" />
      {:else if iconLevel === "low"}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      {:else if iconLevel === "high"}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      {:else}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <text x="20" y="6" fill="currentColor" stroke="none" font-size="7" font-weight="bold">+</text>
      {/if}
    </svg>
  </button>
  {#if open}
    <div class="slider-container">
      <input
        type="range"
        min="0"
        max={SLIDER_MAX}
        value={sliderValue}
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
