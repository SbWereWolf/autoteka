export const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
export const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
export const toUrl = (path: string) =>
  new URL(path, baseUrl).toString();

export const headed = process.env.TEST_UI_HEADED === "1";

export type ShopPayload = {
  code?: string;
  title?: string;
  slogan?: string;
  description?: string;
  scheduleNote?: string;
  siteUrl?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  thumbUrl?: string | null;
  galleryImages?: unknown;
  categoryIds?: unknown;
  featureIds?: unknown;
};

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
  try {
    await page.goBack({ waitUntil: "domcontentloaded" });
  } catch {
    // Firefox may abort the document load on history navigation even when
    // the URL changes correctly; the follow-up wait below is the real proof.
  }
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

export async function getFirstShopPayload(): Promise<ShopPayload | null> {
  const shopCode = await getFirstShopCode();
  if (!shopCode) return null;

  return getShopPayloadByCode(shopCode);
}

export async function getFirstShopWithScheduleNotePayload(): Promise<{
  code: string;
  payload: ShopPayload;
} | null> {
  const cityResponse = await fetch(toUrl("/api/v1/city-list"));
  if (cityResponse.status >= 500) return null;

  const cities = (await cityResponse.json()) as Array<{
    code?: string;
  }>;

  for (const city of cities) {
    if (typeof city.code !== "string" || city.code.length === 0) {
      continue;
    }

    const cityResponse = await fetch(
      toUrl(`/api/v1/city/${encodeURIComponent(city.code)}`),
    );
    if (cityResponse.status >= 500) continue;

    const cityPayload = (await cityResponse.json()) as {
      items?: Array<{ code?: string }>;
    };

    for (const item of cityPayload.items ?? []) {
      if (typeof item.code !== "string" || item.code.length === 0) {
        continue;
      }

      const payload = await getShopPayloadByCode(item.code);
      const note = String(payload?.scheduleNote ?? "").trim();
      if (payload && note.length > 0) {
        return {
          code: item.code,
          payload,
        };
      }
    }
  }

  return null;
}

export async function waitForCatalogShell(
  page: PageLike,
  timeout = 60_000,
): Promise<void> {
  await page.waitForFunction(
    () =>
      document.querySelector("#app") !== null &&
      document.querySelector('[data-testid="catalog-grid-shell"]') !== null,
    { timeout },
  );
}

export async function waitForBaseUrlReady(
  timeoutMs = 60_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "no-response";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
      });
      if (response.status < 500) {
        return;
      }
      lastStatus = `http-${response.status}`;
    } catch (error) {
      lastStatus = error instanceof Error
        ? error.message
        : "network-error";
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Base URL did not become ready within ${timeoutMs}ms: ${lastStatus}`,
  );
}

export async function waitForShopShell(
  page: PageLike,
  timeout = 60_000,
): Promise<void> {
  await page.waitForFunction(
    () =>
      document.querySelector("#app") !== null &&
      document.querySelector('[data-testid="shop-text-section"]') !== null,
    { timeout },
  );
}

export async function getShopPayloadByCode(
  shopCode: string,
): Promise<ShopPayload | null> {
  const response = await fetch(
    toUrl(`/api/v1/shop/${encodeURIComponent(shopCode)}`),
  );
  if (response.status >= 500) return null;

  return (await response.json()) as ShopPayload;
}
