/**
 * TC-README-005: для frontend доступны команды build, preview, test.
 * Документ: README.md
 * Каталог тестов: frontend/tests
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

const execOpts = {
  cwd: FRONTEND_ROOT,
  stdio: "pipe" as const,
  encoding: "utf-8" as const,
  shell: true,
};

describe("TC-README-005", () => {
  it("в package.json есть скрипты build, preview, test", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.build).toBeDefined();
    expect(pkg.scripts?.preview).toBeDefined();
    expect(pkg.scripts?.test).toBeDefined();
  });

  it(
    "npm run build завершается с exit code 0",
    { timeout: 60000 },
    () => {
      execSync("npm run build", execOpts);
    },
  );

  it(
    "npm run test завершается с exit code 0",
    { timeout: 90000 },
    () => {
    execSync("npm run test -- --exclude tests/TC-README-005*", {
      ...execOpts,
      timeout: 60000,
    });
  },
  );

  it(
    "npm run preview запускается без ошибки",
    { timeout: 15000 },
    () => {
      const child = spawnSync("npm run preview", {
        ...execOpts,
        timeout: 8000,
      });
      expect(
        child.status === 0 || child.signal === "SIGTERM" || child.signal === "SIGKILL",
        "preview должен стартовать (или быть остановлен по таймауту)",
      ).toBe(true);
    },
  );
});
