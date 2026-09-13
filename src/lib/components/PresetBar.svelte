<script lang="ts">
 interface Props {
  /** Active preset's name, or null when no preset is active */
  name: string | null;
  edited: boolean;
  onclick: () => void;
 }

 let { name, edited, onclick }: Props = $props();
</script>

<button class="preset-bar" id="preset-bar" data-testid="preset-bar" aria-haspopup="dialog" {onclick}>
 {#if name === null}
  <span class="name placeholder">Save as preset…</span>
 {:else}
  <span class="name">{name}</span>
  {#if edited}
   <span class="edited">· edited</span>
  {/if}
 {/if}
 <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill="currentColor" />
 </svg>
</button>

<style>
 /* Deliberately quiet: small text beside the preset dots, with a full-height tap target */
 .preset-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  min-height: 44px;
  padding: 6px 4px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.85);
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
 }

 .preset-bar:active {
  opacity: 0.7;
 }

 .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  min-width: 0;
 }

 .placeholder {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
 }

 .edited {
  flex-shrink: 0;
  white-space: nowrap;
  color: #ffba08;
 }

 .chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.6;
 }

 @media (min-width: 1024px) {
  .preset-bar {
   font-size: clamp(1rem, 1.2vw, 1.4rem);
  }

  .chevron {
   width: 20px;
   height: 20px;
  }
 }
</style>
