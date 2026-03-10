import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

const fetchJson = async (path: string) => {
  const response = await fetch(toUrl(path));
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON: status=${response.status} ct=${contentType}`,
    );
  }
  return JSON.parse(text) as unknown;
};

describe("TC-API-ENDPOINTS-009", () => {
  it("shop payload содержит базовый контракт типов", async () => {
    const cities = await fetchJson("/api/v1/city-list");
    if (!Array.isArray(cities) || cities.length === 0) return;

    const cityCode = (cities[0] as { code?: string }).code;
    if (!cityCode) return;

    const cityCatalog = (await fetchJson(
      `/api/v1/city/${cityCode}`,
    )) as {
      items?: Array<{ code?: string }>;
    };
    if (
      !Array.isArray(cityCatalog.items) ||
      cityCatalog.items.length === 0
    )
      return;

    const shopCode = (cityCatalog.items[0] as { code?: string }).code;
    if (!shopCode) return;

    const shop = (await fetchJson(
      `/api/v1/shop/${shopCode}`,
    )) as Record<string, unknown>;

    expect(typeof shop.id).toBe("number");
    expect(typeof shop.code).toBe("string");
    expect(typeof shop.title).toBe("string");
    expect(typeof shop.sort).toBe("number");
    expect(typeof shop.cityId).toBe("number");
    expect(typeof shop.workHours).toBe("string");
    expect(Array.isArray(shop.categoryIds)).toBe(true);
    expect(Array.isArray(shop.featureIds)).toBe(true);
    expect(Array.isArray(shop.galleryImages)).toBe(true);
  });

  it("galleryImages и thumbUrl, если есть, представлены URL-строками", async () => {
    const cities = await fetchJson("/api/v1/city-list");
    if (!Array.isArray(cities) || cities.length === 0) return;

    const cityCode = (cities[0] as { code?: string }).code;
    if (!cityCode) return;

    const cityCatalog = (await fetchJson(
      `/api/v1/city/${cityCode}`,
    )) as {
      items?: Array<{ code?: string }>;
    };
    if (
      !Array.isArray(cityCatalog.items) ||
      cityCatalog.items.length === 0
    )
      return;

    const shopCode = (cityCatalog.items[0] as { code?: string }).code;
    if (!shopCode) return;

    const shop = (await fetchJson(`/api/v1/shop/${shopCode}`)) as {
      thumbUrl?: string | null;
      galleryImages?: unknown;
    };

    if (typeof shop.thumbUrl === "string") {
      expect(shop.thumbUrl.length).toBeGreaterThan(0);
    }

    if (Array.isArray(shop.galleryImages)) {
      for (const image of shop.galleryImages) {
        expect(typeof image).toBe("string");
        expect((image as string).length).toBeGreaterThan(0);
      }
    }
  });
});
