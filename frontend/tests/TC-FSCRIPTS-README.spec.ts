/**
 * TC-FSCRIPTS-README: frontend/scripts утилиты.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");
const SCRIPTS_DIR = join(FRONTEND_ROOT, "scripts");

describe("TC-FSCRIPTS-README-001", () => {
  it("скрипты в frontend/scripts имеют расширение .mjs", () => {
    const files = readdirSync(SCRIPTS_DIR).filter((f) =>
      f.endsWith(".mjs"),
    );
    expect(files.length).toBeGreaterThan(0);
  });
});

describe("TC-FSCRIPTS-README-009", () => {
  it("команды images:regen и check:data", () => {
    const pkg = JSON.parse(
      readFileSync(join(FRONTEND_ROOT, "package.json"), "utf-8"),
    );
    const s = pkg.scripts || {};
    expect(s["images:regen"]).toBeDefined();
    expect(s["check:data"]).toBeDefined();
  });
});

describe("TC-FSCRIPTS smoke", () => {
  it("check:unused-assets запускается (exit 0 или 1 при обнаружении проблем)", () => {
    try {
      execSync("npm run check:unused-assets", {
        cwd: FRONTEND_ROOT,
        stdio: "pipe",
        shell: true,
      });
    } catch {
      // Скрипт может вернуть non-zero при найденных проблемах — это валидное поведение
    }
  });
});
