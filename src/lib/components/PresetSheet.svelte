<script lang="ts">
 import { untrack } from "svelte";
 import { MAX_NAME_LENGTH, normalizeName, type SaveResult } from "$lib/presetStore";

 interface Props {
  /** Active preset's name, or null when no preset is active */
  activeName: string | null;
  edited: boolean;
  /** Prefill for a new preset's name, e.g. "0:30 / 0:15 × 5" */
  defaultName: string;
  onupdate: () => SaveResult;
  oncreate: (name: string) => SaveResult;
  onrename: (name: string) => SaveResult;
  ondelete: () => SaveResult;
  /** Offer "Reorder…" (the page passes true with two or more presets) */
  canReorder: boolean;
  onreorder: () => void;
  onclose: () => void;
 }

 let { activeName, edited, defaultName, onupdate, oncreate, onrename, ondelete, canReorder, onreorder, onclose }: Props =
  $props();

 // The page remounts the sheet on every open, so these deliberately snapshot the props.
 // With no active preset the only action is saving one, so open straight on the name field.
 const startOnName = untrack(() => activeName === null);
 let view: "actions" | "create" | "rename" = $state(startOnName ? "create" : "actions");
 let nameValue = $state(untrack(() => (startOnName ? defaultName : "")));
 let confirmingDelete = $state(false);
 let error: string | null = $state(null);

 const canSave = $derived(normalizeName(nameValue) !== null);

 function finish(result: SaveResult) {
  if (result.ok) onclose();
  else error = result.error;
 }

 function openNameField(next: "create" | "rename") {
  view = next;
  nameValue = next === "rename" ? (activeName ?? "") : defaultName;
  error = null;
 }

 function submitName(e: SubmitEvent) {
  e.preventDefault();
  if (!canSave) return;
  finish(view === "rename" ? onrename(nameValue) : oncreate(nameValue));
 }

 function handleInputKeydown(e: KeyboardEvent) {
  // The page's shortcut handler ignores keys typed into inputs, so Escape is handled here
  if (e.key === "Escape") {
   e.preventDefault();
   onclose();
  }
 }

 function focusOnMount(node: HTMLInputElement) {
  node.focus();
  node.select();
 }
</script>

<div class="sheet-root" id="preset-sheet" data-testid="preset-sheet">
 <button class="backdrop" aria-label="Close preset menu" tabindex="-1" onclick={onclose}></button>
 <div class="panel" role="dialog" aria-modal="true" aria-labelledby="preset-sheet-title">
  {#if view === "actions"}
   <h2 class="title" id="preset-sheet-title">{activeName}</h2>
   {#if edited}
    <button class="item primary" id="preset-sheet-update" data-testid="preset-sheet-update" onclick={() => finish(onupdate())}>
     Update “{activeName}”
    </button>
   {/if}
   <button class="item" id="preset-sheet-save-new" data-testid="preset-sheet-save-new" onclick={() => openNameField("create")}>
    Save as new preset…
   </button>
   <button class="item" id="preset-sheet-rename" data-testid="preset-sheet-rename" onclick={() => openNameField("rename")}>
    Rename…
   </button>
   {#if canReorder}
    <button class="item" id="preset-sheet-reorder" data-testid="preset-sheet-reorder" onclick={onreorder}>Reorder…</button>
   {/if}
   {#if confirmingDelete}
    <button class="item danger" id="preset-sheet-delete-confirm" data-testid="preset-sheet-delete-confirm" onclick={() => finish(ondelete())}>
     Confirm delete
    </button>
   {:else}
    <button class="item danger-text" id="preset-sheet-delete" data-testid="preset-sheet-delete" onclick={() => (confirmingDelete = true)}>
     Delete “{activeName}”
    </button>
   {/if}
   {#if error}
    <p class="error" id="preset-sheet-error" data-testid="preset-sheet-error" role="alert">{error}</p>
   {/if}
   <button class="item secondary" id="preset-sheet-cancel" data-testid="preset-sheet-cancel" onclick={onclose}>Cancel</button>
  {:else}
   <form class="name-form" onsubmit={submitName}>
    <label class="title" id="preset-sheet-title" for="preset-name-input">
     {view === "rename" ? "Rename preset" : "Save preset"}
    </label>
    <input
     id="preset-name-input"
     data-testid="preset-name-input"
     bind:value={nameValue}
     maxlength={MAX_NAME_LENGTH}
     autocomplete="off"
     enterkeyhint="done"
     onkeydown={handleInputKeydown}
     use:focusOnMount
    />
    {#if error}
     <p class="error" id="preset-sheet-error" data-testid="preset-sheet-error" role="alert">{error}</p>
    {/if}
    <div class="row">
     <button type="button" class="item secondary" id="preset-sheet-cancel" data-testid="preset-sheet-cancel" onclick={onclose}>
      Cancel
     </button>
     <button type="submit" class="item primary" id="preset-name-save" data-testid="preset-name-save" disabled={!canSave}>
      Save
     </button>
    </div>
   </form>
  {/if}
 </div>
</div>

<style>
 .sheet-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
 }

 .backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  cursor: pointer;
 }

 .panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 500px;
  padding: 20px 20px max(20px, env(safe-area-inset-bottom));
  border: 1px solid #333;
  border-radius: 16px 16px 0 0;
  background: #1a1a1a;
  color: #fff;
 }

 @media (min-width: 768px) {
  .sheet-root {
   justify-content: center;
  }

  .panel {
   max-width: 420px;
   border-radius: 16px;
  }
 }

 .title {
  display: block;
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  overflow-wrap: anywhere;
 }

 .name-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
 }

 .item {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: #2a2a2a;
  color: #fff;
  font: inherit;
  font-size: 1.1rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  overflow-wrap: anywhere;
 }

 .item:active:not(:disabled) {
  opacity: 0.7;
 }

 .item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
 }

 .primary {
  background: #2ecc71;
  color: #000;
  font-weight: 600;
 }

 .danger {
  background: #e8450e;
  font-weight: 600;
 }

 .danger-text {
  color: #ff6b4a;
 }

 .secondary {
  background: none;
  color: #aaa;
 }

 .row {
  display: flex;
  gap: 8px;
 }

 .row .item {
  flex: 1;
 }

 /* 1.2rem keeps iOS Safari from zooming in when the field gets focus */
 input {
  width: 100%;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid #444;
  border-radius: 10px;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 1.2rem;
 }

 input:focus {
  outline: 2px solid #2ecc71;
  outline-offset: 1px;
 }

 .error {
  margin: 0;
  color: #ff6b4a;
  font-size: 0.95rem;
 }
</style>
