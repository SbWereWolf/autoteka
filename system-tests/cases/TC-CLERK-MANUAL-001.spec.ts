/**
 * TC-CLERK-MANUAL-001: в CLERK_MANUAL перечислены актуальные проверки публикации.
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
const manualPath = join(REPO_ROOT, "docs/manual/CLERK_MANUAL.md");
const manual = readFileSync(manualPath, "utf8");

describe("TC-CLERK-MANUAL-001", () => {
  const requiredMentions = [
    "npm run test",
    "/api/v1/*-list",
    "/shop/:code",
    "/storage/*",
    "MoonShine",
  ];
  for (const text of requiredMentions) {
    it(`в документе указан путь ${text}`, () => {
      expect(manual.includes(text)).toBe(true);
    });
  }
});
