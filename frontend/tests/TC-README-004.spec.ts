/**
 * TC-README-004 (часть 1–2): VITE_API_BASE_URL в example.env и в коде.
 * Документ: README.md
 * Каталог тестов: frontend/tests
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

describe("TC-README-004", () => {
  it("в example.env есть ключ VITE_API_BASE_URL", () => {
    const envPath = join(FRONTEND_ROOT, "example.env");
    expect(existsSync(envPath), "example.env должен существовать").toBe(true);
    const content = readFileSync(envPath, "utf-8");
    expect(
      content.includes("VITE_API_BASE_URL"),
      "VITE_API_BASE_URL должен быть объявлен",
    ).toBe(true);
    expect(
      content.includes("/api/v1"),
      "допустимо значение /api/v1 для same-origin",
    ).toBe(true);
  });

  it("frontend-код читает VITE_API_BASE_URL через import.meta.env", () => {
    const apiClientPath = join(FRONTEND_ROOT, "src/api/HttpApiClient.ts");
    const content = readFileSync(apiClientPath, "utf-8");
    expect(
      content.includes("import.meta.env.VITE_API_BASE_URL"),
      "HttpApiClient должен использовать import.meta.env.VITE_API_BASE_URL",
    ).toBe(true);
  });
});
