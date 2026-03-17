/**
 * TC-DEPLOY-024: backup.sh и restore.sh на glob-правилах.
 * Тест-кейсы по плану: B1-B8 (backup), R1-R7 (restore).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

function read(relPath: string): string {
  return readFileSync(join(INFRA_ROOT_PATH, relPath), "utf-8");
}

const BASH = process.env.SCRIPT_BASH_PATH || process.env.BASH_PATH || "bash";

describe("TC-DEPLOY-024 backup.sh (B1-B8)", () => {
  it("backup.sh содержит логику backup_glob (apply_rule или emit_selected)", () => {
    const content = read("maintenance/backup.sh");
    expect(
      content.includes("apply_rule") ||
        content.includes("emit_selected") ||
        content.includes("compgen -G"),
    ).toBe(true);
  });

  it("backup.sh использует backup-rules-root.txt, backup-rules-autoteka.txt, backup-rules-infra.txt", () => {
    const content = read("maintenance/backup.sh");
    expect(content).toMatch(/backup-rules-root/);
    expect(content).toMatch(/backup-rules-autoteka/);
    expect(content).toMatch(/backup-rules-infra/);
  });

  it("backup.sh поддерживает --output-dir и --dry-run", () => {
    const content = read("maintenance/backup.sh");
    expect(content).toMatch(/--output-dir/);
    expect(content).toMatch(/--dry-run/);
  });

  it("backup.sh создаёт архивы autoteka-backup-root-*, autoteka-backup-autoteka-*, autoteka-backup-infra-*", () => {
    const content = read("maintenance/backup.sh");
    expect(content).toMatch(/autoteka-backup-root/);
    expect(content).toMatch(/autoteka-backup-autoteka/);
    expect(content).toMatch(/autoteka-backup-infra/);
  });

  it("файлы backup-rules-*.example.txt существуют", () => {
    expect(
      existsSync(join(INFRA_ROOT_PATH, "maintenance/config/backup-rules-root.example.txt")),
    ).toBe(true);
    expect(
      existsSync(join(INFRA_ROOT_PATH, "maintenance/config/backup-rules-autoteka.example.txt")),
    ).toBe(true);
    expect(
      existsSync(join(INFRA_ROOT_PATH, "maintenance/config/backup-rules-infra.example.txt")),
    ).toBe(true);
  });

  it("storage-backup.sh удалён (B8)", () => {
    expect(existsSync(join(INFRA_ROOT_PATH, "maintenance/storage-backup.sh"))).toBe(false);
  });

  it("B1: backup --dry-run выводит список и завершается с exit 0", () => {
    const out = spawnSync(BASH, [join(INFRA_ROOT_PATH, "maintenance/backup.sh"), "--dry-run"], {
      env: {
        ...process.env,
        INFRA_ROOT: INFRA_ROOT_PATH,
        AUTOTEKA_ROOT: join(INFRA_ROOT_PATH, ".."),
      },
      encoding: "utf-8",
    });
    expect(out.status).toBe(0);
    expect(out.stdout).toBeDefined();
  });

  it("B4: backup без root завершается с exit 1", () => {
    if (typeof process.getuid === "function" && process.getuid() === 0) return;
    const out = spawnSync(BASH, [join(INFRA_ROOT_PATH, "maintenance/backup.sh")], {
      env: { ...process.env, INFRA_ROOT: INFRA_ROOT_PATH, AUTOTEKA_ROOT: join(INFRA_ROOT_PATH, "..") },
      encoding: "utf-8",
    });
    expect(out.status).toBe(1);
  });

  it("backup.sh использует STORAGE_BACKUP_RETENTION_DAYS и удаляет старые архивы", () => {
    const content = read("maintenance/backup.sh");
    expect(content).toMatch(/STORAGE_BACKUP_RETENTION_DAYS|RETENTION_DAYS/);
    expect(content).toMatch(/find.*-mtime|removed old/);
  });
});

describe("TC-DEPLOY-024 restore.sh (R1-R7)", () => {
  it("restore.sh поддерживает --archive-root, --archive-autoteka, --archive-infra", () => {
    const content = read("maintenance/restore.sh");
    expect(content).toMatch(/--archive-root/);
    expect(content).toMatch(/--archive-autoteka/);
    expect(content).toMatch(/--archive-infra/);
  });

  it("restore.sh поддерживает --dry-run и --force", () => {
    const content = read("maintenance/restore.sh");
    expect(content).toMatch(/--dry-run/);
    expect(content).toMatch(/--force/);
  });

  it("R7: restore.sh вызывает autoteka timers-stop и health-reset/repair-infra", () => {
    const content = read("maintenance/restore.sh");
    expect(content).toMatch(/timers-stop/);
    expect(content).toMatch(/health-reset|repair-infra/);
    expect(content).not.toMatch(/run_timers_stop|run_timers_start/);
    expect(content).not.toMatch(/reset_runtime_health_state/);
  });

  it("R3: restore --dry-run выводит план", () => {
    if (typeof process.getuid === "function" && process.getuid() !== 0) return;
    const dummyArchive = join(tmpdir(), "tc-deploy-024-dummy-archive.tar.gz");
    try {
      writeFileSync(dummyArchive, "");
      const out = spawnSync(
        BASH,
        [
          join(INFRA_ROOT_PATH, "maintenance/restore.sh"),
          "--dry-run",
          `--archive-root=${dummyArchive}`,
        ],
        {
          env: { ...process.env, INFRA_ROOT: INFRA_ROOT_PATH, AUTOTEKA_ROOT: join(INFRA_ROOT_PATH, "..") },
          encoding: "utf-8",
        },
      );
      expect(out.status).toBe(0);
      expect(out.stdout).toMatch(/DRY RUN|timers-stop|health-reset|repair-infra/);
    } finally {
      try {
        unlinkSync(dummyArchive);
      } catch {
        /* ignore */
      }
    }
  });

  it("R6: restore с несуществующим архивом завершается с exit 1", () => {
    if (typeof process.getuid === "function" && process.getuid() === 0) return;
    const out = spawnSync(
      BASH,
      [
        join(INFRA_ROOT_PATH, "maintenance/restore.sh"),
        "--force",
        "--archive-root=/tmp/tc-deploy-024-nonexistent-archive.tar.gz",
      ],
      {
        env: { ...process.env, INFRA_ROOT: INFRA_ROOT_PATH, AUTOTEKA_ROOT: join(INFRA_ROOT_PATH, "..") },
        encoding: "utf-8",
      },
    );
    expect(out.status).toBe(1);
  });
});

describe("TC-DEPLOY-024 autoteka CLI", () => {
  it("autoteka содержит команды timers-stop и timers-start", () => {
    const content = read("bootstrap/bin/autoteka");
    expect(content).toMatch(/timers-stop/);
    expect(content).toMatch(/timers-start/);
  });

  it("autoteka не содержит backup-storage", () => {
    const content = read("bootstrap/bin/autoteka");
    expect(content).not.toMatch(/backup-storage/);
  });
});

describe("TC-DEPLOY-024 server-maintenance", () => {
  it("server-maintenance.sh вызывает backup.sh, не storage-backup.sh", () => {
    const content = read("maintenance/server-maintenance.sh");
    expect(content).toMatch(/backup\.sh/);
    expect(content).not.toMatch(/storage-backup/);
  });
});
