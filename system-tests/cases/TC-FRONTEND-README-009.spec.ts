/**
 * TC-FRONTEND-README-009: ссылки «Что читать дальше» из frontend/README.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const DOC_LINKS = [
  "README.md",
  "docs/manual/USER_MANUAL.md",
  "docs/manual/ADMIN_MANUAL.md",
  "docs/foundations/IMPLEMENTATION.md",
];

describe("TC-FRONTEND-README-009", () => {
  for (const relPath of DOC_LINKS) {
    it(`файл ${relPath} существует`, () => {
      expect(existsSync(join(REPO_ROOT, relPath))).toBe(true);
    });
  }
});

