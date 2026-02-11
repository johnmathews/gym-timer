import { test, expect } from '@playwright/test';

test.describe('Gym Timer', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('shows the app title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Gym Timer' })).toBeVisible();
	});

	test('has duration picker with default values', async ({ page }) => {
		await expect(page.getByRole('spinbutton', { name: 'Minutes' })).toBeVisible();
		await expect(page.getByRole('spinbutton', { name: 'Seconds' })).toBeVisible();
	});

	test('shows start button initially', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('does not show reset button when idle', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
	});

	test('can set duration and start timer', async ({ page }) => {
		const minutesInput = page.getByRole('spinbutton', { name: 'Minutes' });
		const secondsInput = page.getByRole('spinbutton', { name: 'Seconds' });

		await minutesInput.fill('0');
		await secondsInput.fill('3');

		await page.getByRole('button', { name: 'Start' }).click();

		// Should show Pause and Reset buttons
		await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

		// Start should no longer be visible
		await expect(page.getByRole('button', { name: 'Start' })).not.toBeVisible();
	});

	test('counts down and finishes with alert', async ({ page }) => {
		const minutesInput = page.getByRole('spinbutton', { name: 'Minutes' });
		const secondsInput = page.getByRole('spinbutton', { name: 'Seconds' });

		await minutesInput.fill('0');
		await secondsInput.fill('3');

		await page.getByRole('button', { name: 'Start' }).click();

		// Wait for timer to finish (3 seconds + buffer)
		await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 5000 });

		// Check finished state — the display should have the 'finished' class
		const display = page.locator('.countdown-display');
		await expect(display).toHaveClass(/finished/);
	});

	test('pause and resume works', async ({ page }) => {
		const minutesInput = page.getByRole('spinbutton', { name: 'Minutes' });
		const secondsInput = page.getByRole('spinbutton', { name: 'Seconds' });

		await minutesInput.fill('0');
		await secondsInput.fill('10');

		await page.getByRole('button', { name: 'Start' }).click();

		// Wait 2 seconds
		await page.waitForTimeout(2000);

		// Pause
		await page.getByRole('button', { name: 'Pause' }).click();
		await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

		// Capture the time
		const timeText = await page.getByTestId('countdown-time').textContent();

		// Wait another second — time should not change
		await page.waitForTimeout(1200);
		await expect(page.getByTestId('countdown-time')).toHaveText(timeText!);

		// Resume
		await page.getByRole('button', { name: 'Resume' }).click();
		await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
	});

	test('reset returns to original duration', async ({ page }) => {
		const minutesInput = page.getByRole('spinbutton', { name: 'Minutes' });
		const secondsInput = page.getByRole('spinbutton', { name: 'Seconds' });

		await minutesInput.fill('0');
		await secondsInput.fill('10');

		await page.getByRole('button', { name: 'Start' }).click();
		await page.waitForTimeout(2000);

		await page.getByRole('button', { name: 'Reset' }).click();

		await expect(page.getByTestId('countdown-time')).toHaveText('00:10');
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('increment/decrement buttons work', async ({ page }) => {
		await page.getByLabel('Increase minutes').click();
		await expect(page.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('2');

		await page.getByLabel('Decrease minutes').click();
		await expect(page.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('1');

		await page.getByLabel('Increase seconds').click();
		await expect(page.getByRole('spinbutton', { name: 'Seconds' })).toHaveValue('1');
	});
});
