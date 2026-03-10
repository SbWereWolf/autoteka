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

const adminPages = [
  "/admin/resource/moonshine-user-resource",
  "/admin/resource/moonshine-user-resource/create",
  "/admin/resource/role-resource",
  "/admin/resource/role-resource/create",
  "/admin/resource/permission-resource",
  "/admin/resource/permission-resource/create",
] as const;

describe("TC-UI-ADMIN-USERS-001", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("страницы управления пользователями и ролями отвечают без 5xx", async () => {
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
          await page.waitForURL(/\/admin(\/.*)?$/, {
            timeout: 5000,
          });
        } catch {
          // fallback на прямые переходы
        }
      }

      for (const path of adminPages) {
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
  }, 60_000);
});
