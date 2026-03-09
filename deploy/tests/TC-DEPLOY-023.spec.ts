/**
 * TC-DEPLOY-023: deploy/lib разделён на предметные библиотеки, монолитный _common.sh удалён,
 * а скрипты подключают только нужные им source-файлы.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEPLOY_ROOT = join(process.cwd(), "deploy");

function read(relPath: string): string {
  return readFileSync(join(DEPLOY_ROOT, relPath), "utf-8");
}

describe("TC-DEPLOY-023", () => {
  it("deploy/lib содержит специализированные библиотеки и не содержит _common.sh", () => {
    expect(existsSync(join(DEPLOY_ROOT, "lib/bootstrap.sh"))).toBe(
      true,
    );
    expect(
      existsSync(join(DEPLOY_ROOT, "lib/laravel-runtime.sh")),
    ).toBe(true);
    expect(existsSync(join(DEPLOY_ROOT, "lib/dry-run.sh"))).toBe(
      true,
    );
    expect(existsSync(join(DEPLOY_ROOT, "lib/telegram.sh"))).toBe(
      true,
    );
    expect(existsSync(join(DEPLOY_ROOT, "lib/health-state.sh"))).toBe(
      true,
    );
    expect(existsSync(join(DEPLOY_ROOT, "lib/_common.sh"))).toBe(
      false,
    );
  });

  it("deploy-скрипты больше не source'ят _common.sh", () => {
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
    expect(read("maintenance/backup.sh")).toMatch(
      /source "\$DEPLOY_DIR\/lib\/bootstrap\.sh"/,
    );
    expect(read("runtime/deploy.sh")).toMatch(
      /source "\$DEPLOY_DIR\/lib\/laravel-runtime\.sh"/,
    );
    expect(read("runtime/deploy.sh")).toMatch(
      /source "\$DEPLOY_DIR\/lib\/telegram\.sh"/,
    );
    expect(read("runtime/watch-changes.sh")).toMatch(
      /source "\$DEPLOY_DIR\/lib\/bootstrap\.sh"/,
    );
    expect(read("runtime/watch-changes.sh")).toMatch(
      /source "\$DEPLOY_DIR\/lib\/telegram\.sh"/,
    );
    expect(
      read("observability/infrastructure/server-watchdog.sh"),
    ).toMatch(/source "\$DEPLOY_DIR\/lib\/laravel-runtime\.sh"/);
    expect(
      read("observability/infrastructure/server-watchdog.sh"),
    ).toMatch(/source "\$DEPLOY_DIR\/lib\/health-state\.sh"/);
  });
});
