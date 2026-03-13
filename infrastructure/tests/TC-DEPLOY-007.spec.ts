/**
 * TC-DEPLOY-007: env-контракт содержит AUTOTEKA_ROOT, INFRA_ROOT и runtime-переменные.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

const EXPECTED_VARS = [
  "AUTOTEKA_ROOT",
  "BRANCH",
  "REMOTE",
  "HTTP_PORT",
  "PHP_READY_TIMEOUT",
  "ADMIN_SMOKE_URL",
];

describe("TC-DEPLOY-007", () => {
  it("deploy.example.env содержит переменные окружения runtime", () => {
    const path = join(
      INFRA_ROOT_PATH,
      "bootstrap/config/deploy.example.env",
    );
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    for (const v of EXPECTED_VARS) {
      expect(content).toMatch(new RegExp(v));
    }
    expect(content).toMatch(/INFRA_ROOT/);
  });

  it("runtime-скрипты используют переменные из env", () => {
    const deployContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    for (const v of [
      "AUTOTEKA_ROOT",
      "PHP_READY_TIMEOUT",
      "ADMIN_SMOKE_URL",
    ]) {
      expect(deployContent).toMatch(new RegExp(v));
    }

    const watchChangesContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/watch-changes.sh"),
      "utf-8",
    );
    for (const v of ["AUTOTEKA_ROOT", "BRANCH", "REMOTE"]) {
      expect(watchChangesContent).toMatch(new RegExp(v));
    }

    const composeContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/docker-compose.yml"),
      "utf-8",
    );
    expect(composeContent).toMatch(/HTTP_PORT/);
  });
});
