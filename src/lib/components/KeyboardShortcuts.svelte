<script lang="ts">
  const { open, onclose }: { open: boolean; onclose: () => void } = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="overlay" onclick={onclose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>Keyboard Shortcuts</h2>
      <div class="shortcuts">
        <div class="row">
          <kbd>Space</kbd>
          <span>Play / Pause / Resume</span>
        </div>
        <div class="row">
          <kbd>&larr;</kbd>
          <span>Previous segment</span>
        </div>
        <div class="row">
          <kbd>&rarr;</kbd>
          <span>Next segment</span>
        </div>
        <div class="row">
          <kbd>F</kbd>
          <span>Toggle fullscreen</span>
        </div>
        <div class="row">
          <kbd>Esc</kbd>
          <span>Close overlay / Home when finished</span>
        </div>
        <div class="row">
          <kbd>?</kbd>
          <span>Toggle this help</span>
        </div>
      </div>
      <button class="close-btn" onclick={onclose}>Close</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 16px;
    padding: 28px 28px 20px;
    max-width: 380px;
    width: 90%;
  }

  h2 {
    margin: 0 0 20px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    text-align: center;
  }

  .shortcuts {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 0;
  }

  kbd {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #333;
    color: #fff;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    min-width: 56px;
    text-align: center;
    flex-shrink: 0;
    border-bottom: 2px solid #222;
  }

  span {
    color: #aaa;
    font-size: 0.9rem;
  }

  .close-btn {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    background: #2a2a2a;
    border: none;
    border-radius: 10px;
    color: #888;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .close-btn:hover {
    background: #333;
    color: #aaa;
  }
</style>
