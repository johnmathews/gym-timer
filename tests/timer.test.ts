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

	test('slider is disabled while timer is running', async ({ page }) => {
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByRole('slider', { name: 'Duration' })).toBeDisabled();
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
});
