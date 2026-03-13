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
});
