/**
 * TC-DEPLOY-008: systemd unit'ы вызывают /usr/local/bin/autoteka.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");
const SYSTEMD_DIRS = [
  join(DEPLOY_ROOT, "runtime/systemd"),
  join(DEPLOY_ROOT, "maintenance/systemd"),
  join(DEPLOY_ROOT, "observability/infrastructure/systemd"),
];

describe("TC-DEPLOY-008", () => {
  it("service unit-файлы вызывают /usr/local/bin/autoteka", () => {
    const files = SYSTEMD_DIRS.flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => f.endsWith(".service"))
        .map((f) => join(dir, f)),
    );

    expect(files.length).toBeGreaterThan(0);

    for (const path of files) {
      const content = readFileSync(path, "utf-8");
      expect(content).toMatch(/\/usr\/local\/bin\/autoteka/);
    }
  });
});
