/**
 * TC-README-005: для frontend доступны команды build, preview, test.
 * Документ: README.md
 * Каталог тестов: frontend/tests
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

describe("TC-README-005", () => {
  const pkg = JSON.parse(
    readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
  ) as { scripts?: Record<string, string> };

  it("в package.json есть скрипты build, preview, test", () => {
    expect(pkg.scripts?.build).toBeDefined();
    expect(pkg.scripts?.preview).toBeDefined();
    expect(pkg.scripts?.test).toBeDefined();
  });

  it("npm run build указывает на Vite build", () => {
    expect(pkg.scripts?.build).toContain("vite build");
  });

  it("npm run test указывает на Vitest", () => {
    expect(pkg.scripts?.test).toContain("vitest run");
  });

  it("npm run preview указывает на Vite preview", () => {
    expect(pkg.scripts?.preview).toContain("vite preview");
  });
});
