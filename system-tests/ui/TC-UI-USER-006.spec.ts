import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  headed,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-006", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("возврат назад возвращает к каталогу", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/test-shop`,
        {
          waitUntil: "domcontentloaded",
        },
      );
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/$/, { timeout: 10000 });
      const html = await page.content();
      expect(html).toContain('id="app"');
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
