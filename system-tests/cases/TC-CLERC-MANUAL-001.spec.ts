/**
 * TC-CLERC-MANUAL-001: в CLERC_MANUAL перечислены источники данных.
 */
import { describe, it, expect } from "vitest";
// @ts-expect-error ESM test helper import typing
import { readFileSync } from "node:fs";
// @ts-expect-error ESM test helper import typing
import { join, dirname } from "node:path";
// @ts-expect-error ESM test helper import typing
import { fileURLToPath } from "node:url";

// @ts-expect-error ESM test helper dirname typing
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const manualPath = join(REPO_ROOT, "docs/manual/CLERC_MANUAL.md");
const manual = readFileSync(manualPath, "utf8");

describe("TC-CLERC-MANUAL-001", () => {
  const requiredMentions = [
    "frontend/src/mocks/city-list.json",
    "frontend/src/mocks/category-list.json",
    "frontend/src/mocks/feature-list.json",
    "frontend/src/mocks/shops.json",
    "frontend/public/generated",
  ];
  for (const text of requiredMentions) {
    it(`в документе указан путь ${text}`, () => {
      expect(manual.includes(text)).toBe(true);
    });
  }
});
