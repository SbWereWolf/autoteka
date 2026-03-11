import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  headed,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-010", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("user flow каталог -> магазин -> назад", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      const html = await page.content();
      expect(html).toContain('id="app"');

      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/test-shop`,
        {
          waitUntil: "domcontentloaded",
        },
      );
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/$/, { timeout: 10000 });

      const htmlBack = await page.content();
      expect(htmlBack).toContain('id="app"');
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
