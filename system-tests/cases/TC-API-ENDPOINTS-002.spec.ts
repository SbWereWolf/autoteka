import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but got content-type="${contentType}" status=${response.status} body=${text.slice(0, 120)}`,
    );
  }
  return JSON.parse(text) as unknown;
};

const fetchJson = async (path: string, init?: RequestInit) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(toUrl(path), init);
    if (response.status >= 500) {
      lastError = new Error(`HTTP ${response.status}`);
      await new Promise((resolve) => setTimeout(resolve, 150));
      continue;
    }
    const payload = await parseJsonResponse(response);
    return { response, payload };
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

describe("TC-API-ENDPOINTS-002", () => {
  it("GET /api/v1/city/{code} для существующего города возвращает city+items", async () => {
    const { response: cityListResponse, payload: cityList } =
      await fetchJson("/api/v1/city-list");
    expect(cityListResponse.status).toBe(200);
    expect(Array.isArray(cityList)).toBe(true);

    if (!Array.isArray(cityList) || cityList.length === 0) {
      return;
    }

    const firstCity = cityList[0] as { code?: string };
    expect(typeof firstCity.code).toBe("string");

    const { response, payload } = await fetchJson(
      `/api/v1/city/${firstCity.code}`,
    );
    expect(response.status).toBe(200);
    expect(payload).toHaveProperty("city");
    expect(payload).toHaveProperty("items");
    expect(Array.isArray(payload.items)).toBe(true);
  });

  it("GET /api/v1/shop/{code} для существующего магазина возвращает ожидаемые поля", async () => {
    const { payload: cityList } = await fetchJson(
      "/api/v1/city-list",
    );
    if (!Array.isArray(cityList) || cityList.length === 0) {
      return;
    }

    const firstCity = cityList[0] as { code?: string };
    if (
      typeof firstCity.code !== "string" ||
      firstCity.code.length === 0
    ) {
      return;
    }

    const { response: cityResponse, payload: cityCatalog } =
      await fetchJson(`/api/v1/city/${firstCity.code}`);
    expect(cityResponse.status).toBe(200);

    if (
      !cityCatalog ||
      !Array.isArray(cityCatalog.items) ||
      cityCatalog.items.length === 0
    ) {
      return;
    }

    const firstShop = cityCatalog.items[0] as { code?: string };
    expect(typeof firstShop.code).toBe("string");

    const { response, payload } = await fetchJson(
      `/api/v1/shop/${firstShop.code}`,
    );
    expect(response.status).toBe(200);
    expect(typeof payload.code).toBe("string");
    expect(typeof payload.title).toBe("string");
    expect(Array.isArray(payload.categoryIds)).toBe(true);
    expect(Array.isArray(payload.featureIds)).toBe(true);
    expect(Array.isArray(payload.galleryImages)).toBe(true);
    expect(typeof payload.workHours).toBe("string");
  });

  it("POST acceptable-contact-types: пустой/невалидный payload не ломает API", async () => {
    const { payload: cityList } = await fetchJson(
      "/api/v1/city-list",
    );
    if (!Array.isArray(cityList) || cityList.length === 0) {
      return;
    }

    const firstCity = cityList[0] as { code?: string };
    if (
      typeof firstCity.code !== "string" ||
      firstCity.code.length === 0
    ) {
      return;
    }

    const { payload: cityCatalog } = await fetchJson(
      `/api/v1/city/${firstCity.code}`,
    );
    if (
      !cityCatalog ||
      !Array.isArray(cityCatalog.items) ||
      cityCatalog.items.length === 0
    ) {
      return;
    }

    const firstShop = cityCatalog.items[0] as { code?: string };
    if (
      typeof firstShop.code !== "string" ||
      firstShop.code.length === 0
    ) {
      return;
    }

    const emptyResponse = await fetch(
      toUrl(
        `/api/v1/shop/${firstShop.code}/acceptable-contact-types`,
      ),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([]),
      },
    );
    expect(emptyResponse.status).toBe(200);
    const emptyPayload = await emptyResponse.json();
    expect(typeof emptyPayload).toBe("object");

    const mixedResponse = await fetch(
      toUrl(
        `/api/v1/shop/${firstShop.code}/acceptable-contact-types`,
      ),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([
          "phone",
          "",
          "   ",
          123,
          null,
          "unknown",
        ]),
      },
    );
    expect(mixedResponse.status).toBe(200);
    const mixedPayload = await mixedResponse.json();
    expect(typeof mixedPayload).toBe("object");
  });

  it("POST acceptable-contact-types с object-body обрабатывается корректно", async () => {
    const { payload: cityList } = await fetchJson(
      "/api/v1/city-list",
    );
    if (!Array.isArray(cityList) || cityList.length === 0) {
      return;
    }
    const firstCity = cityList[0] as { code?: string };
    if (
      typeof firstCity.code !== "string" ||
      firstCity.code.length === 0
    ) {
      return;
    }

    const { payload: cityCatalog } = await fetchJson(
      `/api/v1/city/${firstCity.code}`,
    );
    if (
      !cityCatalog ||
      !Array.isArray(cityCatalog.items) ||
      cityCatalog.items.length === 0
    ) {
      return;
    }
    const firstShop = cityCatalog.items[0] as { code?: string };
    if (
      typeof firstShop.code !== "string" ||
      firstShop.code.length === 0
    ) {
      return;
    }

    const response = await fetch(
      toUrl(
        `/api/v1/shop/${firstShop.code}/acceptable-contact-types`,
      ),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: true, email: true }),
      },
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(typeof payload).toBe("object");
  });
});
