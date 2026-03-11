import { afterAll, beforeAll, describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const headed = process.env.TEST_UI_HEADED === "1";

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

const protectedPages = [
  "/admin/resource/city-resource/create",
  "/admin/resource/category-resource/create",
  "/admin/resource/feature-resource/create",
  "/admin/resource/contact-type-resource/create",
  "/admin/resource/shop-resource/create",
] as const;

describe("TC-UI-CLERC-AUTH-006", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("неавторизованный доступ к admin/create не даёт 5xx и показывает login/admin shell", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();

      for (const path of protectedPages) {
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

        const hasLoginForm =
          html.includes('name="email"') &&
          html.includes('name="password"');
        const hasAdminShell =
          html.includes("/admin") || html.includes("MoonShine");

        expect(
          hasLoginForm || hasAdminShell,
          `path=${path} expected login form or admin shell`,
        ).toBe(true);
      }
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
