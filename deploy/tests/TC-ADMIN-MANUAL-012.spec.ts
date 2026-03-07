/**
 * TC-ADMIN-MANUAL-012: deploy скрипты install, watch-changes, deploy, server-watchdog, metrics-export, server-maintenance, uninstall.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

const SCRIPTS = [
  "install.sh",
  "watch-changes.sh",
  "deploy.sh",
  "server-watchdog.sh",
  "metrics-export.sh",
  "server-maintenance.sh",
  "uninstall.sh",
];

describe("TC-ADMIN-MANUAL-012", () => {
  for (const name of SCRIPTS) {
    it(`скрипт ${name} существует`, () => {
      expect(existsSync(join(DEPLOY_ROOT, name))).toBe(true);
    });
  }
});
