/**
 * TC-DEPLOY-008: systemd unit'ы вызывают /usr/local/bin/autoteka.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");
const SYSTEMD_DIR = join(DEPLOY_ROOT, "systemd");

describe("TC-DEPLOY-008", () => {
  it("service unit-файлы вызывают /usr/local/bin/autoteka", () => {
    const files = readdirSync(SYSTEMD_DIR).filter((f) => f.endsWith(".service"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const content = readFileSync(join(SYSTEMD_DIR, f), "utf-8");
      expect(content).toMatch(/\/usr\/local\/bin\/autoteka/);
    }
  });
});
