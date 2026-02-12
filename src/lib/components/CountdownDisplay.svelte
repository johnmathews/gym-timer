<script lang="ts">
  import { formatTime } from "$lib/timer";

  interface Props {
    remaining: number;
  }

  let { remaining }: Props = $props();
</script>

<div class="countdown-display" aria-live="polite" aria-label="Time remaining">
  <span class="time" data-testid="countdown-time">{formatTime(remaining)}</span>
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
    font-size: min(25vw, 10rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: rgba(0, 0, 0, 0.85);
  }
</style>
