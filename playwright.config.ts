import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  webServer: {
    // Copy the test fixture into static/ so the runtime fetch('/presets.yml')
    // succeeds and validates the runtime override path. Otherwise the preview
    // server logs a 404 for every test page-load.
    command:
      "cp tests/fixtures/presets.yml static/presets.yml && TEST_PRESETS=1 npm run build && npm run preview",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:4173",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
