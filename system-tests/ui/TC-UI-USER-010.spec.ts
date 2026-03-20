import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  goBackToCatalog,
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
      await page.waitForFunction(
        () =>
          document.querySelector("#app") !== null &&
          document.querySelector('[data-testid="catalog-grid-shell"]') !== null,
        { timeout: 10000 },
      );

      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/test-shop`,
        {
          waitUntil: "domcontentloaded",
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
  });
});
