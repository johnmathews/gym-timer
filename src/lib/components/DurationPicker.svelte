<script lang="ts">
	import { formatTime } from '$lib/timer';

	interface Props {
		duration: number;
		rest: number;
		reps: number;
		disabled?: boolean;
		onchange?: (duration: number, rest: number, reps: number) => void;
	}

	let { duration = $bindable(0), rest = $bindable(0), reps = $bindable(1), disabled = false, onchange }: Props = $props();

	// Non-linear stops: dense at low values, sparse at high values
	const DURATION_STOPS = [
		0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
		70, 80, 90, 100, 110, 120,
		150, 180, 210, 240, 270, 300
	];
	const REST_STOPS = [
		0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
		70, 80, 90, 100, 110, 120
	];

	function valueToIndex(value: number, stops: number[]): number {
		let closest = 0;
		let minDiff = Math.abs(value - stops[0]);
		for (let i = 1; i < stops.length; i++) {
			const diff = Math.abs(value - stops[i]);
			if (diff < minDiff) {
				minDiff = diff;
				closest = i;
			}
		}
		return closest;
	}

	const durationIndex = $derived(valueToIndex(duration, DURATION_STOPS));
	const restIndex = $derived(valueToIndex(rest, REST_STOPS));

	function handleDurationInput(e: Event) {
		const idx = parseInt((e.target as HTMLInputElement).value, 10);
		duration = DURATION_STOPS[idx];
		onchange?.(duration, rest, reps);
	}

	function handleRestInput(e: Event) {
		const idx = parseInt((e.target as HTMLInputElement).value, 10);
		rest = REST_STOPS[idx];
		onchange?.(duration, rest, reps);
	}

	function handleRepsInput(e: Event) {
		reps = parseInt((e.target as HTMLInputElement).value, 10);
		onchange?.(duration, rest, reps);
	}
</script>

<div class="duration-picker" aria-label="Duration picker">
	<input
		type="range"
		min="0"
		max={DURATION_STOPS.length - 1}
		step="1"
		value={durationIndex}
		oninput={handleDurationInput}
		{disabled}
		aria-label="Duration"
		aria-valuetext={formatTime(duration)}
		class="slider"
	/>
	<span class="slider-value">{formatTime(duration)}</span>

	<input
		type="range"
		min="0"
		max={REST_STOPS.length - 1}
		step="1"
		value={restIndex}
		oninput={handleRestInput}
		{disabled}
		aria-label="Rest"
		aria-valuetext={formatTime(rest)}
		class="slider"
	/>
	<span class="slider-value">Rest {formatTime(rest)}</span>

	<input
		type="range"
		min="0"
		max="10"
		step="1"
		value={reps}
		oninput={handleRepsInput}
		{disabled}
		aria-label="Reps"
		class="slider"
	/>
	<span class="slider-value">Reps {reps}</span>
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
