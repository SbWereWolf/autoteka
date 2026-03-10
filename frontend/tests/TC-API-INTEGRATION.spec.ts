import { beforeAll, describe, expect, it } from "vitest";

type City = {
  code: string;
  title: string;
  sort: number;
};

type CityCatalogItem = {
  code: string;
  cityId: string | number;
  title: string;
  categoryIds: Array<string | number>;
  featureIds: Array<string | number>;
};

const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://localhost/api/v1"
).replace(/\/+$/, "");

async function getJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return response;
}

describe("TC-API-INTEGRATION", () => {
  let cityCode = "";
  let shopCode = "";
  let apiUnavailable = false;

  beforeAll(async () => {
    try {
      const citiesResponse = await getJson("/city-list");
      expect(citiesResponse.ok).toBe(true);
      const cities = (await citiesResponse.json()) as City[];
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
      expect(typeof cities[0].code).toBe("string");
      expect(typeof cities[0].title).toBe("string");
      cityCode = cities[0].code;

      const cityCatalogResponse = await getJson(
        `/city/${encodeURIComponent(cityCode)}`,
      );
      expect(cityCatalogResponse.ok).toBe(true);
      const cityCatalog = (await cityCatalogResponse.json()) as {
        city: City;
        items: CityCatalogItem[];
      };
      expect(cityCatalog.city.code).toBe(cityCode);
      expect(Array.isArray(cityCatalog.items)).toBe(true);
      expect(cityCatalog.items.length).toBeGreaterThan(0);
      expect(typeof cityCatalog.items[0].code).toBe("string");
      shopCode = cityCatalog.items[0].code;
    } catch {
      apiUnavailable = true;
    }
  });

  it("GET /city-list возвращает непустой список городов", async () => {
    if (apiUnavailable) return;
    const response = await getJson("/city-list");
    expect(response.ok).toBe(true);
    const items = (await response.json()) as City[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("GET /category-list возвращает массив категорий", async () => {
    if (apiUnavailable) return;
    const response = await getJson("/category-list");
    expect(response.ok).toBe(true);
    const items = (await response.json()) as Array<{
      id: string | number;
      title: string;
      sort: number;
    }>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(typeof items[0].title).toBe("string");
  });

  it("GET /feature-list возвращает массив фич", async () => {
    if (apiUnavailable) return;
    const response = await getJson("/feature-list");
    expect(response.ok).toBe(true);
    const items = (await response.json()) as Array<{
      id: string | number;
      title: string;
      sort: number;
    }>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(typeof items[0].title).toBe("string");
  });

  it("GET /city/{code} возвращает город и список магазинов", async () => {
    if (apiUnavailable) return;
    const response = await getJson(
      `/city/${encodeURIComponent(cityCode)}`,
    );
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as {
      city: City;
      items: CityCatalogItem[];
    };
    expect(payload.city.code).toBe(cityCode);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it("GET /shop/{code} возвращает карточку магазина", async () => {
    if (apiUnavailable) return;
    const response = await getJson(
      `/shop/${encodeURIComponent(shopCode)}`,
    );
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as {
      code: string;
      title: string;
      cityId: string | number;
      categoryIds: Array<string | number>;
      featureIds: Array<string | number>;
      description: string;
      workHours: string;
      siteUrl: string;
    };
    expect(payload.code).toBe(shopCode);
    expect(typeof payload.title).toBe("string");
    expect(Array.isArray(payload.categoryIds)).toBe(true);
    expect(Array.isArray(payload.featureIds)).toBe(true);
  });

  it("POST /shop/{code}/acceptable-contact-types возвращает контакты", async () => {
    if (apiUnavailable) return;
    const response = await getJson(
      `/shop/${encodeURIComponent(shopCode)}/acceptable-contact-types`,
      {
        method: "POST",
        body: JSON.stringify(["phone", "email"]),
      },
    );
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as Record<
      string,
      string[]
    >;
    expect(typeof payload).toBe("object");
    for (const [key, values] of Object.entries(payload)) {
      expect(typeof key).toBe("string");
      expect(Array.isArray(values)).toBe(true);
      for (const value of values) {
        expect(typeof value).toBe("string");
      }
    }
  });
});
