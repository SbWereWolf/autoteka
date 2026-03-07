/**
 * TC-FRONTEND-README-001..009: frontend/README.md утверждения.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

describe("TC-FRONTEND-README-001", () => {
  it("Vue 3 + Vite в package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies?.vue).toMatch(/^\^3/);
    expect(pkg.devDependencies?.vite).toBeDefined();
  });
});

describe("TC-FRONTEND-README-003", () => {
  it("example.env существует", () => {
    expect(existsSync(join(FRONTEND_ROOT, "example.env"))).toBe(true);
  });
});

describe("TC-FRONTEND-README-004", () => {
  it("скрипты dev, build, preview, test, test:e2e, check:data", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    );
    const scripts = pkg.scripts || {};
    expect(scripts.dev).toBeDefined();
    expect(scripts.build).toBeDefined();
    expect(scripts.preview).toBeDefined();
    expect(scripts.test).toBeDefined();
    expect(scripts["test:e2e"]).toBeDefined();
    expect(scripts["check:data"]).toBeDefined();
  });
});

describe("TC-FRONTEND-README-005", () => {
  it("data/media команды в package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    );
    const scripts = pkg.scripts || {};
    expect(scripts["validate:mocks"]).toBeDefined();
    expect(scripts["check:unused-assets"]).toBeDefined();
    expect(scripts["enrich:mocks"]).toBeDefined();
    expect(scripts["images:regen"]).toBeDefined();
    expect(scripts["images:moonshine"]).toBeDefined();
    expect(scripts["materialize:shop-media"]).toBeDefined();
    expect(scripts["sync:backend-media"]).toBeDefined();
  });
});

describe("TC-FRONTEND-README-006", () => {
  it("маршруты / и /shop/:code в router", () => {
    const routerPath = join(FRONTEND_ROOT, "src/router/index.ts");
    const content = readFileSync(routerPath, "utf-8");
    expect(content).toMatch(/path:\s*["']\/["']/);
    expect(content).toMatch(/\/shop\/:code/);
  });
});

describe("TC-FRONTEND-README-007", () => {
  it("VITE_API_BASE_URL в example.env и в коде", () => {
    const env = readFileSync(join(FRONTEND_ROOT, "example.env"), "utf-8");
    expect(env).toMatch(/VITE_API_BASE_URL/);
    const api = readFileSync(
      join(FRONTEND_ROOT, "src/api/HttpApiClient.ts"),
      "utf-8",
    );
    expect(api).toMatch(/import\.meta\.env\.VITE_API_BASE_URL/);
  });
});
