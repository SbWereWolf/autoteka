/**
 * TC-FSCRIPTS-README: frontend/scripts утилиты.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");
const SCRIPTS_DIR = join(FRONTEND_ROOT, "scripts");

describe("TC-FSCRIPTS-README-001", () => {
  it("в frontend/scripts нет устаревших .mjs генераторов", () => {
    const files = readdirSync(SCRIPTS_DIR).filter((f) =>
      f.endsWith(".mjs"),
    );
    expect(files.length).toBe(0);
  });
});

describe("TC-FSCRIPTS-README-009", () => {
  it("в package.json нет устаревших data/media команд", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    );
    const s = pkg.scripts || {};
    expect(s["images:regen"]).toBeUndefined();
    expect(s["images:moonshine"]).toBeUndefined();
    expect(s["materialize:shop-media"]).toBeUndefined();
  });
});
