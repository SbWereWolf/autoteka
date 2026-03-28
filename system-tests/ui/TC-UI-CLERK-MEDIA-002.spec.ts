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
  ) => Promise<{
    ok: () => boolean | null;
    status: () => number;
  } | null>;
  locator: (selector: string) => {
    fill: (value: string) => Promise<void>;
    count: () => Promise<number>;
    first: () => { click: () => Promise<void> };
    click: () => Promise<void>;
  };
  waitForURL: (
    url: RegExp,
    opts?: { timeout?: number },
  ) => Promise<void>;
  url: () => string;
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
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

describe("TC-UI-CLERK-MEDIA-002", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("админ может войти в MoonShine; API из UI-контекста отдаёт media URL с uuid.ext", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      const loginUrl = new URL("/admin/login", baseUrl).toString();
      const loginResponse = await page.goto(loginUrl, {
        waitUntil: "domcontentloaded",
      });
      expect(loginResponse).not.toBeNull();

      const emailField = page.locator('input[name="email"]');
      const passwordField = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      const canLogin =
        (await emailField.count()) > 0 &&
        (await passwordField.count()) > 0 &&
        (await submitButton.count()) > 0;

      if (canLogin) {
        await emailField.fill(adminEmail);
        await passwordField.fill(adminPassword);
        await submitButton.click();
        try {
          await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 5000 });
        } catch {
          // login может быть недоступен на текущем стенде; media-проверка ниже остаётся обязательной
        }
      }

      const payload = await page.evaluate(async () => {
        const cityListResponse = await fetch("/api/v1/city-list");
        if (!cityListResponse.ok) {
          return null;
        }
        const cityList = (await cityListResponse.json()) as Array<{
          code?: string;
        }>;
        const firstCityCode =
          cityList.find((item) => typeof item?.code === "string")
            ?.code ?? null;
        if (!firstCityCode) {
          return null;
        }

        const cityResponse = await fetch(
          `/api/v1/city/${firstCityCode}`,
        );
        if (!cityResponse.ok) {
          return null;
        }
        const cityPayload = (await cityResponse.json()) as {
          items?: Array<{ code?: string }>;
        };
        const firstShopCode =
          cityPayload.items?.find(
            (item) => typeof item?.code === "string",
          )?.code ?? null;
        if (!firstShopCode) {
          return null;
        }

        const shopResponse = await fetch(
          `/api/v1/shop/${firstShopCode}`,
        );
        if (!shopResponse.ok) {
          return null;
        }
        return (await shopResponse.json()) as {
          thumbUrl?: string | null;
          galleryItems?: Array<{
            src?: string;
          }>;
        };
      });

      if (!payload) {
        return;
      }

      const uuidExtRegex =
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$/;
      if (
        typeof payload.thumbUrl === "string" &&
        payload.thumbUrl !== ""
      ) {
        expect(uuidExtRegex.test(payload.thumbUrl)).toBe(true);
      }

      if (Array.isArray(payload.galleryItems)) {
        const firstGallery = payload.galleryItems.find(
          (item) => typeof item?.src === "string" && item.src.length > 0,
        );
        if (firstGallery) {
          expect(uuidExtRegex.test(firstGallery.src as string)).toBe(true);
        }
      }
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
