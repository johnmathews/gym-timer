import { test, expect } from '@playwright/test';

test.describe('Gym Timer', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('shows the app title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Gym Timer' })).toBeVisible();
	});

	test('has a single duration slider', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		await expect(slider).toBeVisible();
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '300');
	});

	test('has a rest slider', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Rest' });
		await expect(slider).toBeVisible();
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '120');
		await expect(slider).toHaveAttribute('step', '5');
	});

	test('has a reps slider', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Reps' });
		await expect(slider).toBeVisible();
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '10');
		await expect(slider).toHaveAttribute('step', '1');
	});

	test('default duration is 30 seconds', async ({ page }) => {
		await expect(page.getByTestId('countdown-time')).toHaveText('00:30');
	});

	test('slider is touch-friendly (at least 44px tall)', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		const box = await slider.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	test('shows start button initially', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('does not show reset button when idle', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
	});

	test('can set duration via slider and start timer', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		await slider.fill('5');

		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start' })).not.toBeVisible();
	});

	test('all sliders are disabled while timer is running', async ({ page }) => {
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByRole('slider', { name: 'Duration' })).toBeDisabled();
		await expect(page.getByRole('slider', { name: 'Rest' })).toBeDisabled();
		await expect(page.getByRole('slider', { name: 'Reps' })).toBeDisabled();
	});

	test('counts down and finishes with alert', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		await slider.fill('5');

		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

		const display = page.locator('.countdown-display');
		await expect(display).toHaveClass(/finished/);
	});

	test('pause and resume works', async ({ page }) => {
		await page.getByRole('button', { name: 'Start' }).click();
		await page.waitForTimeout(2000);

		await page.getByRole('button', { name: 'Pause' }).click();
		await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

		const timeText = await page.getByTestId('countdown-time').textContent();
		await page.waitForTimeout(1200);
		await expect(page.getByTestId('countdown-time')).toHaveText(timeText!);

		await page.getByRole('button', { name: 'Resume' }).click();
		await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
	});

	test('reset returns to original duration', async ({ page }) => {
		await page.getByRole('button', { name: 'Start' }).click();
		await page.waitForTimeout(2000);

		await page.getByRole('button', { name: 'Reset' }).click();

		await expect(page.getByTestId('countdown-time')).toHaveText('00:30');
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('app fills the full viewport width on a laptop-sized screen', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');

		const app = page.locator('.app');
		const box = await app.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBeGreaterThanOrEqual(1280 - 1);
	});

	test('rep counter shown during multi-rep workout', async ({ page }) => {
		// Set reps to 2
		const repsSlider = page.getByRole('slider', { name: 'Reps' });
		await repsSlider.fill('2');
		const durationSlider = page.getByRole('slider', { name: 'Duration' });
		await durationSlider.fill('5');

		// Rep counter should be visible before starting
		await expect(page.getByTestId('rep-counter')).toBeVisible();
		await expect(page.getByTestId('rep-counter')).toHaveText('Rep 1 / 2');
		await expect(page.getByTestId('phase-label')).toHaveText('Work');
	});

	test('multi-rep with rest cycles through both reps', async ({ page }) => {
		const durationSlider = page.getByRole('slider', { name: 'Duration' });
		await durationSlider.fill('5');
		const restSlider = page.getByRole('slider', { name: 'Rest' });
		await restSlider.fill('5');
		const repsSlider = page.getByRole('slider', { name: 'Reps' });
		await repsSlider.fill('2');

		await page.getByRole('button', { name: 'Start' }).click();

		// Should start in work phase, rep 1
		await expect(page.getByTestId('phase-label')).toHaveText('Work');
		await expect(page.getByTestId('rep-counter')).toHaveText('Rep 1 / 2');

		// Wait for work to finish, should enter rest
		await expect(page.getByTestId('phase-label')).toHaveText('Rest', { timeout: 7000 });
		await expect(page.getByTestId('rep-counter')).toHaveText('Rep 1 / 2');

		// Wait for rest to finish, should enter rep 2 work
		await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });
		await expect(page.getByTestId('rep-counter')).toHaveText('Rep 2 / 2');

		// Wait for final rep to finish
		await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

		const display = page.locator('.countdown-display');
		await expect(display).toHaveClass(/finished/);
	});

	test('no rep counter for single rep', async ({ page }) => {
		// Default reps=1, should not show rep counter
		await expect(page.getByTestId('rep-counter')).not.toBeVisible();
		await expect(page.getByTestId('phase-label')).not.toBeVisible();
	});
});
