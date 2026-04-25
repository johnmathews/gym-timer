import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import yaml from "@modyfi/vite-plugin-yaml";
import { resolve } from "path";

const useTestPresets = !!process.env.VITEST || !!process.env.TEST_PRESETS;
const presetsFile = useTestPresets ? "tests/fixtures/presets.yml" : "presets.yml";

export default defineConfig({
  plugins: [sveltekit(), yaml()],
  resolve: {
    alias: {
      "$presets": resolve(import.meta.dirname, presetsFile),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
    pool: "threads",
    setupFiles: [],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/index.ts"],
      reporter: ["text", "html", "clover", "json"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
