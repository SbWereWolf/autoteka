/**
 * TC-DEPLOY-023: infra/lib разделён на предметные библиотеки, монолитный _common.sh удалён,
 * а скрипты подключают только нужные им source-файлы.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

function read(relPath: string): string {
  return readFileSync(join(INFRA_ROOT_PATH, relPath), "utf-8");
}

describe("TC-DEPLOY-023", () => {
  it("infra/lib содержит специализированные библиотеки и не содержит _common.sh", () => {
    expect(
      existsSync(join(INFRA_ROOT_PATH, "lib/laravel-runtime.sh")),
    ).toBe(true);
    expect(existsSync(join(INFRA_ROOT_PATH, "lib/dry-run.sh"))).toBe(
      true,
    );
    expect(existsSync(join(INFRA_ROOT_PATH, "lib/telegram.sh"))).toBe(
      true,
    );
    expect(existsSync(join(INFRA_ROOT_PATH, "lib/health-state.sh"))).toBe(
      true,
    );
  });

  it("infra-скрипты больше не source'ят _common.sh", () => {
    const scripts = [
      "bootstrap/install.sh",
      "bootstrap/uninstall.sh",
      "maintenance/backup.sh",
      "maintenance/server-maintenance.sh",
      "observability/application/metrics-export.sh",
      "observability/infrastructure/server-watchdog.sh",
      "repair/health-reset.sh",
      "repair/repair-health.sh",
      "repair/repair-infra.sh",
      "repair/repair-runtime.sh",
      "runtime/deploy.sh",
      "runtime/watch-changes.sh",
    ];

    for (const relPath of scripts) {
      expect(read(relPath)).not.toMatch(/_common\.sh/);
    }
  });

  it("ключевые скрипты подключают предметные библиотеки по назначению", () => {
    expect(read("maintenance/backup.sh")).toMatch(/init-roots\.sh/);
    expect(read("lib/deploy-flow.sh")).toMatch(
      /source "\$INFRA_ROOT\/lib\/laravel-runtime\.sh"/,
    );
    expect(read("runtime/deploy.sh")).toMatch(
      /source "\$INFRA_ROOT\/lib\/telegram\.sh"/,
    );
    expect(read("runtime/watch-changes.sh")).toMatch(/init-roots\.sh/);
    expect(read("runtime/watch-changes.sh")).toMatch(
      /source "\$INFRA_ROOT\/lib\/telegram\.sh"/,
    );
    expect(
      read("observability/infrastructure/server-watchdog.sh"),
    ).toMatch(/source "\$INFRA_ROOT\/lib\/laravel-runtime\.sh"/);
    expect(
      read("observability/infrastructure/server-watchdog.sh"),
    ).toMatch(/source "\$INFRA_ROOT\/lib\/health-state\.sh"/);
  });
});
