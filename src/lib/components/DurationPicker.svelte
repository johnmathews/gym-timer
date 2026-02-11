<script lang="ts">
	interface Props {
		minutes: number;
		seconds: number;
		disabled?: boolean;
		onchange?: (minutes: number, seconds: number) => void;
	}

	let { minutes = $bindable(0), seconds = $bindable(0), disabled = false, onchange }: Props = $props();

	function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	function adjustMinutes(delta: number) {
		minutes = clamp(minutes + delta, 0, 99);
		onchange?.(minutes, seconds);
	}

	function adjustSeconds(delta: number) {
		seconds = clamp(seconds + delta, 0, 59);
		onchange?.(minutes, seconds);
	}

	function handleMinutesInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value, 10);
		minutes = isNaN(val) ? 0 : clamp(val, 0, 99);
		onchange?.(minutes, seconds);
	}

	function handleSecondsInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value, 10);
		seconds = isNaN(val) ? 0 : clamp(val, 0, 59);
		onchange?.(minutes, seconds);
	}
</script>

<div class="duration-picker" aria-label="Duration picker">
	<div class="picker-column">
		<button
			class="adjust-btn"
			onclick={() => adjustMinutes(1)}
			{disabled}
			aria-label="Increase minutes"
		>&#9650;</button>
		<input
			type="number"
			min="0"
			max="99"
			value={minutes}
			oninput={handleMinutesInput}
			{disabled}
			aria-label="Minutes"
			class="time-input"
		/>
		<button
			class="adjust-btn"
			onclick={() => adjustMinutes(-1)}
			{disabled}
			aria-label="Decrease minutes"
		>&#9660;</button>
		<span class="label">min</span>
	</div>

	<span class="separator">:</span>

	<div class="picker-column">
		<button
			class="adjust-btn"
			onclick={() => adjustSeconds(1)}
			{disabled}
			aria-label="Increase seconds"
		>&#9650;</button>
		<input
			type="number"
			min="0"
			max="59"
			value={seconds}
			oninput={handleSecondsInput}
			{disabled}
			aria-label="Seconds"
			class="time-input"
		/>
		<button
			class="adjust-btn"
			onclick={() => adjustSeconds(-1)}
			{disabled}
			aria-label="Decrease seconds"
		>&#9660;</button>
		<span class="label">sec</span>
	</div>
</div>

<style>
	.duration-picker {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.picker-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.adjust-btn {
		width: 64px;
		height: 48px;
		font-size: 1.25rem;
		border: 2px solid var(--color-border, #ccc);
		border-radius: 8px;
		background: var(--color-surface, #fff);
		color: var(--color-text, #333);
		cursor: pointer;
		touch-action: manipulation;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.adjust-btn:active {
		background: var(--color-active, #e0e0e0);
	}

	.adjust-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.time-input {
		width: 64px;
		height: 64px;
		font-size: 2rem;
		text-align: center;
		border: 2px solid var(--color-border, #ccc);
		border-radius: 8px;
		background: var(--color-surface, #fff);
		color: var(--color-text, #333);
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.time-input::-webkit-inner-spin-button,
	.time-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.separator {
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--color-text, #333);
		padding-bottom: 1.5rem;
	}

	.label {
		font-size: 0.85rem;
		color: var(--color-text-muted, #888);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
