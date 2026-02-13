<script lang="ts">
 import type { Preset } from '$lib/presets';

 interface Props {
  presets: Preset[];
  onselect: (preset: Preset) => void;
  onclose: () => void;
 }

 let { presets, onselect, onclose }: Props = $props();

 function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
 }
</script>

<div class="overlay" data-testid="preset-list">
 <div class="inner">
  <div class="header">
   <h2>Workouts</h2>
  </div>

  <div class="list">
   {#each presets as preset}
    <button
     class="preset-btn"
     data-testid="preset-{preset.name.toLowerCase().replace(/[\s/]/g, '-')}"
     onclick={() => onselect(preset)}
    >
     <span class="preset-name">{preset.name}</span>
     <span class="preset-summary">{formatTime(preset.work)} / {formatTime(preset.rest)} / x{preset.reps}</span>
    </button>
   {/each}
  </div>

  <div class="footer">
   <button class="cancel-btn" onclick={onclose}>Cancel</button>
  </div>
 </div>
</div>

<style>
 .overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(12px, env(safe-area-inset-bottom));
 }

 .inner {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
 }

 @media (min-width: 768px) {
  .inner {
   max-width: 640px;
  }
 }

 .header {
  padding: 16px 24px;
  flex-shrink: 0;
 }

 .header h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
 }

 .list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;
 }

 .preset-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  background: #1a1a1a;
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease;
 }

 .preset-btn:active {
  transform: scale(0.98);
 }

 .preset-name {
  font-size: 1.3rem;
  font-weight: 500;
 }

 .preset-summary {
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
  color: rgba(255, 255, 255, 0.6);
 }

 .footer {
  padding: 16px 24px;
  flex-shrink: 0;
 }

 .cancel-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 6px;
  background: #333;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
 }

 .cancel-btn:active {
  opacity: 0.7;
 }
</style>
