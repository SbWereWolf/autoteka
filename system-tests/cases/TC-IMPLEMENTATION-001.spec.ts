/**
 * TC-IMPLEMENTATION-001: зоны frontend/, backend/, infrastructure/.
 */
import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

describe("TC-IMPLEMENTATION-001", () => {
  for (const zone of ["frontend", "backend", "infrastructure"]) {
    it(`зона ${zone}/ существует`, () => {
      const p = join(REPO_ROOT, zone);
      expect(existsSync(p)).toBe(true);
      expect(statSync(p).isDirectory()).toBe(true);
    });
  }
});
