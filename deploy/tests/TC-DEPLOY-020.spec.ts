/**
 * TC-DEPLOY-020: autoteka deploy vs watch-changes — deploy без fetch, watch с fetch.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

describe("TC-DEPLOY-020", () => {
  it("deploy.sh не содержит git fetch", () => {
    const content = readFileSync(
      join(DEPLOY_ROOT, "runtime/deploy.sh"),
      "utf-8",
    );
    expect(content).not.toMatch(/git\s+fetch/);
  });

  it("watch-changes.sh содержит git fetch", () => {
    const content = readFileSync(
      join(DEPLOY_ROOT, "runtime/watch-changes.sh"),
      "utf-8",
    );
    expect(content).toMatch(/git\s+fetch/);
  });
});
