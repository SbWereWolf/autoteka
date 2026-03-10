/**
 * TC-README-001: в репозитории есть каталоги deploy/, frontend/, backend/.
 * Документ: README.md
 * Каталог тестов: system-tests
 */
import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

describe("TC-README-001", () => {
  const dirs = ["deploy", "frontend", "backend"] as const;

  for (const dir of dirs) {
    it(`каталог ${dir}/ существует и является директорией`, () => {
      const path = join(REPO_ROOT, dir);
      expect(existsSync(path), `${dir}/ должен существовать`).toBe(
        true,
      );
      const stat = statSync(path);
      expect(
        stat.isDirectory(),
        `${dir}/ должен быть директорией`,
      ).toBe(true);
    });
  }
});
