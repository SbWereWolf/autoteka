/**
 * TC-DEPLOY-019: server-maintenance.sh — apt clean, journal vacuum, docker prune, /tmp, logrotate.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

describe("TC-DEPLOY-019", () => {
  it("server-maintenance.sh содержит заявленные команды", () => {
    const content = readFileSync(
      join(DEPLOY_ROOT, "server-maintenance.sh"),
      "utf-8",
    );
    expect(content).toMatch(/apt\s+clean|apt-get\s+clean/);
    expect(content).toMatch(/journal|journalctl/);
    expect(content).toMatch(/docker.*prune|prune/);
    expect(content).toMatch(/\/tmp|tmp/);
    expect(content).toMatch(/logrotate/);
  });
});
