<script lang="ts">
  interface Props {
    totalTime: string;
    canStart: boolean;
    onstart: () => void;
  }

  let { totalTime, canStart, onstart }: Props = $props();
</script>

<div class="total-time-display">
  <div class="row">
    <button
      class="play-btn"
      onclick={onstart}
      disabled={!canStart}
      aria-label="Start timer"
      data-testid="play-button"
    >
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="28" fill="none" stroke="#fff" stroke-width="3" />
        <polygon points="24,18 24,42 44,30" fill="#fff" />
      </svg>
    </button>
    <span class="time" data-testid="total-time">{totalTime}</span>
  </div>
</div>

<style>
  .total-time-display {
    flex: 1;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 24px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .play-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    width: 22%;
    touch-action: manipulation;
  }

  .play-btn svg {
    width: 100%;
    height: auto;
  }

  .play-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .play-btn:active:not(:disabled) {
    transform: scale(0.92);
  }

  .time {
    flex: 1;
    font-family: "Bebas Neue", sans-serif;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1;
    text-align: right;
    font-size: min(35vw, 12rem);
  }
</style>
