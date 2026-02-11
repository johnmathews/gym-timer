import { test, expect } from '@playwright/test';

test.describe('Gym Timer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows three config cards on landing', async ({ page }) => {
    await expect(page.getByTestId('config-card-work')).toBeVisible();
    await expect(page.getByTestId('config-card-rest')).toBeVisible();
    await expect(page.getByTestId('config-card-repeat')).toBeVisible();
  });

  test('config cards show default values', async ({ page }) => {
    await expect(page.getByTestId('config-card-work')).toContainText('0:30');
    await expect(page.getByTestId('config-card-rest')).toContainText('0:10');
    await expect(page.getByTestId('config-card-repeat')).toContainText('x1');
  });

  test('shows total time and play button', async ({ page }) => {
    await expect(page.getByTestId('total-time')).toBeVisible();
    await expect(page.getByTestId('play-button')).toBeVisible();
  });

  test('total time is calculated correctly', async ({ page }) => {
    // Default: 30s work * 1 rep + 0 rest = 30s total => 0:30
    await expect(page.getByTestId('total-time')).toHaveText('0:30');
  });

  test('tapping work card opens ruler picker', async ({ page }) => {
    await page.getByTestId('config-card-work').click();
    await expect(page.getByTestId('ruler-picker')).toBeVisible();
    // Should show Cancel button
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('cancel reverts picker value', async ({ page }) => {
    await page.getByTestId('config-card-work').click();
    // Click a tick to change the value
    await page.getByTestId('ruler-tick-60').click({ force: true });
    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    // Should return to cards with original value
    await expect(page.getByTestId('config-card-work')).toContainText('0:30');
  });

  test('play button starts timer and shows countdown', async ({ page }) => {
    await page.getByTestId('play-button').click();

    await expect(page.getByTestId('countdown-time')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('shows start button when idle (not play button)', async ({ page }) => {
    // In running/paused state we get Start/Resume button from TimerControls
    await page.getByTestId('play-button').click();
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('does not show reset button when idle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
  });

  test('counts down and finishes with alert', async ({ page }) => {
    // Set duration to 5s via ruler picker
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    // Close picker by tapping header
    await page.locator('.header').click();

    await page.getByTestId('play-button').click();

    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);
  });

  test('pause and resume works', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

    const timeText = await page.getByTestId('countdown-time').textContent();
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('countdown-time')).toHaveText(timeText!);

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('reset returns to idle with config cards', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Reset' }).click();

    // Should be back to config cards
    await expect(page.getByTestId('config-card-work')).toBeVisible();
    await expect(page.getByTestId('total-time')).toBeVisible();
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
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });
    await page.locator('.header').click();

    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    await page.getByTestId('play-button').click();

    await expect(page.getByTestId('rep-counter')).toBeVisible();
    await expect(page.getByTestId('rep-counter')).toHaveText('Rep 1 / 2');
    await expect(page.getByTestId('phase-label')).toHaveText('Work');
  });

  test('multi-rep with rest cycles through both reps', async ({ page }) => {
    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    // Set rest to 5s
    await page.getByTestId('config-card-rest').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    // Set reps to 2
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });
    await page.locator('.header').click();

    await page.getByTestId('play-button').click();

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
    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('rep-counter')).not.toBeVisible();
    await expect(page.getByTestId('phase-label')).not.toBeVisible();
  });

  test('full-screen teal background during work phase', async ({ page }) => {
    await page.getByTestId('play-button').click();
    const app = page.locator('.app');
    await expect(app).toHaveClass(/work/);
  });

  test('full-screen coral background during rest phase', async ({ page }) => {
    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    // Set rest to 5s
    await page.getByTestId('config-card-rest').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    // Set reps to 2
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });
    await page.locator('.header').click();

    await page.getByTestId('play-button').click();

    // Wait for rest phase
    const app = page.locator('.app');
    await expect(app).toHaveClass(/rest/, { timeout: 7000 });
  });

  test('ruler fill covers tick marks (no visible lines through fill)', async ({ page }) => {
    // Set work to 3:00 so the fill covers several ticks
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-180').click({ force: true });

    // The fill element must have a higher z-index than the ticks
    const fill = page.locator('.fill');
    const tick = page.getByTestId('ruler-tick-60'); // 1:00 tick, should be covered
    const fillZ = await fill.evaluate(el => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    // The fill must be positioned to actually cover ticks below it
    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    // The fill bottom edge must be at or below the covered tick
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);
  });

  test('ruler fill covers ticks in rest picker too', async ({ page }) => {
    // Set rest to 1:00 so the fill covers several ticks
    await page.getByTestId('config-card-rest').click();
    await page.getByTestId('ruler-tick-60').click({ force: true });

    const fill = page.locator('.fill');
    const tick = page.getByTestId('ruler-tick-30'); // 30s tick, should be covered
    const fillZ = await fill.evaluate(el => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);
  });

  test('full-screen red background when finished', async ({ page }) => {
    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });
    await page.locator('.header').click();

    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);
  });
});
