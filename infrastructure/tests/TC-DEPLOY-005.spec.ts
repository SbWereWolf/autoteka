/**
 * TC-DEPLOY-005: deploy.sh — php, prepare runtime, migrate, conditional admin seed, smoke-check, web.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-005", () => {
  it("deploy содержит шаги подготовки runtime, migrate, conditional admin seed, admin/login", () => {
    const deployContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    const flowContent = readFileSync(
      join(INFRA_ROOT_PATH, "lib/deploy-flow.sh"),
      "utf-8",
    );
    expect(deployContent).toMatch(/deploy-flow\.sh/);
    expect(flowContent).toMatch(/prepare_laravel_runtime/);
    expect(flowContent).toMatch(/migrate/);
    expect(flowContent).toMatch(/seed_admin_user_if_missing_in_php/);
    expect(flowContent).toMatch(/admin\/login|ADMIN_SMOKE/);
  });
});
