<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createTimer, playAlertSound } from '$lib/timer';
	import DurationPicker from '$lib/components/DurationPicker.svelte';
	import CountdownDisplay from '$lib/components/CountdownDisplay.svelte';
	import TimerControls from '$lib/components/TimerControls.svelte';

	const timer = createTimer();
	const { remaining, status, phase, currentRep, totalReps } = timer;

	let duration = $state(30);
	let rest = $state(0);
	let reps = $state(1);
	let prevStatus: string = 'idle';

	onMount(() => {
		timer.configure(duration, rest, reps);
	});

	onDestroy(() => {
		timer.destroy();
	});

	function handlePickerChange(d: number, r: number, p: number) {
		timer.configure(d, r, p);
	}

	function handleStart() {
		let currentStatus: string;
		status.subscribe((v) => (currentStatus = v))();
		if (currentStatus! === 'idle') {
			timer.configure(duration, rest, reps);
		}
		timer.start();
	}

	$effect(() => {
		const s = $status;
		if (s === 'finished' && prevStatus !== 'finished') {
			playAlertSound();
		}
		prevStatus = s;
	});

	const canStart = $derived(duration > 0);
	const isPickerDisabled = $derived($status !== 'idle');
	const isFinished = $derived($status === 'finished');
</script>

<svelte:head>
	<title>Gym Timer</title>
	<meta name="description" content="Simple gym workout timer" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<main class="app" class:finished={isFinished}>
	<h1 class="title">Gym Timer</h1>

	<CountdownDisplay
		remaining={$remaining}
		finished={isFinished}
		phase={$phase}
		currentRep={$currentRep}
		totalReps={$totalReps}
	/>

	<DurationPicker
		bind:duration
		bind:rest
		bind:reps
		disabled={isPickerDisabled}
		onchange={handlePickerChange}
	/>

	<TimerControls
		status={$status}
		{canStart}
		onstart={handleStart}
		onpause={() => timer.pause()}
		onreset={() => timer.reset()}
	/>
</main>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: var(--color-bg, #f5f5f5);
		color: var(--color-text, #333);
		-webkit-font-smoothing: antialiased;
		-webkit-tap-highlight-color: transparent;
	}

	:global(:root) {
		--color-bg: #f5f5f5;
		--color-surface: #ffffff;
		--color-text: #2c3e50;
		--color-text-muted: #7f8c8d;
		--color-border: #ddd;
		--color-primary: #2ecc71;
		--color-warning: #f39c12;
		--color-muted: #95a5a6;
		--color-active: #e0e0e0;
		--color-alert: #e74c3c;
		--color-alert-bright: #ff6b6b;
	}

	.app {
		width: 100%;
		padding: 2rem 1rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		transition: background-color 0.3s ease;
	}

	.app.finished {
		background-color: var(--color-alert, #e74c3c);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.finished .title {
		color: #fff;
	}
</style>
