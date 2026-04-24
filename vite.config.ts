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
  },
});
