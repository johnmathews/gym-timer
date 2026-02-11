<script lang="ts">
  import { formatTime } from "$lib/timer";
  import type { TimerPhase } from "$lib/timer";

  interface Props {
    remaining: number;
    phase?: TimerPhase;
    currentRep?: number;
    totalReps?: number;
  }

  let { remaining, phase = "work", currentRep = 1, totalReps = 1 }: Props = $props();

  const showRepInfo = $derived(totalReps > 1);
  const phaseLabel = $derived(phase === "work" ? "Work" : "Rest");
</script>

<div class="countdown-display" aria-live="polite" aria-label="Time remaining">
  {#if showRepInfo}
    <span class="phase-label" data-testid="phase-label">{phaseLabel}</span>
  {/if}
  <span class="time" data-testid="countdown-time">{formatTime(remaining)}</span>
  {#if showRepInfo}
    <span class="rep-counter" data-testid="rep-counter">Rep {currentRep} / {totalReps}</span>
  {/if}
</div>

<style>
  .countdown-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .time {
    font-size: 5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
    color: #fff;
  }

  .phase-label {
    font-size: 1.25rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.8);
  }

  .rep-counter {
    font-size: 1.1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: rgba(255, 255, 255, 0.8);
  }
</style>
