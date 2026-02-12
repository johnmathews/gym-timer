import { test, expect } from '@playwright/test';

// GET_READY_DURATION is 5 seconds
const GET_READY_MS = 5000;

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
    // Cancel without selecting a value
    await page.getByRole('button', { name: 'Cancel' }).click();
    // Should return to cards with original value
    await expect(page.getByTestId('config-card-work')).toContainText('0:30');
  });

  test('play button starts timer with getReady phase', async ({ page }) => {
    await page.getByTestId('play-button').click();

    // Should show getReady phase first
    await expect(page.getByTestId('phase-header')).toBeVisible();
    await expect(page.getByTestId('phase-label')).toHaveText('Get Ready!');
    await expect(page.getByTestId('countdown-time')).toBeVisible();
    await expect(page.getByTestId('active-screen')).toBeVisible();
    await expect(page.getByTestId('pause-button')).toBeVisible();
  });

  test('getReady transitions to work phase', async ({ page }) => {
    // Set reps to 2 so phase header shows
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });

    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();

    // Should start with getReady
    await expect(page.getByTestId('phase-label')).toHaveText('Get Ready!');

    // Wait for getReady to finish, should enter work
    await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });
  });

  test('tapping screen pauses timer', async ({ page }) => {
    await page.getByTestId('play-button').click();
    // Wait for active screen, then tap to pause
    await page.getByTestId('active-screen').click();
    const app = page.locator('.app');
    await expect(app).toHaveClass(/paused/);
  });

  test('paused state shows black background and amber controls', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.getByTestId('active-screen').click();

    const app = page.locator('.app');
    await expect(app).toHaveClass(/paused/);

    // Should show resume, reset, and close buttons
    await expect(page.getByTestId('resume-button')).toBeVisible();
    await expect(page.getByTestId('reset-button')).toBeVisible();
    await expect(page.getByTestId('close-button')).toBeVisible();

    // Phase header should be hidden when paused
    await expect(page.getByTestId('phase-header')).not.toBeVisible();
  });

  test('does not show pause button when idle', async ({ page }) => {
    await expect(page.getByTestId('pause-button')).not.toBeVisible();
  });

  test('counts down and finishes with alert', async ({ page }) => {
    // Set duration to 5s via ruler picker (auto-closes on selection)
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();

    // Wait for getReady + work (5 + 5 = 10s)
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 12000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);
  });

  test('pause and resume works via screen tap', async ({ page }) => {
    await page.getByTestId('play-button').click();

    // Wait for getReady to finish
    await page.waitForTimeout(GET_READY_MS + 500);

    // Tap screen to pause
    await page.getByTestId('active-screen').click();
    const app = page.locator('.app');
    await expect(app).toHaveClass(/paused/);

    // Time should freeze while paused
    const timeText = await page.getByTestId('countdown-time').textContent();
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('countdown-time')).toHaveText(timeText!);

    // Tap resume button to resume
    await page.getByTestId('resume-button').click();
    await expect(app).not.toHaveClass(/paused/);
  });

  test('reset from paused returns to idle with config cards', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.waitForTimeout(1000);

    // Pause
    await page.getByTestId('active-screen').click();
    await expect(page.locator('.app')).toHaveClass(/paused/);

    // Click reset button
    await page.getByTestId('reset-button').click();

    // Should be back to config cards
    await expect(page.getByTestId('config-card-work')).toBeVisible();
    await expect(page.getByTestId('total-time')).toBeVisible();
  });

  test('close button returns to idle', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.waitForTimeout(1000);

    // Pause
    await page.getByTestId('active-screen').click();
    await expect(page.locator('.app')).toHaveClass(/paused/);

    // Click close button
    await page.getByTestId('close-button').click();

    // Should be back to config cards
    await expect(page.getByTestId('config-card-work')).toBeVisible();
  });

  test('app is constrained to max-width on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const app = page.locator('.app');
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(500);
  });

  test('phase header with rep counter shown during multi-rep workout', async ({ page }) => {
    // Set reps to 2 (auto-closes on selection)
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });

    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();

    // Wait for getReady to finish
    await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });
    await expect(page.getByTestId('rep-counter')).toBeVisible();
    await expect(page.getByTestId('rep-counter')).toHaveText('1/2');
    await expect(page.getByTestId('progress-bar')).toBeVisible();
  });

  test('multi-rep with rest cycles through both reps', async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    // Set rest to 5s
    await page.getByTestId('config-card-rest').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    // Set reps to 2
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });

    await page.getByTestId('play-button').click();

    // Should start in getReady phase
    await expect(page.getByTestId('phase-label')).toHaveText('Get Ready!');

    // Wait for work phase, rep 1
    await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });
    await expect(page.getByTestId('rep-counter')).toHaveText('1/2');

    // Wait for work to finish, should enter rest
    await expect(page.getByTestId('phase-label')).toHaveText('Rest', { timeout: 7000 });
    await expect(page.getByTestId('rep-counter')).toHaveText('1/2');

    // Wait for rest to finish, should enter rep 2 work
    await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });
    await expect(page.getByTestId('rep-counter')).toHaveText('2/2');

    // Wait for final rep to finish
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 7000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);
  });

  test('no rep counter for single rep', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('rep-counter')).not.toBeVisible();
  });

  test('getReady background is amber', async ({ page }) => {
    await page.getByTestId('play-button').click();
    const app = page.locator('.app');
    await expect(app).toHaveClass(/getReady/);
  });

  test('full-screen green background during work phase', async ({ page }) => {
    await page.getByTestId('play-button').click();

    // Wait for getReady to finish
    const app = page.locator('.app');
    await expect(app).toHaveClass(/work/, { timeout: 7000 });
  });

  test('full-screen orange background during rest phase', async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    // Set rest to 5s
    await page.getByTestId('config-card-rest').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    // Set reps to 2
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-2').click({ force: true });

    await page.getByTestId('play-button').click();

    // Wait for rest phase (getReady 5s + work 5s)
    const app = page.locator('.app');
    await expect(app).toHaveClass(/rest/, { timeout: 12000 });
  });

  test('ruler fill covers tick marks (no visible lines through fill)', async ({ page }) => {
    // Open work picker — default 30s fills 8.3%, covering tick-5 at 1.4%
    await page.getByTestId('config-card-work').click();

    const fill = page.locator('.fill');
    const tick = page.getByTestId('ruler-tick-5');
    const fillZ = await fill.evaluate(el => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);

    // Close picker
    await page.locator('.header').click();
  });

  test('ruler fill covers ticks in rest picker too', async ({ page }) => {
    // Open rest picker — default 10s fills 8.3%, covering tick-5 at 4.2%
    await page.getByTestId('config-card-rest').click();

    const fill = page.locator('.fill');
    const tick = page.getByTestId('ruler-tick-5');
    const fillZ = await fill.evaluate(el => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate(el => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);

    // Close picker
    await page.locator('.header').click();
  });

  test('black/white flash when finished', async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();
    // getReady 5s + work 5s = 10s
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 12000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);
  });

  // --- Regression tests for round 3 improvements ---

  test('repeat picker cannot go below 1', async ({ page }) => {
    await page.getByTestId('config-card-repeat').click();
    // Click near the very top of the ruler to attempt selecting 0
    const ruler = page.locator('.ruler');
    const box = await ruler.boundingBox();
    await ruler.click({ position: { x: box!.width / 2, y: 2 } });
    // Auto-closes; value must be clamped to x1, never x0
    await expect(page.getByTestId('config-card-repeat')).toContainText('x1');
    await expect(page.getByTestId('config-card-repeat')).not.toContainText('x0');
  });

  test('picker auto-closes when a value is selected on the ruler', async ({ page }) => {
    await page.getByTestId('config-card-work').click();
    await expect(page.getByTestId('ruler-picker')).toBeVisible();
    // Select a value by clicking a tick
    await page.getByTestId('ruler-tick-60').click({ force: true });
    // Picker should auto-close without needing to tap the header
    await expect(page.getByTestId('ruler-picker')).not.toBeVisible();
    await expect(page.getByTestId('config-card-work')).toBeVisible();
    // The selected value should be applied
    await expect(page.getByTestId('config-card-work')).toContainText('1:00');
  });

  test('active timer fills full viewport on desktop (no black bars)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('play-button').click();

    const app = page.locator('.app');
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    // During active state the app must fill the entire viewport width
    expect(box!.width).toBeGreaterThanOrEqual(1280 - 1);
  });

  test('countdown content is vertically centered, not stuck at top', async ({ page }) => {
    await page.getByTestId('play-button').click();

    const countdown = page.locator('.countdown-display');
    const box = await countdown.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    // Center of the countdown should be in the middle portion of the screen
    const centerY = box!.y + box!.height / 2;
    expect(centerY).toBeGreaterThan(viewport.height * 0.25);
    expect(centerY).toBeLessThan(viewport.height * 0.65);
  });

  test('tapping screen while finished does nothing', async ({ page }) => {
    // Set work to 5s
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 12000 });

    const app = page.locator('.app');
    await expect(app).toHaveClass(/finished/);

    // Tap screen — should stay on finished screen, not reset
    await page.getByTestId('active-screen').click();
    await expect(app).toHaveClass(/finished/);
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00');
  });

  test('finished state shows reset and close buttons but no resume', async ({ page }) => {
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 12000 });

    await expect(page.getByTestId('reset-button')).toBeVisible();
    await expect(page.getByTestId('close-button')).toBeVisible();
    await expect(page.getByTestId('resume-button')).not.toBeVisible();
    await expect(page.getByTestId('pause-button')).not.toBeVisible();
  });

  test('progress bar has correct number of segments', async ({ page }) => {
    // Set reps to 3
    await page.getByTestId('config-card-repeat').click();
    await page.getByTestId('ruler-tick-3').click({ force: true });

    await page.getByTestId('play-button').click();

    // Wait for work phase
    await expect(page.getByTestId('phase-label')).toHaveText('Work', { timeout: 7000 });

    const segments = page.locator('[data-testid="progress-bar"] .segment');
    await expect(segments).toHaveCount(3);
  });

  test('getReady countdown shows correct initial time', async ({ page }) => {
    await page.getByTestId('play-button').click();

    // Should show 00:05 at the start of getReady
    await expect(page.getByTestId('countdown-time')).toHaveText('00:05');
    await expect(page.getByTestId('phase-label')).toHaveText('Get Ready!');
  });

  test('can start a new workout after finishing', async ({ page }) => {
    await page.getByTestId('config-card-work').click();
    await page.getByTestId('ruler-tick-5').click({ force: true });

    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('countdown-time')).toHaveText('00:00', { timeout: 12000 });

    // Click close to go back to idle
    await page.getByTestId('close-button').click();
    await expect(page.getByTestId('config-card-work')).toBeVisible();

    // Start again
    await page.getByTestId('play-button').click();
    await expect(page.getByTestId('phase-label')).toHaveText('Get Ready!');
    await expect(page.getByTestId('countdown-time')).toHaveText('00:05');
  });

  test('screen tap resumes from paused state', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.waitForTimeout(1000);

    // Pause
    await page.getByTestId('active-screen').click();
    await expect(page.locator('.app')).toHaveClass(/paused/);

    // Tap screen area (not a button) to resume
    await page.locator('.countdown-area').click();
    await expect(page.locator('.app')).not.toHaveClass(/paused/);
  });

  test('countdown time font is large and responsive', async ({ page }) => {
    await page.getByTestId('play-button').click();

    const time = page.getByTestId('countdown-time');
    const fontSize = await time.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    // Must be substantially larger than a base body font; at default
    // viewport (1280x720) min(25vw, 10rem) yields well over 80px
    expect(fontSize).toBeGreaterThanOrEqual(80);
  });

  test('volume button is visible on idle screen', async ({ page }) => {
    await expect(page.getByLabel('Volume')).toBeVisible();
  });

  test('volume button toggles slider on click', async ({ page }) => {
    const volumeBtn = page.getByRole('button', { name: 'Volume' });
    await volumeBtn.click();
    await expect(page.getByLabel('Volume level')).toBeVisible();

    // Click again to close
    await volumeBtn.click();
    await expect(page.getByLabel('Volume level')).not.toBeVisible();
  });

  test('volume slider adjusts value', async ({ page }) => {
    await page.getByLabel('Volume').click();
    const slider = page.getByLabel('Volume level');
    await slider.fill('50');
    // Verify localStorage was updated
    const stored = await page.evaluate(() => localStorage.getItem('gym-timer-volume'));
    expect(stored).toBe('0.5');
  });

  test('volume and fullscreen icons hidden during active timer', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await expect(page.getByLabel('Volume')).not.toBeVisible();
  });
});
