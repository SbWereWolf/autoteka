/**
 * TC-DEPLOY-007: deploy.env переменные — AUTOTEKA_ROOT, BRANCH, REMOTE, HTTP_PORT, etc.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

const EXPECTED_VARS = [
  "AUTOTEKA_ROOT",
  "BRANCH",
  "REMOTE",
  "HTTP_PORT",
  "PHP_READY_TIMEOUT",
  "ADMIN_SMOKE_URL",
];

describe("TC-DEPLOY-007", () => {
  it("deploy.env.example или config содержит переменные", () => {
    const examplePath = join(DEPLOY_ROOT, "config/deploy.env.example");
    const altPath = join(DEPLOY_ROOT, "config/deploy.example.env");
    const path = existsSync(examplePath) ? examplePath : altPath;
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    for (const v of ["BRANCH", "REMOTE"]) {
      expect(content).toMatch(new RegExp(v));
    }
  });

  it("deploy скрипты используют переменные из env", () => {
    const deployContent = readFileSync(join(DEPLOY_ROOT, "deploy.sh"), "utf-8");
    expect(deployContent).toMatch(/AUTOTEKA_ROOT|PHP_READY_TIMEOUT|ADMIN_SMOKE/);
  });
});
