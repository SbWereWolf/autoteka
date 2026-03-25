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
  "OPTIONS_FILE",
  "AUTOTEKA_ROOT",
  "LOG_DIR",
  "GIT_BRANCH",
  "GIT_REMOTE",
  "HTTP_BIND_IP",
  "HTTP_PORT",
  "PHP_READY_TIMEOUT",
  "ADMIN_HEALTH_URL",
];

describe("TC-DEPLOY-007", () => {
  it("prod.env содержит переменные окружения runtime", () => {
    const path = join(INFRA_ROOT_PATH, "prod.env");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    for (const v of EXPECTED_VARS) {
      expect(content).toMatch(new RegExp(v));
    }
    expect(content).toMatch(/INFRA_ROOT/);
  });

  it("prod.test.env содержит отдельный runtime instance и test SQLite", () => {
    const path = join(INFRA_ROOT_PATH, "prod.test.env");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    expect(content).toMatch(/RUN_INSTANCE=autoteka-[\w-]+/);
    expect(content).toMatch(/DB_DATABASE=.*database\.test\.sqlite/);
  });

  it("dev.test.env использует shared database.sqlite и runtime instance", () => {
    const path = join(INFRA_ROOT_PATH, "dev.test.env");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    expect(content).toMatch(/RUN_INSTANCE=autoteka/);
    expect(content).toMatch(/DB_DATABASE=.*database\.sqlite/);
  });

  it("runtime-скрипты используют переменные из env", () => {
    const deployContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    for (const v of [
      "AUTOTEKA_ROOT",
      "PHP_READY_TIMEOUT",
      "ADMIN_HEALTH_URL",
    ]) {
      expect(deployContent).toMatch(new RegExp(v));
    }

    const watchChangesContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/watch-changes.sh"),
      "utf-8",
    );
    for (const v of ["AUTOTEKA_ROOT", "GIT_BRANCH", "GIT_REMOTE"]) {
      expect(watchChangesContent).toMatch(new RegExp(v));
    }

    const composeContent = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/docker-compose.yml"),
      "utf-8",
    );
    expect(composeContent).toMatch(/HTTP_BIND_IP/);
    expect(composeContent).toMatch(/HTTP_PORT/);

    const runtimeHelpersContent = readFileSync(
      join(INFRA_ROOT_PATH, "lib/laravel-runtime.sh"),
      "utf-8",
    );
    expect(runtimeHelpersContent).toMatch(/autoteka:is-there-an-admin/);
    expect(runtimeHelpersContent).toMatch(/AdminUserSeeder/);
  });
});
