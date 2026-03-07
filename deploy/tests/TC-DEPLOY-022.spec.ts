/**
 * TC-DEPLOY-022: uninstall.sh — режимы soft, purge, nuke, флаги --force, --rm-etc, --rm-root.
 * Только проверка парсинга, без выполнения деструктивных операций.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

describe("TC-DEPLOY-022", () => {
  it("uninstall.sh содержит ветки режимов soft, purge, nuke", () => {
    const content = readFileSync(join(DEPLOY_ROOT, "uninstall.sh"), "utf-8");
    expect(content).toMatch(/\bsoft\b/);
    expect(content).toMatch(/\bpurge\b/);
    expect(content).toMatch(/\bnuke\b/);
  });

  it("uninstall.sh содержит флаги --force, --rm-etc, --rm-root", () => {
    const content = readFileSync(join(DEPLOY_ROOT, "uninstall.sh"), "utf-8");
    expect(content).toMatch(/--force/);
    expect(content).toMatch(/--rm-etc/);
    expect(content).toMatch(/--rm-root/);
  });
});
