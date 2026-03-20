export const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
export const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
export const toUrl = (path: string) =>
  new URL(path, baseUrl).toString();

export const headed = process.env.TEST_UI_HEADED === "1";

export type BrowserLike = {
  newContext: () => Promise<BrowserContextLike>;
  close: () => Promise<void>;
};

export type BrowserContextLike = {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
};

export type LocatorLike = {
  count: () => Promise<number>;
};

export type PageLike = {
  goto: (
    url: string,
    opts: { waitUntil: "domcontentloaded" },
  ) => Promise<{
    ok: () => boolean | null;
    status: () => number;
  } | null>;
  content: () => Promise<string>;
  click: (selector: string) => Promise<void>;
  url: () => string;
  locator: (selector: string) => LocatorLike;
  evaluate: (pageFunction: () => void) => Promise<void>;
  waitForURL: (
    pattern: RegExp,
    opts?: { timeout?: number },
  ) => Promise<void>;
  waitForFunction: (
    pageFunction: () => unknown,
    opts?: { timeout?: number },
  ) => Promise<void>;
  goBack: (opts?: { waitUntil: "domcontentloaded" }) => Promise<void>;
};

export const closeWithTimeout = async (
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

export async function goBackToCatalog(page: PageLike): Promise<void> {
  await page.evaluate(() => {
    window.history.back();
  });
  await page.waitForFunction(
    () => window.location.pathname === "/",
    { timeout: 10000 },
  );
}

export async function getFirstShopCode(): Promise<string | null> {
  const cityResponse = await fetch(toUrl("/api/v1/city-list"));
  if (cityResponse.status >= 500) return null;
  const cities = (await cityResponse.json()) as Array<{
    code?: string;
  }>;
  const cityCode = cities.find(
    (c) => typeof c.code === "string",
  )?.code;
  if (!cityCode) return null;

  const shopListResponse = await fetch(
    toUrl(`/api/v1/city/${encodeURIComponent(cityCode)}`),
  );
  if (shopListResponse.status >= 500) return null;
  const cityPayload = (await shopListResponse.json()) as {
    items?: Array<{ code?: string }>;
  };
  const shopCode = cityPayload.items?.find(
    (s) => typeof s.code === "string",
  )?.code;
  return shopCode ?? null;
}
