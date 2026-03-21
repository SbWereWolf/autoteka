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

type LocatorLike = {
  count: () => Promise<number>;
};

type PageLike = {
  goto: (
    url: string,
    opts: { waitUntil: "domcontentloaded" },
  ) => Promise<{
    ok: () => boolean | null;
    status: () => number;
  } | null>;
  locator: (selector: string) => LocatorLike;
  waitForFunction: (
    pageFunction: () => unknown,
    opts?: { timeout?: number },
  ) => Promise<void>;
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

describe("TC-UI-SMOKE-001", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("страница BASE_URL открывается и отдаёт непустой HTML", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      const response = await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      expect(response).not.toBeNull();
      expect(response!.ok() ?? response!.status() < 400).toBe(true);
      await page.waitForFunction(
        () => document.querySelector("#app") !== null,
        { timeout: 10000 },
      );
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  }, 90_000);
});
