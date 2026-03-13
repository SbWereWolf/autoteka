/**
 * TC-DEPLOY-004: deploy.sh не делает git fetch и git reset.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-004", () => {
  it("deploy.sh не содержит git fetch", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    expect(content).not.toMatch(/git\s+fetch/);
  });

  it("deploy.sh не содержит git reset", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    expect(content).not.toMatch(/git\s+reset/);
  });
});
