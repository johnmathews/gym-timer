import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, totalSeconds, createTimer } from './timer';
import { get } from 'svelte/store';

describe('formatTime', () => {
	it('formats zero', () => {
		expect(formatTime(0)).toBe('00:00');
	});

	it('formats seconds only', () => {
		expect(formatTime(5)).toBe('00:05');
		expect(formatTime(59)).toBe('00:59');
	});

	it('formats minutes and seconds', () => {
		expect(formatTime(61)).toBe('01:01');
		expect(formatTime(600)).toBe('10:00');
		expect(formatTime(5999)).toBe('99:59');
	});
});

describe('totalSeconds', () => {
	it('converts minutes and seconds', () => {
		expect(totalSeconds(0, 0)).toBe(0);
		expect(totalSeconds(1, 30)).toBe(90);
		expect(totalSeconds(5, 0)).toBe(300);
		expect(totalSeconds(0, 45)).toBe(45);
	});
});

describe('createTimer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts in idle state with 0 remaining', () => {
		const timer = createTimer();
		expect(get(timer.status)).toBe('idle');
		expect(get(timer.remaining)).toBe(0);
		timer.destroy();
	});

	it('sets duration correctly', () => {
		const timer = createTimer();
		timer.setDuration(1, 30);
		expect(get(timer.duration)).toBe(90);
		expect(get(timer.remaining)).toBe(90);
		expect(get(timer.status)).toBe('idle');
		timer.destroy();
	});

	it('does not start with 0 duration', () => {
		const timer = createTimer();
		timer.setDuration(0, 0);
		timer.start();
		expect(get(timer.status)).toBe('idle');
		timer.destroy();
	});

	it('counts down each second', () => {
		const timer = createTimer();
		timer.setDuration(0, 5);
		timer.start();

		expect(get(timer.status)).toBe('running');
		expect(get(timer.remaining)).toBe(5);

		vi.advanceTimersByTime(1000);
		expect(get(timer.remaining)).toBe(4);

		vi.advanceTimersByTime(1000);
		expect(get(timer.remaining)).toBe(3);

		timer.destroy();
	});

	it('finishes when reaching zero', () => {
		const timer = createTimer();
		timer.setDuration(0, 3);
		timer.start();

		vi.advanceTimersByTime(3000);
		expect(get(timer.remaining)).toBe(0);
		expect(get(timer.status)).toBe('finished');

		timer.destroy();
	});

	it('pauses and resumes', () => {
		const timer = createTimer();
		timer.setDuration(0, 10);
		timer.start();

		vi.advanceTimersByTime(3000);
		expect(get(timer.remaining)).toBe(7);

		timer.pause();
		expect(get(timer.status)).toBe('paused');

		vi.advanceTimersByTime(5000);
		expect(get(timer.remaining)).toBe(7); // didn't change

		timer.start();
		expect(get(timer.status)).toBe('running');

		vi.advanceTimersByTime(2000);
		expect(get(timer.remaining)).toBe(5);

		timer.destroy();
	});

	it('resets to original duration', () => {
		const timer = createTimer();
		timer.setDuration(0, 10);
		timer.start();

		vi.advanceTimersByTime(5000);
		expect(get(timer.remaining)).toBe(5);

		timer.reset();
		expect(get(timer.remaining)).toBe(10);
		expect(get(timer.status)).toBe('idle');

		timer.destroy();
	});

	it('resets after finishing', () => {
		const timer = createTimer();
		timer.setDuration(0, 2);
		timer.start();

		vi.advanceTimersByTime(2000);
		expect(get(timer.status)).toBe('finished');

		timer.reset();
		expect(get(timer.remaining)).toBe(2);
		expect(get(timer.status)).toBe('idle');

		timer.destroy();
	});
});
