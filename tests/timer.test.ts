import { test, expect } from "@playwright/test";

test.describe("Timer", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
  });

  test("JS hydration works (canary)", async ({ page }) => {
    // Guard: if JS fails to load (e.g. stale preview server serving old
    // hashes), SSR-only tests still pass but interactive tests all break.
    // This test catches that failure fast by verifying a click changes state.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.getByTestId("config-card-work").click();
    await expect(page.getByTestId("ruler-picker")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("shows three config cards on landing", async ({ page }) => {
    await expect(page.getByTestId("config-card-work")).toBeVisible();
    await expect(page.getByTestId("config-card-rest")).toBeVisible();
    await expect(page.getByTestId("config-card-repeat")).toBeVisible();
  });

  test("config cards show default values", async ({ page }) => {
    await expect(page.getByTestId("config-card-work")).toContainText("1:00");
    await expect(page.getByTestId("config-card-rest")).toContainText("0:00");
    await expect(page.getByTestId("config-card-repeat")).toContainText("x10");
  });

  test("shows total time and play button", async ({ page }) => {
    await expect(page.getByTestId("total-time")).toBeVisible();
    await expect(page.getByTestId("play-button")).toBeVisible();
  });

  test("total time is calculated correctly", async ({ page }) => {
    // Default (EMOM): 60s work * 10 reps + 0s rest * 9 = 600s total => 10:00
    await expect(page.getByTestId("total-time")).toHaveText("10:00");
  });

  test("tapping work card opens ruler picker", async ({ page }) => {
    await page.getByTestId("config-card-work").click();
    await expect(page.getByTestId("ruler-picker")).toBeVisible();
    // Should show Cancel button
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("work picker cannot be set below 5 seconds", async ({ page }) => {
    await page.getByTestId("config-card-work").click();
    const ruler = page.locator(".ruler");
    const box = await ruler.boundingBox();
    // Tap at the very top of the ruler (y=0 means value=0) — this also closes the picker
    await ruler.click({ position: { x: box!.width / 2, y: 1 }, force: true });
    // Back on the config screen — work card should show 0:05, not 0:00
    await expect(page.getByTestId("config-card-work")).toContainText("0:05");
  });

  test("cancel reverts picker value", async ({ page }) => {
    await page.getByTestId("config-card-work").click();
    // Cancel without selecting a value
    await page.getByRole("button", { name: "Cancel" }).click();
    // Should return to cards with original value
    await expect(page.getByTestId("config-card-work")).toContainText("1:00");
  });

  test("play button starts timer with getReady phase", async ({ page }) => {
    await page.getByTestId("play-button").click();

    // Should show getReady phase first
    await expect(page.getByTestId("phase-header")).toBeVisible();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");
    await expect(page.getByTestId("countdown-time")).toBeVisible();
    await expect(page.getByTestId("active-screen")).toBeVisible();
  });

  test("getReady transitions to work phase", async ({ page }) => {
    // Set reps to 2 so phase header shows
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    // Set work to 5s
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    await page.getByTestId("play-button").click();

    // Should start with getReady
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");

    // Fast-forward past getReady (5s)
    await page.clock.fastForward(6000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");
  });

  test("tapping screen pauses timer", async ({ page }) => {
    await page.getByTestId("play-button").click();
    // Wait for active screen, then tap to pause
    await page.getByTestId("active-screen").click();
    const app = page.locator(".app");
    await expect(app).toHaveClass(/paused/);
  });

  test("paused state shows black background and amber controls", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();
    await page.getByTestId("active-screen").click();

    const app = page.locator(".app");
    await expect(app).toHaveClass(/paused/);

    // Should show resume and reset buttons
    await expect(page.getByTestId("resume-button")).toBeVisible();
    await expect(page.getByTestId("reset-button")).toBeVisible();

    // Phase header should be hidden when paused
    await expect(page.getByTestId("phase-header")).not.toBeVisible();
  });

  test("counts down and finishes with alert", async ({ page }) => {
    // Set duration to 5s via ruler picker (auto-closes on selection)
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 1 for quick finish
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s) + work (5s)
    await page.clock.fastForward(11000);

    await expect(page.getByTestId("countdown-time")).toHaveText("00:00");
    const app = page.locator(".app");
    await expect(app).toHaveClass(/finished/);
  });

  test("pause and resume works via screen tap", async ({ page }) => {
    await page.getByTestId("play-button").click();

    // Advance 2s into getReady
    await page.clock.fastForward(2000);

    // Tap screen to pause
    await page.getByTestId("active-screen").click();
    const app = page.locator(".app");
    await expect(app).toHaveClass(/paused/);

    // Time should freeze while paused
    const timeText = await page.getByTestId("countdown-time").textContent();
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("countdown-time")).toHaveText(timeText!);

    // Tap resume button to resume
    await page.getByTestId("resume-button").click();
    await expect(app).not.toHaveClass(/paused/);
  });

  test("reset from paused returns to idle with config cards", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();

    // Pause immediately
    await page.getByTestId("active-screen").click();
    await expect(page.locator(".app")).toHaveClass(/paused/);

    // Click reset button
    await page.getByTestId("reset-button").click();

    // Should be back to config cards
    await expect(page.getByTestId("config-card-work")).toBeVisible();
    await expect(page.getByTestId("total-time")).toBeVisible();
  });

  test("app is constrained to max-width on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const app = page.locator(".app");
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(640);
  });

  test("phase header with rep counter shown during multi-rep workout", async ({
    page,
  }) => {
    // Set reps to 2 (auto-closes on selection)
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    // Set work to 5s
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s)
    await page.clock.fastForward(6000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");
    await expect(page.getByTestId("rep-counter")).toBeVisible();
    await expect(page.getByTestId("rep-counter")).toHaveText("1/2");
    await expect(page.getByTestId("progress-bar")).toBeVisible();
  });

  test("multi-rep with rest cycles through both reps", async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set rest to 5s
    await page.getByTestId("config-card-rest").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 2
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    await page.getByTestId("play-button").click();

    // Should start in getReady phase
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");

    // getReady (5s) → work rep 1
    await page.clock.fastForward(6000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");
    await expect(page.getByTestId("rep-counter")).toHaveText("1/2");

    // work (5s) → rest
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("phase-label")).toHaveText("Rest");
    await expect(page.getByTestId("rep-counter")).toHaveText("1/2");

    // rest (5s) → work rep 2
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");
    await expect(page.getByTestId("rep-counter")).toHaveText("2/2");

    // work (5s) → finished
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("countdown-time")).toHaveText("00:00");
    const app = page.locator(".app");
    await expect(app).toHaveClass(/finished/);
  });

  test("no rep counter for single rep", async ({ page }) => {
    // Set reps to 1
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("rep-counter")).not.toBeVisible();
  });

  test("getReady background is amber", async ({ page }) => {
    await page.getByTestId("play-button").click();
    const app = page.locator(".app");
    await expect(app).toHaveClass(/getReady/);
  });

  test("full-screen green background during work phase", async ({ page }) => {
    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s)
    await page.clock.fastForward(6000);
    const app = page.locator(".app");
    await expect(app).toHaveClass(/work/);
  });

  test("full-screen orange background during rest phase", async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set rest to 5s
    await page.getByTestId("config-card-rest").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 2
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s) + work (5s) into rest
    await page.clock.fastForward(11000);
    const app = page.locator(".app");
    await expect(app).toHaveClass(/rest/);
  });

  test("ruler fill covers tick marks (no visible lines through fill)", async ({
    page,
  }) => {
    // Open work picker — default 60s (EMOM) covers tick-5
    await page.getByTestId("config-card-work").click();

    const fill = page.locator(".fill");
    const tick = page.getByTestId("ruler-tick-5");
    const fillZ = await fill.evaluate((el) => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);

    // Close picker
    await page.locator(".header").click();
  });

  test("ruler fill covers ticks in rest picker too", async ({ page }) => {
    // Select Stretch preset (rest=10s) so the rest fill has height
    await page.getByTestId("presets-button").click();
    await page.getByTestId("preset-stretch").click();
    // Open rest picker
    await page.getByTestId("config-card-rest").click();

    const fill = page.locator(".fill");
    const tick = page.getByTestId("ruler-tick-5");
    const fillZ = await fill.evaluate((el) => getComputedStyle(el).zIndex);
    const tickZ = await tick.evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(fillZ)).toBeGreaterThan(Number(tickZ));

    const fillBox = await fill.boundingBox();
    const tickBox = await tick.boundingBox();
    expect(fillBox).not.toBeNull();
    expect(tickBox).not.toBeNull();
    expect(fillBox!.y + fillBox!.height).toBeGreaterThanOrEqual(tickBox!.y);

    // Close picker
    await page.locator(".header").click();
  });

  test("black/white flash when finished", async ({ page }) => {
    // Set work to 5s (auto-closes on selection)
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 1 for quick finish
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s) + work (5s)
    await page.clock.fastForward(11000);
    await expect(page.getByTestId("countdown-time")).toHaveText("00:00");

    const app = page.locator(".app");
    await expect(app).toHaveClass(/finished/);
  });

  // --- Regression tests for round 3 improvements ---

  test("repeat picker cannot go below 1", async ({ page }) => {
    await page.getByTestId("config-card-repeat").click();
    // Click near the very top of the ruler to attempt selecting 0
    const ruler = page.locator(".ruler");
    const box = await ruler.boundingBox();
    await ruler.click({ position: { x: box!.width / 2, y: 2 } });
    // Auto-closes; value must be clamped to x1, never x0
    await expect(page.getByTestId("config-card-repeat")).toContainText("x1");
    await expect(page.getByTestId("config-card-repeat")).not.toContainText(
      "x0",
    );
  });

  test("picker auto-closes when a value is selected on the ruler", async ({
    page,
  }) => {
    await page.getByTestId("config-card-work").click();
    await expect(page.getByTestId("ruler-picker")).toBeVisible();
    // Select a value by clicking a tick
    await page.getByTestId("ruler-tick-60").click({ force: true });
    // Picker should auto-close without needing to tap the header
    await expect(page.getByTestId("ruler-picker")).not.toBeVisible();
    await expect(page.getByTestId("config-card-work")).toBeVisible();
    // The selected value should be applied
    await expect(page.getByTestId("config-card-work")).toContainText("1:00");
  });

  test("active timer fills full viewport on desktop (no black bars)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.getByTestId("play-button").click();

    const app = page.locator(".app");
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    // During active state the app must fill the entire viewport width
    expect(box!.width).toBeGreaterThanOrEqual(1280 - 1);
  });

  test("countdown content is vertically centered, not stuck at top", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();

    const countdown = page.locator(".countdown-display");
    const box = await countdown.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    // Center of the countdown should be in the middle portion of the screen
    const centerY = box!.y + box!.height / 2;
    expect(centerY).toBeGreaterThan(viewport.height * 0.25);
    expect(centerY).toBeLessThan(viewport.height * 0.65);
  });

  test("tapping screen while finished does nothing", async ({ page }) => {
    // Set work to 5s
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 1 for quick finish
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();
    await page.clock.fastForward(11000);

    const app = page.locator(".app");
    await expect(app).toHaveClass(/finished/);

    // Tap screen — should stay on finished screen, not reset
    await page.getByTestId("active-screen").click();
    await expect(app).toHaveClass(/finished/);
    await expect(page.getByTestId("countdown-time")).toHaveText("00:00");
  });

  test("finished state shows reset button but no resume", async ({ page }) => {
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 1 for quick finish
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();
    await page.clock.fastForward(11000);

    await expect(page.getByTestId("reset-button")).toBeVisible();
    await expect(page.getByTestId("resume-button")).not.toBeVisible();
  });

  test("progress bar has correct number of segments", async ({ page }) => {
    // Set reps to 3
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-3").click({ force: true });

    await page.getByTestId("play-button").click();

    // Fast-forward past getReady (5s)
    await page.clock.fastForward(6000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");

    const segments = page.locator('[data-testid="progress-bar"] .segment');
    await expect(segments).toHaveCount(3);
  });

  test("getReady countdown shows correct initial time", async ({ page }) => {
    await page.getByTestId("play-button").click();

    // Should show 00:05 at the start of getReady
    await expect(page.getByTestId("countdown-time")).toHaveText("00:05");
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");
  });

  test("can start a new workout after finishing", async ({ page }) => {
    await page.getByTestId("config-card-work").click();
    await page.getByTestId("ruler-tick-5").click({ force: true });

    // Set reps to 1 for quick finish
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-1").click({ force: true });

    await page.getByTestId("play-button").click();
    await page.clock.fastForward(11000);
    await expect(page.getByTestId("countdown-time")).toHaveText("00:00");

    // Click reset to go back to idle
    await page.getByTestId("reset-button").click();
    await expect(page.getByTestId("config-card-work")).toBeVisible();

    // Start again
    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");
    await expect(page.getByTestId("countdown-time")).toHaveText("00:05");
  });

  test("screen tap resumes from paused state", async ({ page }) => {
    await page.getByTestId("play-button").click();

    // Pause immediately
    await page.getByTestId("active-screen").click();
    await expect(page.locator(".app")).toHaveClass(/paused/);

    // Tap screen area (not a button) to resume
    await page.locator(".countdown-area").click();
    await expect(page.locator(".app")).not.toHaveClass(/paused/);
  });

  test("countdown time font is large and responsive", async ({ page }) => {
    await page.getByTestId("play-button").click();

    const time = page.getByTestId("countdown-time");
    const fontSize = await time.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    // Must be substantially larger than a base body font; at default
    // viewport (1280x720) min(20vw, 40vh) yields well over 100px
    expect(fontSize).toBeGreaterThanOrEqual(100);
  });

  test("volume button is visible on idle screen", async ({ page }) => {
    await expect(page.getByLabel("Volume")).toBeVisible();
  });

  test("volume button toggles slider on click", async ({ page }) => {
    const volumeBtn = page.getByRole("button", { name: "Volume" });
    await volumeBtn.click();
    await expect(page.getByLabel("Volume level")).toBeVisible();

    // Click again to close
    await volumeBtn.click();
    await expect(page.getByLabel("Volume level")).not.toBeVisible();
  });

  test("volume slider adjusts value", async ({ page }) => {
    await page.getByLabel("Volume").click();
    const slider = page.getByLabel("Volume level");
    await slider.fill("500");
    // Quadratic mapping on desktop (hover): (500/1000)^2 * 16 = 4.0
    const stored = await page.evaluate(() =>
      localStorage.getItem("timer-volume"),
    );
    expect(stored).toBe("4");
  });

  test("volume and fullscreen icons visible during active timer", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();
    await expect(page.getByRole("button", { name: "Volume" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enter fullscreen" }),
    ).toBeVisible();
  });

  // --- Presets ---

  test("presets button is visible on idle screen", async ({ page }) => {
    await expect(page.getByTestId("presets-button")).toBeVisible();
  });

  test("presets button opens preset list overlay", async ({ page }) => {
    await page.getByTestId("presets-button").click();
    await expect(page.getByTestId("preset-list")).toBeVisible();
    await expect(page.getByText("Workouts")).toBeVisible();
  });

  test("preset list shows cancel button", async ({ page }) => {
    await page.getByTestId("presets-button").click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("selecting EMOM preset populates sliders", async ({ page }) => {
    await page.getByTestId("presets-button").click();
    await page.getByTestId("preset-emom").click();
    await expect(page.getByTestId("preset-list")).not.toBeVisible();
    await expect(page.getByTestId("config-card-work")).toContainText(
      "Work 1:00",
    );
    await expect(page.getByTestId("config-card-rest")).toContainText("0:0");
    await expect(page.getByTestId("config-card-repeat")).toContainText("x10");
  });

  test("total time updates after preset selection", async ({ page }) => {
    await page.getByTestId("presets-button").click();
    await page.getByTestId("preset-emom").click();
    // EMOM: 60s work * 10 + 0s rest * 9 = 600s = 10:00
    await expect(page.getByTestId("total-time")).toHaveText("10:00");
  });

  test("can start timer after preset selection", async ({ page }) => {
    await page.getByTestId("presets-button").click();
    await page.getByTestId("preset-emom").click();
    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");
    await expect(page.getByTestId("countdown-time")).toHaveText("00:05");
  });

  // --- Swipe gestures ---

  test("active-screen has touch-action: none to prevent browser gesture interference", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();
    const screen = page.getByTestId("active-screen");
    const touchAction = await screen.evaluate(
      (el) => getComputedStyle(el).touchAction,
    );
    expect(touchAction).toBe("none");
  });

  test("swipe left skips forward from getReady to work", async ({ page }) => {
    // Need multi-rep so phase header shows
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");

    // Swipe left (deltaX < -50) — like pulling next content in from the right
    const screen = page.getByTestId("active-screen");
    const box = await screen.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx + 40, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 40, cy, { steps: 5 });
    await page.mouse.up();

    // Should have skipped forward to work phase, not paused
    await expect(page.getByTestId("phase-label")).toHaveText("Work");
    await expect(page.locator(".app")).not.toHaveClass(/paused/);
  });

  test("swipe right skips backward from work to getReady", async ({ page }) => {
    // Need multi-rep so phase header shows
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    await page.getByTestId("play-button").click();

    // Advance past getReady (5s) into work, then 1 more second
    await page.clock.fastForward(6000);
    await expect(page.getByTestId("phase-label")).toHaveText("Work");

    // Swipe right (deltaX > 50) — like pulling previous content back in
    const screen = page.getByTestId("active-screen");
    const box = await screen.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx - 40, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 40, cy, { steps: 5 });
    await page.mouse.up();

    // Should have skipped backward to getReady
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");
    await expect(page.locator(".app")).not.toHaveClass(/paused/);
  });

  test("small horizontal movement is a tap (pauses), not a swipe", async ({
    page,
  }) => {
    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");

    // Move < 50px horizontally — should be treated as a tap
    const screen = page.getByTestId("active-screen");
    const box = await screen.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 20, cy, { steps: 3 });
    await page.mouse.up();

    await expect(page.locator(".app")).toHaveClass(/paused/);
  });

  test("swipe while paused skips without resuming", async ({ page }) => {
    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("countdown-time")).toHaveText("00:05");

    // Tap to pause
    await page.getByTestId("active-screen").click();
    await expect(page.locator(".app")).toHaveClass(/paused/);

    // Record countdown before skip (paused during getReady)
    const timeBefore = await page.getByTestId("countdown-time").textContent();

    // Swipe left to skip forward
    const screen = page.getByTestId("active-screen");
    const box = await screen.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx + 40, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 40, cy, { steps: 5 });
    await page.mouse.up();

    // Should still be paused (swipe doesn't resume)
    await expect(page.locator(".app")).toHaveClass(/paused/);

    // Countdown should have changed (skipped to work phase = 01:00)
    const timeAfter = await page.getByTestId("countdown-time").textContent();
    expect(timeAfter).not.toBe(timeBefore);
  });

  test("vertical swipe does not trigger skip", async ({ page }) => {
    // Need multi-rep so phase header shows
    await page.getByTestId("config-card-repeat").click();
    await page.getByTestId("ruler-tick-2").click({ force: true });

    await page.getByTestId("play-button").click();
    await expect(page.getByTestId("phase-label")).toHaveText("Get Ready!");

    // Swipe diagonally with more vertical than horizontal movement
    // abs(deltaX) > 50 but abs(deltaY) > abs(deltaX) → should NOT skip
    const screen = page.getByTestId("active-screen");
    const box = await screen.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy - 80, { steps: 5 });
    await page.mouse.up();

    // Should have paused (tap behavior), NOT skipped to work
    await expect(page.locator(".app")).toHaveClass(/paused/);
  });
});
