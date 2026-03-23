/**
 * TC-DEPLOY-001: docker compose, сервисы web и php.
 * Документ: infrastructure/DEPLOY.md
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-001", () => {
  it("docker-compose.yml содержит сервисы web и php", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/docker-compose.yml"),
      "utf-8",
    );
    expect(content).toMatch(/\bweb\s*:/);
    expect(content).toMatch(/\bphp\s*:/);
  });

  it("runtime-compose.sh: единая обёртка docker compose и prod по DEPLOY_ENV", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "lib/runtime-compose.sh"),
      "utf-8",
    );
    expect(content).toMatch(/autoteka_runtime_compose\(\)/);
    expect(content).toMatch(/DEPLOY_ENV/);
    expect(content).toMatch(/docker-compose\.prod\.yml/);
    expect(content).toMatch(/\/usr\/bin\/docker compose/);
  });

  it("laravel-runtime.sh: source runtime-compose.sh и вызовы autoteka_runtime_compose", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "lib/laravel-runtime.sh"),
      "utf-8",
    );
    expect(content).toMatch(/autoteka_runtime_compose exec/);
    expect(content).not.toMatch(/^\s*compose\(\)\s*\{/m);
    expect(content).toMatch(
      /source "\$INFRA_ROOT\/lib\/runtime-compose\.sh"/,
    );
  });
});
