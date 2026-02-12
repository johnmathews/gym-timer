<script lang="ts">
  import type { TimerPhase } from "$lib/timer";

  interface Props {
    phase: TimerPhase;
    currentRep: number;
    totalReps: number;
  }

  let { phase, currentRep, totalReps }: Props = $props();

  const phaseLabel = $derived(
    phase === "getReady" ? "Get Ready!" : phase === "work" ? "Work" : "Rest"
  );
  const showReps = $derived(totalReps > 1);
</script>

<div class="phase-header" data-testid="phase-header">
  <div class="label-row">
    <span class="phase-label" data-testid="phase-label">{phaseLabel}</span>
    {#if showReps}
      <span class="rep-counter" data-testid="rep-counter">{currentRep}/{totalReps}</span>
    {/if}
  </div>
  {#if showReps}
    <div class="progress-bar" data-testid="progress-bar">
      {#each Array(totalReps) as _, i}
        <div
          class="segment"
          class:active={i < currentRep}
        ></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .phase-header {
    width: 100%;
    padding: 0 24px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }

  .phase-label {
    font-size: 1.75rem;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.85);
  }

  .rep-counter {
    font-size: 1.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: rgba(0, 0, 0, 0.85);
  }

  .progress-bar {
    display: flex;
    gap: 6px;
  }

  .segment {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.15);
  }

  .segment.active {
    background: rgba(0, 0, 0, 0.7);
  }
</style>
