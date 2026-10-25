import { test as base, type Page } from "@playwright/test";

/**
 * The app is prerendered: `page.goto` resolves on the `load` event, but SvelteKit
 * hydrates afterwards (a dynamic `import()` then an async `kit.start`). A click in
 * that window lands on server-rendered HTML with no handler and is silently lost,
 * which made tests flaky on slow CI runners (gym-timer #17). This `page` waits for
 * the `data-hydrated` marker that `src/routes/+layout.svelte` sets on mount after
 * every `goto` and `reload`, so no test can act before the app is live.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      await waitForHydration(page);
      return response;
    };
    page.reload = async (...args) => {
      const response = await reload(...args);
      await waitForHydration(page);
      return response;
    };
    await use(page);
  },
});

export { expect } from "@playwright/test";
