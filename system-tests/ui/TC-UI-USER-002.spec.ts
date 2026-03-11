import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  headed,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-002", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("каталог открывается в браузере без 5xx", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      const response = await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
      });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);
      const html = await page.content();
      expect(html).toContain('id="app"');
      expect(html).toContain("Загрузка");
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
