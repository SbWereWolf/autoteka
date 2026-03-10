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

const resolveFirstShopCode = async (): Promise<string | null> => {
  const { payload: cityList } = await fetchJson("/api/v1/city-list");
  if (!Array.isArray(cityList) || cityList.length === 0) {
    return null;
  }

  const firstCity = cityList[0] as { code?: string };
  if (
    typeof firstCity.code !== "string" ||
    firstCity.code.length === 0
  ) {
    return null;
  }

  const { payload: cityCatalog } = await fetchJson(
    `/api/v1/city/${firstCity.code}`,
  );
  if (
    !cityCatalog ||
    !Array.isArray(cityCatalog.items) ||
    cityCatalog.items.length === 0
  ) {
    return null;
  }

  const firstShop = cityCatalog.items[0] as { code?: string };
  if (
    typeof firstShop.code !== "string" ||
    firstShop.code.length === 0
  ) {
    return null;
  }

  return firstShop.code;
};

describe("TC-API-ENDPOINTS-003", () => {
  it("списочные эндпоинты отдают элементы с ожидаемыми полями", async () => {
    const checks = [
      {
        path: "/api/v1/city-list",
        keys: ["id", "code", "title", "sort"],
      },
      {
        path: "/api/v1/category-list",
        keys: ["id", "title", "sort"],
      },
      {
        path: "/api/v1/feature-list",
        keys: ["id", "title", "sort"],
      },
    ];

    for (const check of checks) {
      const { response, payload } = await fetchJson(check.path);
      expect(response.status).toBe(200);
      expect(Array.isArray(payload)).toBe(true);

      if (!Array.isArray(payload) || payload.length === 0) {
        continue;
      }

      const first = payload[0] as Record<string, unknown>;
      for (const key of check.keys) {
        expect(first).toHaveProperty(key);
      }
      expect(typeof first.id).toBe("number");
      expect(typeof first.title).toBe("string");
      expect(typeof first.sort).toBe("number");
    }
  });

  it("GET /api/v1/city/{code} отдаёт контракт city/items", async () => {
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

    const { response, payload } = await fetchJson(
      `/api/v1/city/${firstCity.code}`,
    );
    expect(response.status).toBe(200);
    expect(payload).toHaveProperty("city");
    expect(payload).toHaveProperty("items");
    expect(typeof payload.city.id).toBe("number");
    expect(typeof payload.city.code).toBe("string");
    expect(typeof payload.city.title).toBe("string");
    expect(Array.isArray(payload.items)).toBe(true);
  });

  it("GET на POST-only acceptable-contact-types возвращает 405", async () => {
    const shopCode = await resolveFirstShopCode();
    if (!shopCode) {
      return;
    }

    const response = await fetch(
      toUrl(`/api/v1/shop/${shopCode}/acceptable-contact-types`),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(405);
  });

  it("POST acceptable-contact-types: в ответе только запрошенные типы", async () => {
    const shopCode = await resolveFirstShopCode();
    if (!shopCode) {
      return;
    }

    const allowed = ["phone", "email", "telegram", "unknown_x"];
    const response = await fetch(
      toUrl(`/api/v1/shop/${shopCode}/acceptable-contact-types`),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(allowed),
      },
    );
    expect(response.status).toBe(200);

    const payload = (await response.json()) as Record<
      string,
      unknown
    >;
    for (const key of Object.keys(payload)) {
      expect(allowed.includes(key)).toBe(true);
      expect(Array.isArray(payload[key])).toBe(true);
      for (const item of payload[key] as unknown[]) {
        expect(typeof item).toBe("string");
      }
    }
  });
});
