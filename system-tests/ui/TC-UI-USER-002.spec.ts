import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  headed,
  waitForBaseUrlReady,
  waitForCatalogShell,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-002", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("каталог открывается в браузере без 5xx", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await waitForBaseUrlReady();
      const response = await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);
      await waitForCatalogShell(page);
      const hamburgerCount = await page
        .locator("[data-menu-button] .catalog-hamburger-line")
        .count();
      const brandCount = await page
        .locator('.catalog-topbar img[alt="TOauto.ru"]')
        .count();
      expect(hamburgerCount).toBe(4);
      expect(brandCount).toBe(1);
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  }, 180_000);
});
