/**
 * TC-README-002: существует карта документации с указанными файлами.
 * Документ: README.md
 * Каталог тестов: system-tests
 */
import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const DOC_MAP_FILES = [
  "docs/foundations/ADMIN_MANUAL.md",
  "deploy/DEPLOY.md",
  "docs/foundations/USER_MANUAL.md",
  "docs/foundations/CLERC_MANUAL.md",
  "docs/foundations/IMPLEMENTATION.md",
  "backend/README.md",
  "frontend/README.md",
] as const;

describe("TC-README-002", () => {
  for (const relPath of DOC_MAP_FILES) {
    it(`файл ${relPath} существует`, () => {
      const path = join(REPO_ROOT, relPath);
      expect(existsSync(path), `${relPath} должен существовать`).toBe(true);
      const stat = statSync(path);
      expect(stat.isFile(), `${relPath} должен быть файлом`).toBe(true);
    });
  }
});
