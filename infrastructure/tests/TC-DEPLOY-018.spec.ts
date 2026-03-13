/**
 * TC-DEPLOY-018: коды ошибок rollout/watchdog/maintenance в скриптах.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

describe("TC-DEPLOY-018", () => {
  it("deploy.sh содержит deploy_reason_code с кодами", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/deploy.sh"),
      "utf-8",
    );
    expect(content).toMatch(/DEPLOY_.*_FAILED/);
  });

  it("watch-changes.sh содержит watch_reason_code", () => {
    const content = readFileSync(
      join(INFRA_ROOT_PATH, "runtime/watch-changes.sh"),
      "utf-8",
    );
    expect(content).toMatch(/WATCH_CHANGES_.*_FAILED/);
  });
});
