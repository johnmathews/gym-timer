<script lang="ts">
 import { summaryName, type Preset } from "$lib/presetStore";

 interface Props {
  presets: Preset[];
  /** Message from the last failed save, or null */
  error: string | null;
  onmove: (id: string, direction: -1 | 1) => void;
  onclose: () => void;
 }

 let { presets, error, onmove, onclose }: Props = $props();

 function focusOnMount(node: HTMLElement) {
  node.focus();
 }
</script>

<div class="overlay" id="preset-reorder" data-testid="preset-reorder" role="dialog" aria-modal="true" aria-labelledby="preset-reorder-title">
 <div class="inner">
  <div class="header">
   <h2 id="preset-reorder-title">Reorder presets</h2>
  </div>

  <ol class="list">
   {#each presets as preset, i (preset.id)}
    <li class="row" data-testid="preset-reorder-row">
     <div class="text">
      <span class="preset-name">{preset.name}</span>
      <span class="preset-summary">{summaryName(preset)}</span>
     </div>
     <button
      class="move-btn"
      id="preset-move-up-{i}"
      data-testid="preset-move-up-{i}"
      aria-label="Move {preset.name} up"
      disabled={i === 0}
      onclick={() => onmove(preset.id, -1)}
     >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor" /></svg>
     </button>
     <button
      class="move-btn"
      id="preset-move-down-{i}"
      data-testid="preset-move-down-{i}"
      aria-label="Move {preset.name} down"
      disabled={i === presets.length - 1}
      onclick={() => onmove(preset.id, 1)}
     >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill="currentColor" /></svg>
     </button>
    </li>
   {/each}
  </ol>

  {#if error}
   <p class="error" id="preset-reorder-error" data-testid="preset-reorder-error" role="alert">{error}</p>
  {/if}

  <div class="footer">
   <button class="done-btn" id="preset-reorder-done" data-testid="preset-reorder-done" onclick={onclose} use:focusOnMount>Done</button>
  </div>
 </div>
</div>

<style>
 .overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: #000;
  color: #fff;
 }

 .inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
  min-height: 0;
 }

 @media (min-width: 768px) {
  .inner {
   max-width: 640px;
  }
 }

 .header {
  flex-shrink: 0;
  padding: 16px 24px;
 }

 .header h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
 }

 .list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0 24px;
  list-style: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
 }

 .row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 70px;
  padding: 0 8px 0 20px;
  border-radius: 6px;
  background: #1a1a1a;
 }

 .text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
 }

 .preset-name {
  overflow: hidden;
  font-size: 1.3rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .preset-summary {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.6);
 }

 .move-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: #2a2a2a;
  color: #fff;
  line-height: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
 }

 .move-btn svg {
  width: 28px;
  height: 28px;
 }

 .move-btn:active:not(:disabled) {
  opacity: 0.7;
 }

 .move-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
 }

 .error {
  margin: 8px 24px 0;
  color: #ff6b4a;
  font-size: 0.95rem;
 }

 .footer {
  flex-shrink: 0;
  padding: 16px 24px;
 }

 .done-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 6px;
  background: #2ecc71;
  color: #000;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
 }

 .done-btn:active {
  opacity: 0.7;
 }
</style>
