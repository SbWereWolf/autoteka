import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  headed,
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
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await page.goto(
        `${baseUrl.replace(/\/$/, "")}/shop/test-shop`,
        {
          waitUntil: "domcontentloaded",
        },
      );
      expect(page.url()).toContain("/shop/");
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
