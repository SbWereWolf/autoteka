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

const listPaths = [
  "/admin/resource/city-resource?page=1",
  "/admin/resource/category-resource?page=1",
  "/admin/resource/feature-resource?page=1",
  "/admin/resource/contact-type-resource?page=1",
  "/admin/resource/shop-resource?page=1",
] as const;

describe("TC-UI-CLERC-LISTS-008", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("list pages with query params отвечают без 5xx", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      for (const path of listPaths) {
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
