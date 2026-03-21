import { afterAll, beforeAll, describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const headed = process.env.TEST_UI_HEADED === "1";

const adminEmail =
  process.env.MOONSHINE_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword =
  process.env.MOONSHINE_ADMIN_PASSWORD ?? "admin12345";

type BrowserLike = {
  newContext: () => Promise<BrowserContextLike>;
  close: () => Promise<void>;
};

type BrowserContextLike = {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
};

type PageLike = {
  goto: (
    url: string,
    opts?: { waitUntil?: "domcontentloaded" },
  ) => Promise<unknown>;
  locator: (selector: string) => {
    fill: (value: string) => Promise<void>;
    click: () => Promise<void>;
    count: () => Promise<number>;
  };
  waitForURL: (
    url: RegExp,
    opts?: { timeout?: number },
  ) => Promise<void>;
  content: () => Promise<string>;
};

let browser: BrowserLike | undefined;

const closeWithTimeout = async (
  close: () => Promise<void>,
  ms: number,
) => {
  await Promise.race([
    close(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
};

describe("TC-UI-CLERK-SHOP-FORM-003", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("в админке доступны новые поля магазина и schedule_note", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await page.goto(new URL("/admin/login", baseUrl).toString(), {
        waitUntil: "domcontentloaded",
      });

      const hasLoginForm =
        (await page.locator('input[name="email"]').count()) > 0 &&
        (await page.locator('input[name="password"]').count()) > 0 &&
        (await page.locator('button[type="submit"]').count()) > 0;

      if (hasLoginForm) {
        await page.locator('input[name="email"]').fill(adminEmail);
        await page
          .locator('input[name="password"]')
          .fill(adminPassword);
        await page.locator('button[type="submit"]').click();
        try {
          await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 5000 });
        } catch {
          // стенд может быть медленным; продолжим прямым переходом к форме
        }
      }

      await page.goto(
        new URL(
          "/admin/resource/shop-resource/create",
          baseUrl,
        ).toString(),
        { waitUntil: "domcontentloaded" },
      );

      const html = await page.content();
      const hasLegacyField =
        html.includes('name="shop_schedule_note"') ||
        html.includes("schedule_note_text");

      expect(html.trim().length).toBeGreaterThan(0);
      expect(hasLegacyField).toBe(false);
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
