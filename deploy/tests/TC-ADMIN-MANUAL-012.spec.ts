/**
 * TC-ADMIN-MANUAL-012: deploy-скрипты разложены по областям ответственности.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEPLOY_ROOT = join(__dirname, "..");

const PATHS = [
  "bootstrap/install.sh",
  "runtime/watch-changes.sh",
  "runtime/deploy.sh",
  "runtime/docker-compose.yml",
  "runtime/docker-compose.dev.yml",
  "observability/infrastructure/server-watchdog.sh",
  "observability/application/metrics-export.sh",
  "maintenance/server-maintenance.sh",
  "bootstrap/uninstall.sh",
];

describe("TC-ADMIN-MANUAL-012", () => {
  for (const name of PATHS) {
    it(`${name} существует`, () => {
      expect(existsSync(join(DEPLOY_ROOT, name))).toBe(true);
    });
  }
});
