import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    pool: "threads",
    maxWorkers: 2,
    globals: true,
  },
});
