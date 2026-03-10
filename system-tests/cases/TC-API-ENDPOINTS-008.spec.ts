import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

const fetchJson = async (path: string, init?: RequestInit) => {
  const response = await fetch(toUrl(path), init);
  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON, got ${contentType}, status=${response.status}`,
    );
  }
  return JSON.parse(bodyText) as unknown;
};

describe("TC-API-ENDPOINTS-008", () => {
  it("shop.categoryIds и shop.featureIds ссылаются на существующие справочники", async () => {
    const [cities, categories, features] = await Promise.all([
      fetchJson("/api/v1/city-list"),
      fetchJson("/api/v1/category-list"),
      fetchJson("/api/v1/feature-list"),
    ]);

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
      categoryIds?: number[];
      featureIds?: number[];
    };

    const categoryIdSet = new Set(
      Array.isArray(categories)
        ? categories
            .map((item) => (item as { id?: number }).id)
            .filter((id): id is number => typeof id === "number")
        : [],
    );

    const featureIdSet = new Set(
      Array.isArray(features)
        ? features
            .map((item) => (item as { id?: number }).id)
            .filter((id): id is number => typeof id === "number")
        : [],
    );

    if (Array.isArray(shop.categoryIds)) {
      for (const id of shop.categoryIds) {
        expect(
          categoryIdSet.has(id),
          `category id=${id} exists`,
        ).toBe(true);
      }
    }

    if (Array.isArray(shop.featureIds)) {
      for (const id of shop.featureIds) {
        expect(featureIdSet.has(id), `feature id=${id} exists`).toBe(
          true,
        );
      }
    }
  });

  it("city/{code}.items[].code открываются через /shop/{code} без 5xx", async () => {
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

    const sampleCodes = cityCatalog.items
      .map((item) => item.code)
      .filter((code): code is string => typeof code === "string")
      .slice(0, 5);

    for (const code of sampleCodes) {
      const response = await fetch(toUrl(`/api/v1/shop/${code}`));
      expect(response.status, `shop=${code}`).toBeLessThan(500);
    }
  });
});
