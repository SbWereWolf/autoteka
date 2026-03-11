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

const resourceIndexPaths = [
  "/admin/resource/city-resource",
  "/admin/resource/category-resource",
  "/admin/resource/feature-resource",
  "/admin/resource/contact-type-resource",
  "/admin/resource/shop-resource",
] as const;

const firstEditPathFromHtml = (html: string): string | null => {
  const patterns = [
    /href="(\/admin\/resource\/[^"\s]+\/\d+\/edit)"/i,
    /href='(\/admin\/resource\/[^'\s]+\/\d+\/edit)'/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && typeof match[1] === "string") {
      return match[1];
    }
  }
  return null;
};

describe("TC-UI-CLERC-EDIT-PAGES-007", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("first edit page для каждого admin resource отвечает без 5xx", async () => {
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

      for (const indexPath of resourceIndexPaths) {
        const indexResponse = await page.goto(
          new URL(indexPath, baseUrl).toString(),
          { waitUntil: "domcontentloaded" },
        );
        if (indexResponse) {
          expect(
            indexResponse.status(),
            `index=${indexPath}`,
          ).toBeLessThan(500);
        }

        const indexHtml = await page.content();
        expect(
          indexHtml.trim().length,
          `index=${indexPath}`,
        ).toBeGreaterThan(0);

        const editPath = firstEditPathFromHtml(indexHtml);
        if (!editPath) {
          continue;
        }

        const editResponse = await page.goto(
          new URL(editPath, baseUrl).toString(),
          {
            waitUntil: "domcontentloaded",
          },
        );
        if (editResponse) {
          expect(
            editResponse.status(),
            `edit=${editPath}`,
          ).toBeLessThan(500);
        }

        const editHtml = await page.content();
        expect(
          editHtml.trim().length,
          `edit=${editPath}`,
        ).toBeGreaterThan(0);
      }
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
