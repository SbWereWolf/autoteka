/**
 * TC-DEPLOY-005: deploy.sh — php, prepare runtime, migrate, seed, smoke-check, web.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-005", () => {
  it("deploy.sh содержит шаги подготовки runtime, migrate, seed, admin/login", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    expect(content).toMatch(/prepare_laravel_runtime/);
    expect(content).toMatch(/migrate/);
    expect(content).toMatch(/seed/);
    expect(content).toMatch(/admin\/login|ADMIN_SMOKE/);
  });
});
