/**
 * TC-BACKEND-README-011: ссылки «Что читать дальше» из backend/README.
 * Документ: backend/README.md
 * Каталог тестов: system-tests
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const DOC_LINKS = [
  "docs/foundations/IMPLEMENTATION.md",
  "docs/foundations/ADMIN_MANUAL.md",
  "deploy/DEPLOY.md",
];

describe("TC-BACKEND-README-011", () => {
  for (const relPath of DOC_LINKS) {
    it(`файл ${relPath} существует`, () => {
      expect(existsSync(join(REPO_ROOT, relPath))).toBe(true);
    });
  }
});
