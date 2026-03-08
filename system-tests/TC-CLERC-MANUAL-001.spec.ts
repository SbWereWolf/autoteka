/**
 * TC-CLERC-MANUAL-001: источники данных city-list, category-list, feature-list, shops.json, generated.
 */
import { describe, it, expect } from "vitest";
// @ts-expect-error ESM test helper import typing
import { existsSync } from "node:fs";
// @ts-expect-error ESM test helper import typing
import { join, dirname } from "node:path";
// @ts-expect-error ESM test helper import typing
import { fileURLToPath } from "node:url";

// @ts-expect-error ESM test helper dirname typing
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const MOCKS = join(REPO_ROOT, "frontend/src/mocks");

describe("TC-CLERC-MANUAL-001", () => {
  const sources = [
    "city-list.json",
    "category-list.json",
    "feature-list.json",
    "shops.json",
  ];
  for (const f of sources) {
    it(`файл mocks/${f} существует`, () => {
      expect(existsSync(join(MOCKS, f))).toBe(true);
    });
  }
  it("frontend/public/generated существует", () => {
    expect(
      existsSync(join(REPO_ROOT, "frontend/public/generated")),
    ).toBe(true);
  });
});
