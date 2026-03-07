/**
 * TC-README-003: frontend локальный запуск — npm i, example.env, npm run dev.
 * Документ: README.md
 * Каталог тестов: frontend/tests
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

describe("TC-README-003", () => {
  it("в package.json есть скрипт dev", () => {
    const pkgPath = join(FRONTEND_ROOT, "package.json");
    const pkg = JSON.parse(
      readFileSync(pkgPath, "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.dev, "скрипт dev должен быть объявлен").toBeDefined();
  });

  it("файл example.env существует", () => {
    const path = join(FRONTEND_ROOT, "example.env");
    expect(existsSync(path), "frontend/example.env должен существовать").toBe(
      true,
    );
  });

  it(
    "npm install завершается без ошибки",
    { timeout: 120000 },
    () => {
      execSync("npm install", {
        cwd: FRONTEND_ROOT,
        stdio: "pipe",
        encoding: "utf-8",
      });
    },
  );
});
