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
 .preset-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 6px 12px;
  border: none;
  background: none;
  color: #fff;
  font: inherit;
  font-size: 1.3rem;
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
  font-weight: 600;
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
  width: 22px;
  height: 22px;
  opacity: 0.6;
 }

 @media (min-width: 1024px) {
  .preset-bar {
   font-size: clamp(1.4rem, 1.8vw, 2.2rem);
  }

  .chevron {
   width: 32px;
   height: 32px;
  }
 }
</style>
