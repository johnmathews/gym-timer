<script lang="ts">
	import { formatTime } from '$lib/timer';

	interface Props {
		duration: number;
		disabled?: boolean;
		onchange?: (duration: number) => void;
	}

	let { duration = $bindable(0), disabled = false, onchange }: Props = $props();

	function handleInput(e: Event) {
		duration = parseInt((e.target as HTMLInputElement).value, 10);
		onchange?.(duration);
	}
</script>

<div class="duration-picker" aria-label="Duration picker">
	<input
		type="range"
		min="0"
		max="300"
		step="5"
		value={duration}
		oninput={handleInput}
		{disabled}
		aria-label="Duration"
		class="slider"
	/>
	<span class="slider-value">{formatTime(duration)}</span>
</div>

<style>
	.duration-picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		max-width: 400px;
		padding: 0 1rem;
	}

	.slider {
		width: 100%;
		height: 44px;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		touch-action: pan-x;
	}

	.slider::-webkit-slider-runnable-track {
		height: 8px;
		border-radius: 4px;
		background: var(--color-border, #ddd);
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-primary, #2ecc71);
		border: none;
		margin-top: -14px;
	}

	.slider::-moz-range-track {
		height: 8px;
		border-radius: 4px;
		background: var(--color-border, #ddd);
		border: none;
	}

	.slider::-moz-range-thumb {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-primary, #2ecc71);
		border: none;
	}

	.slider:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.slider-value {
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted, #888);
	}
</style>
