import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "tests/**/*.spec.ts"],
    pool: "forks",
    maxWorkers: "50%",
  },
});
