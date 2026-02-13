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
    padding: min(2rem, 3vh);
  }

  .time {
    font-family: ui-rounded, "Nunito", sans-serif;
    font-size: min(30vw, 35vh);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: rgba(0, 0, 0, 0.85);
  }

  @media (min-width: 768px) {
    .time {
      font-size: min(20vw, 40vh);
    }
  }
</style>
