import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  getFirstShopCode,
  headed,
  waitForBaseUrlReady,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-005", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("переход на /shop/:code в браузере работает", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await waitForBaseUrlReady();
      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/${encodeURIComponent(shopCode)}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        },
      );
      expect(page.url()).toContain("/shop/");
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  }, 90_000);
});
