/**
 * TC-CLERC-MANUAL-014: ссылки «Смежные документы» — ADMIN_MANUAL, IMPLEMENTATION, deploy/DEPLOY.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

describe("TC-CLERC-MANUAL-014", () => {
  const links = [
    "docs/foundations/ADMIN_MANUAL.md",
    "docs/foundations/IMPLEMENTATION.md",
    "deploy/DEPLOY.md",
  ];
  for (const p of links) {
    it(`файл ${p} существует`, () => {
      expect(existsSync(join(REPO_ROOT, p))).toBe(true);
    });
  }
});
