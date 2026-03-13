/**
 * TC-USER-MANUAL-012: ссылки ADMIN_MANUAL, DEPLOY.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

describe("TC-USER-MANUAL-012", () => {
  it("docs/manual/ADMIN_MANUAL.md существует", () => {
    expect(
      existsSync(join(REPO_ROOT, "docs/manual/ADMIN_MANUAL.md")),
    ).toBe(true);
  });
  it("infrastructure/DEPLOY.md существует", () => {
    expect(existsSync(join(REPO_ROOT, "infrastructure/DEPLOY.md"))).toBe(
      true,
    );
  });
});

