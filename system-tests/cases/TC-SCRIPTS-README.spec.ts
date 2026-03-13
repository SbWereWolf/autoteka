/**
 * TC-SCRIPTS-README-001..012: scripts/README.md утверждения.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// @ts-expect-error ESM test helper dirname typing
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SCRIPTS_DIR = join(REPO_ROOT, "scripts");
const FRONTEND_SCRIPTS = join(REPO_ROOT, "frontend/scripts");
const SCRIPTS_README = readFileSync(join(SCRIPTS_DIR, "README.md"), "utf-8");

describe("TC-SCRIPTS-README-001", () => {
  it("scripts/ не содержит .mjs", () => {
    const files = readdirSync(SCRIPTS_DIR);
    const mjs = files.filter((f) => f.endsWith(".mjs"));
    expect(mjs).toHaveLength(0);
  });

  it("frontend/scripts не содержит устаревшие .mjs генераторы", () => {
    const files = readdirSync(FRONTEND_SCRIPTS);
    const mjs = files.filter((f) => f.endsWith(".mjs"));
    expect(mjs).toHaveLength(0);
  });
});

describe("TC-SCRIPTS-README-002", () => {
  it("commit-with-message.ps1 существует", () => {
    expect(
      existsSync(join(SCRIPTS_DIR, "commit-with-message.ps1")),
    ).toBe(true);
  });
});

describe("TC-SCRIPTS-README-003", () => {
  it("commit-with-message.sh существует", () => {
    expect(
      existsSync(join(SCRIPTS_DIR, "commit-with-message.sh")),
    ).toBe(true);
  });
});

describe("TC-SCRIPTS-README-008", () => {
  it("scripts/example.env существует", () => {
    expect(existsSync(join(SCRIPTS_DIR, "example.env"))).toBe(true);
  });
});

describe("TC-SCRIPTS-README-009", () => {
  it("example.env содержит SCRIPT_BASH_PATH, SCRIPT_NODE_PATH, SCRIPT_NPX_PATH, SCRIPT_PHP_PATH", () => {
    const content = readFileSync(
      join(SCRIPTS_DIR, "example.env"),
      "utf-8",
    );
    expect(content).toMatch(/SCRIPT_BASH_PATH/);
    expect(content).toMatch(/SCRIPT_NODE_PATH/);
    expect(content).toMatch(/SCRIPT_NPX_PATH/);
    expect(content).toMatch(/SCRIPT_PHP_PATH/);
  });
});

describe("TC-SCRIPTS-README-007", () => {
  it("log-entry.ps1 существует и имеет параметры Type, Message, AISystemName, LLMName", () => {
    expect(existsSync(join(SCRIPTS_DIR, "log-entry.ps1"))).toBe(true);
    const content = readFileSync(
      join(SCRIPTS_DIR, "log-entry.ps1"),
      "utf-8",
    );
    expect(content).toMatch(/UserMessage|ProposedPlan|FinalAnswer/);
    expect(content).toMatch(/logs/);
  });
});

describe("TC-SCRIPTS-README-010", () => {
  it("README фиксирует команды validate/save/load, --help и validate по умолчанию", () => {
    expect(SCRIPTS_README).toMatch(/`validate`/);
    expect(SCRIPTS_README).toMatch(/`save`/);
    expect(SCRIPTS_README).toMatch(/`load`/);
    expect(SCRIPTS_README).toMatch(/`--help`/);
    expect(SCRIPTS_README).toMatch(/команда по умолчанию/i);
  });
});

describe("TC-SCRIPTS-README-011", () => {
  it("README описывает проверку node_modules только по структуре директорий", () => {
    expect(SCRIPTS_README).toMatch(/только по списку относительных директорий/i);
    expect(SCRIPTS_README).toMatch(/без сравнения списков файлов/i);
    expect(SCRIPTS_README).toMatch(/без сравнения содержимого файлов/i);
  });
});

describe("TC-SCRIPTS-README-012", () => {
  it("README описывает quick verify cache и ручной сброс файла кэша", () => {
    expect(SCRIPTS_README).toMatch(/\/\.runtime\/verify\/minimal-src-cache\.json/);
    expect(SCRIPTS_README).toMatch(/cache hit/i);
    expect(SCRIPTS_README).toMatch(/удалите файл/i);
  });
});
