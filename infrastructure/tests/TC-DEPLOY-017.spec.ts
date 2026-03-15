/**
 * TC-DEPLOY-017: любое Telegram-уведомление содержит hash и subject (первую строку
 * коммита) в блоке version.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

function read(relPath: string): string {
  return readFileSync(join(INFRA_ROOT_PATH, relPath), "utf-8");
}

describe("TC-DEPLOY-017", () => {
  it("format_telegram_message включает блок version с hash и subject", () => {
    const telegramSh = read("lib/telegram.sh");
    expect(telegramSh).toMatch(/\[version:%s\]/);
    expect(telegramSh).toMatch(/app_version_short/);
  });

  it("app_version_short возвращает hash и subject из git log", () => {
    const telegramSh = read("lib/telegram.sh");
    expect(telegramSh).toMatch(/git.*log -1.*format=.*%h/);
    expect(telegramSh).toMatch(/git.*log -1.*format=.*%s/);
    expect(telegramSh).toMatch(/—/);
  });
});
