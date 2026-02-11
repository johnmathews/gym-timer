import { writable, derived, type Readable } from 'svelte/store';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export function formatTime(totalSeconds: number): string {
	const mins = Math.floor(totalSeconds / 60);
	const secs = totalSeconds % 60;
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function totalSeconds(minutes: number, seconds: number): number {
	return minutes * 60 + seconds;
}

export function createTimer() {
	const duration = writable(0);
	const remaining = writable(0);
	const status = writable<TimerStatus>('idle');
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function clearTick() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function setDuration(minutes: number, seconds: number) {
		const total = totalSeconds(minutes, seconds);
		duration.set(total);
		remaining.set(total);
		status.set('idle');
		clearTick();
	}

	function start() {
		let currentRemaining: number;
		remaining.subscribe((v) => (currentRemaining = v))();
		let currentStatus: TimerStatus;
		status.subscribe((v) => (currentStatus = v))();

		if (currentRemaining! <= 0) return;
		if (currentStatus! === 'running') return;

		status.set('running');
		clearTick();

		intervalId = setInterval(() => {
			remaining.update((r) => {
				const next = r - 1;
				if (next <= 0) {
					clearTick();
					status.set('finished');
					return 0;
				}
				return next;
			});
		}, 1000);
	}

	function pause() {
		let currentStatus: TimerStatus;
		status.subscribe((v) => (currentStatus = v))();
		if (currentStatus! !== 'running') return;

		clearTick();
		status.set('paused');
	}

	function reset() {
		clearTick();
		let dur: number;
		duration.subscribe((v) => (dur = v))();
		remaining.set(dur!);
		status.set('idle');
	}

	function destroy() {
		clearTick();
	}

	return {
		duration: { subscribe: duration.subscribe } as Readable<number>,
		remaining: { subscribe: remaining.subscribe } as Readable<number>,
		status: { subscribe: status.subscribe } as Readable<TimerStatus>,
		setDuration,
		start,
		pause,
		reset,
		destroy
	};
}

export function playAlertSound() {
	try {
		const ctx = new AudioContext();
		const oscillator = ctx.createOscillator();
		const gain = ctx.createGain();

		oscillator.connect(gain);
		gain.connect(ctx.destination);

		oscillator.type = 'square';
		oscillator.frequency.value = 880;
		gain.gain.value = 0.3;

		oscillator.start();
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
		oscillator.stop(ctx.currentTime + 0.8);

		// Second beep after a short pause
		const osc2 = ctx.createOscillator();
		const gain2 = ctx.createGain();
		osc2.connect(gain2);
		gain2.connect(ctx.destination);
		osc2.type = 'square';
		osc2.frequency.value = 880;
		gain2.gain.value = 0.3;
		osc2.start(ctx.currentTime + 1.0);
		gain2.gain.setValueAtTime(0.3, ctx.currentTime + 1.0);
		gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
		osc2.stop(ctx.currentTime + 1.8);

		// Third beep
		const osc3 = ctx.createOscillator();
		const gain3 = ctx.createGain();
		osc3.connect(gain3);
		gain3.connect(ctx.destination);
		osc3.type = 'square';
		osc3.frequency.value = 1100;
		gain3.gain.value = 0.3;
		osc3.start(ctx.currentTime + 2.0);
		gain3.gain.setValueAtTime(0.3, ctx.currentTime + 2.0);
		gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
		osc3.stop(ctx.currentTime + 3.0);

		setTimeout(() => ctx.close(), 4000);
	} catch {
		// Web Audio API not available — silent fallback
	}
}
