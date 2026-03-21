import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  getFirstShopCode,
  goBackToCatalog,
  headed,
  waitForBaseUrlReady,
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
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await waitForBaseUrlReady();
      await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/${encodeURIComponent(shopCode)}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        },
      );
      await goBackToCatalog(page);
      await page.waitForFunction(
        () =>
          document.querySelector("#app") !== null &&
          document.querySelector('[data-testid="catalog-grid-shell"]') !== null,
        { timeout: 10000 },
      );
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  }, 180_000);
});
