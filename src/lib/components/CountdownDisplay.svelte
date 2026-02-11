<script lang="ts">
	import { formatTime } from '$lib/timer';
	import type { TimerPhase } from '$lib/timer';

	interface Props {
		remaining: number;
		finished: boolean;
		phase?: TimerPhase;
		currentRep?: number;
		totalReps?: number;
	}

	let { remaining, finished, phase = 'work', currentRep = 1, totalReps = 1 }: Props = $props();

	const showRepInfo = $derived(totalReps > 1);
	const phaseLabel = $derived(phase === 'work' ? 'Work' : 'Rest');
</script>

<div class="countdown-display" class:finished class:resting={phase === 'rest'} aria-live="polite" aria-label="Time remaining">
	{#if showRepInfo}
		<span class="phase-label" data-testid="phase-label">{phaseLabel}</span>
	{/if}
	<span class="time" data-testid="countdown-time">{formatTime(remaining)}</span>
	{#if showRepInfo}
		<span class="rep-counter" data-testid="rep-counter">Rep {currentRep} / {totalReps}</span>
	{/if}
</div>

<style>
	.countdown-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		border-radius: 16px;
		transition: background-color 0.3s ease;
	}

	.countdown-display.finished {
		animation: pulse 0.6s ease-in-out infinite alternate;
		background-color: var(--color-alert, #e74c3c);
	}

	.countdown-display.resting {
		background-color: var(--color-warning, #f39c12);
	}

	.time {
		font-size: 5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.05em;
		color: var(--color-text, #333);
	}

	.finished .time {
		color: #fff;
	}

	.phase-label {
		font-size: 1.25rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted, #888);
	}

	.resting .phase-label {
		color: #fff;
	}

	.finished .phase-label {
		color: #fff;
	}

	.rep-counter {
		font-size: 1.1rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted, #888);
	}

	.resting .rep-counter {
		color: #fff;
	}

	.finished .rep-counter {
		color: #fff;
	}

	@keyframes pulse {
		from {
			background-color: var(--color-alert, #e74c3c);
		}
		to {
			background-color: var(--color-alert-bright, #ff6b6b);
		}
	}
</style>
