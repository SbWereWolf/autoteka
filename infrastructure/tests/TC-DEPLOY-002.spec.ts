/**
 * TC-DEPLOY-002: watch-changes.sh — git fetch, сравнение HEAD/REMOTE, deploy.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-002", () => {
  it("watch-changes.sh содержит git fetch", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/watch-changes.sh"),
      "utf-8",
    );
    expect(content).toMatch(/git\s+fetch/);
  });

  it("watch-changes.sh вызывает deploy.sh при расхождении", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/watch-changes.sh"),
      "utf-8",
    );
    expect(content).toMatch(/deploy\.sh|deploy\b/);
  });
});
