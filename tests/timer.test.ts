import { test, expect } from '@playwright/test';

// Duration stops: [0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,110,120,150,180,210,240,270,300]
// Index 1 = 5s, Index 6 = 30s
// Rest stops: [0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90,100,110,120]
// Index 1 = 5s

test.describe('Gym Timer', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('shows the app title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Gym Timer' })).toBeVisible();
	});

	test('has a duration slider with non-linear stops', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		await expect(slider).toBeVisible();
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '24');
	});

	test('has a rest slider with non-linear stops', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Rest' });
		await expect(slider).toBeVisible();
		await expect(slider).toHaveAttribute('min', '0');
		await expect(slider).toHaveAttribute('max', '18');
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
		await slider.fill('1'); // index 1 = 5 seconds

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
		await slider.fill('1'); // index 1 = 5 seconds

		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

		const app = page.locator('.app');
		await expect(app).toHaveClass(/finished/);
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
		const repsSlider = page.getByRole('slider', { name: 'Reps' });
		await repsSlider.fill('2');
		const durationSlider = page.getByRole('slider', { name: 'Duration' });
		await durationSlider.fill('1'); // index 1 = 5s

		await expect(page.getByTestId('rep-counter')).toBeVisible();
		await expect(page.getByTestId('rep-counter')).toHaveText('Rep 1 / 2');
		await expect(page.getByTestId('phase-label')).toHaveText('Work');
	});

	test('multi-rep with rest cycles through both reps', async ({ page }) => {
		const durationSlider = page.getByRole('slider', { name: 'Duration' });
		await durationSlider.fill('1'); // index 1 = 5s
		const restSlider = page.getByRole('slider', { name: 'Rest' });
		await restSlider.fill('1'); // index 1 = 5s
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

		const app = page.locator('.app');
		await expect(app).toHaveClass(/finished/);
	});

	test('no rep counter for single rep', async ({ page }) => {
		await expect(page.getByTestId('rep-counter')).not.toBeVisible();
		await expect(page.getByTestId('phase-label')).not.toBeVisible();
	});

	test('full-screen green background during work phase', async ({ page }) => {
		await page.getByRole('button', { name: 'Start' }).click();
		const app = page.locator('.app');
		await expect(app).toHaveClass(/work/);
	});

	test('full-screen orange background during rest phase', async ({ page }) => {
		const durationSlider = page.getByRole('slider', { name: 'Duration' });
		await durationSlider.fill('1'); // 5s
		const restSlider = page.getByRole('slider', { name: 'Rest' });
		await restSlider.fill('1'); // 5s
		const repsSlider = page.getByRole('slider', { name: 'Reps' });
		await repsSlider.fill('2');

		await page.getByRole('button', { name: 'Start' }).click();

		// Wait for rest phase
		const app = page.locator('.app');
		await expect(app).toHaveClass(/rest/, { timeout: 7000 });
	});

	test('full-screen red background when finished', async ({ page }) => {
		const slider = page.getByRole('slider', { name: 'Duration' });
		await slider.fill('1'); // 5s

		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

		const app = page.locator('.app');
		await expect(app).toHaveClass(/finished/);
	});
});
