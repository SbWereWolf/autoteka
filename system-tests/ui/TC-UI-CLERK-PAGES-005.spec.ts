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
  ) => Promise<{ status: () => number } | null>;
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

const pages = [
  "/admin/resource/city-resource",
  "/admin/resource/city-resource/create",
  "/admin/resource/category-resource",
  "/admin/resource/category-resource/create",
  "/admin/resource/feature-resource",
  "/admin/resource/feature-resource/create",
  "/admin/resource/contact-type-resource",
  "/admin/resource/contact-type-resource/create",
  "/admin/resource/shop-resource",
  "/admin/resource/shop-resource/create",
] as const;

describe("TC-UI-CLERK-PAGES-005", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("index/create страницы админ-ресурсов отвечают без 5xx", async () => {
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
          // fallback на прямые переходы
        }
      }

      for (const path of pages) {
        const response = await page.goto(
          new URL(path, baseUrl).toString(),
          {
            waitUntil: "domcontentloaded",
          },
        );
        if (response) {
          expect(response.status(), `path=${path}`).toBeLessThan(500);
        }
        const html = await page.content();
        expect(html.trim().length, `path=${path}`).toBeGreaterThan(0);
      }
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
