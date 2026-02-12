<script lang="ts">
  interface Props {
    label: string;
    color: string;
    value: number;
    minValue?: number;
    maxValue: number;
    step: number;
    formatValue: (v: number) => string;
    formatRulerLabel: (v: number) => string;
    rulerLabelInterval: number;
    onchange: (value: number) => void;
    onclose: () => void;
    oncancel: () => void;
  }

  let {
    label,
    color,
    value,
    minValue = 0,
    maxValue,
    step,
    formatValue,
    formatRulerLabel,
    rulerLabelInterval,
    onchange,
    onclose,
    oncancel,
  }: Props = $props();

  let rulerEl: HTMLDivElement | undefined = $state(undefined);

  const fillPercent = $derived(Math.min((value / maxValue) * 100, 100));

  // Generate tick values from step to maxValue
  const ticks = $derived.by(() => {
    const result: number[] = [];
    for (let v = step; v <= maxValue; v += step) {
      result.push(v);
    }
    return result;
  });

  function tickPercent(tickValue: number): number {
    return (tickValue / maxValue) * 100;
  }

  function isLabelTick(tickValue: number): boolean {
    return tickValue % rulerLabelInterval === 0;
  }

  function valueFromY(clientY: number): number {
    if (!rulerEl) return value;
    const rect = rulerEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const percent = Math.max(0, Math.min(y / rect.height, 1));
    const raw = percent * maxValue;
    const snapped = Math.round(raw / step) * step;
    return Math.max(minValue, Math.min(snapped, maxValue));
  }

  function handlePointerDown(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const newVal = valueFromY(e.clientY);
    onchange(newVal);
  }

  function handlePointerMove(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (!target.hasPointerCapture(e.pointerId)) return;
    const newVal = valueFromY(e.clientY);
    onchange(newVal);
  }

  function handlePointerUp(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
      onclose();
    }
  }
</script>

<div class="ruler-picker" data-testid="ruler-picker">
  <!-- Fixed header — always visible, tap to close/confirm -->
  <button class="header" style:background-color={color} onclick={onclose}>
    <span class="header-label">{label}</span>
    <span class="header-value">{formatValue(value)}</span>
  </button>

  <!-- Ruler area — ticks at fixed positions, fill overlay slides down -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="ruler"
    bind:this={rulerEl}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
  >
    <!-- Colored fill (slides down from top of ruler) -->
    <div
      class="fill"
      style:height="{fillPercent}%"
      style:background-color={color}
    ></div>

    <!-- Handle at fill boundary -->
    <div class="handle-row" style:top="{fillPercent}%">
      <div class="handle-pill"></div>
    </div>

    <!-- Tick marks (fixed positions, always visible below fill) -->
    {#each ticks as tickVal}
      {@const pct = tickPercent(tickVal)}
      {@const isLabel = isLabelTick(tickVal)}
      <div
        class="tick"
        class:tick-label={isLabel}
        style:top="{pct}%"
        data-testid="ruler-tick-{tickVal}"
      >
        {#if isLabel}
          <span class="tick-text">{formatRulerLabel(tickVal)}</span>
        {/if}
        <div class="tick-line"></div>
      </div>
    {/each}
  </div>

  <!-- Bottom bar -->
  <div class="bottom-bar">
    <button class="cancel-btn" onclick={oncancel}>Cancel</button>
  </div>
</div>

<style>
  .ruler-picker {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background: #000;
  }

  /* Fixed header — always big enough for text */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 60px 24px 24px;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    touch-action: manipulation;
  }

  .header-label {
    font-size: 1.5rem;
    font-weight: 500;
    color: #000;
  }

  .header-value {
    font-size: 2.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    color: #000;
  }

  /* Ruler area — fills remaining space */
  .ruler {
    flex: 1;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    touch-action: none;
  }

  /* Colored fill — absolute, slides down from top, covers ticks */
  .fill {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
  }

  /* Handle — sits at boundary */
  .handle-row {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    transform: translateY(-50%);
    z-index: 3;
    pointer-events: none;
  }

  .handle-pill {
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background: #555;
  }

  /* Ticks — fixed positions, behind fill */
  .tick {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    height: 20px;
    transform: translateY(-50%);
    z-index: 1;
  }

  .tick-text {
    font-size: 0.85rem;
    color: #666;
    width: 50px;
    padding-left: 16px;
    flex-shrink: 0;
  }

  .tick-line {
    flex: 1;
    height: 1px;
    background: #333;
    margin-right: 16px;
  }

  .tick-label .tick-line {
    background: #555;
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    flex-shrink: 0;
  }

  .cancel-btn {
    background: #222;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
  }

  .cancel-btn:active {
    opacity: 0.7;
  }
</style>
