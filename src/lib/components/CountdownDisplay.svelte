<script lang="ts">
	import { formatTime } from '$lib/timer';

	interface Props {
		remaining: number;
		finished: boolean;
	}

	let { remaining, finished }: Props = $props();
</script>

<div class="countdown-display" class:finished aria-live="polite" aria-label="Time remaining">
	<span class="time" data-testid="countdown-time">{formatTime(remaining)}</span>
</div>

<style>
	.countdown-display {
		display: flex;
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

	@keyframes pulse {
		from {
			background-color: var(--color-alert, #e74c3c);
		}
		to {
			background-color: var(--color-alert-bright, #ff6b6b);
		}
	}
</style>
