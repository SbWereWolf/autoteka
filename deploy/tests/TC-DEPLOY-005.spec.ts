/**
 * TC-DEPLOY-005: deploy.sh — php, composer, migrate, seed, smoke-check, web.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

describe("TC-DEPLOY-005", () => {
  it("deploy.sh содержит упоминания composer, migrate, seed, admin/login", () => {
    const content = readFileSync(join(DEPLOY_ROOT, "deploy.sh"), "utf-8");
    expect(content).toMatch(/composer/);
    expect(content).toMatch(/migrate/);
    expect(content).toMatch(/seed/);
    expect(content).toMatch(/admin\/login|ADMIN_SMOKE/);
  });
});
