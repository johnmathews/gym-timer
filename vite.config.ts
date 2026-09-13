import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
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
