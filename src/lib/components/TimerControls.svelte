<script lang="ts">
 import type { TimerStatus } from "$lib/timer";

 interface Props {
  status: TimerStatus;
  canStart: boolean;
  onstart: () => void;
  onpause: () => void;
  onreset: () => void;
 }

 let { status, canStart, onstart, onpause, onreset }: Props = $props();
</script>

<div class="timer-controls">
 {#if status === "idle" || status === "paused"}
  <button class="control-btn start" onclick={onstart} disabled={!canStart}>
   {status === "paused" ? "Resume" : "Start"}
  </button>
 {/if}

 {#if status === "running"}
  <button class="control-btn pause" onclick={onpause}> Pause </button>
 {/if}

 {#if status !== "idle"}
  <button class="control-btn reset" onclick={onreset}> Reset </button>
 {/if}
</div>

<style>
 .timer-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
 }

 .control-btn {
  min-width: 120px;
  height: 56px;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
  transition:
   opacity 0.15s ease,
   transform 0.1s ease;
 }

 .control-btn:active {
  transform: scale(0.96);
 }

 .control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
 }

 .start {
  background: var(--color-primary, #2ecc71);
  color: #fff;
 }

 .pause {
  background: var(--color-warning, #f39c12);
  color: #fff;
 }

 .reset {
  background: var(--color-muted, #95a5a6);
  color: #fff;
 }
</style>
