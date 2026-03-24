/**
 * TC-README-009: шаблон env — frontend/example.env.
 * Документ: README.md
 * Каталог тестов: system-tests
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

describe("TC-README-009", () => {
  it("frontend/example.env существует", () => {
    expect(existsSync(join(REPO_ROOT, "frontend/example.env"))).toBe(
      true,
    );
  });
});
