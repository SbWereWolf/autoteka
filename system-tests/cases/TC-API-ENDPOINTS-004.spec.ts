import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

type ListItem = {
  id: number;
  sort: number;
};

const fetchJson = async (path: string, init?: RequestInit) => {
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

const expectSortedBySortThenId = (items: ListItem[]) => {
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1];
    const cur = items[i];
    const validOrder =
      prev.sort < cur.sort ||
      (prev.sort === cur.sort && prev.id <= cur.id);
    expect(validOrder).toBe(true);
  }
};

describe("TC-API-ENDPOINTS-004", () => {
  it("city/category/feature list отсортированы по sort,id", async () => {
    const endpoints = [
      "/api/v1/city-list",
      "/api/v1/category-list",
      "/api/v1/feature-list",
    ];

    for (const endpoint of endpoints) {
      const { response, payload } = await fetchJson(endpoint);
      expect(response.status).toBe(200);
      expect(Array.isArray(payload)).toBe(true);

      if (!Array.isArray(payload)) {
        continue;
      }

      const normalized: ListItem[] = payload
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            typeof item === "object" && item !== null,
        )
        .filter(
          (item) =>
            typeof item.id === "number" &&
            typeof item.sort === "number",
        )
        .map((item) => ({
          id: item.id as number,
          sort: item.sort as number,
        }));

      expect(normalized.length).toBe(payload.length);
      expectSortedBySortThenId(normalized);
    }
  });

  it("city/{code} items отсортированы по sort,id", async () => {
    const { payload: cities } = await fetchJson("/api/v1/city-list");
    if (!Array.isArray(cities) || cities.length === 0) {
      return;
    }

    const firstCity = cities[0] as { code?: string };
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
    expect(Array.isArray(payload.items)).toBe(true);

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return;
    }

    const normalized: ListItem[] = payload.items
      .filter(
        (item: unknown): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .filter(
        (item) =>
          typeof item.id === "number" &&
          typeof item.sort === "number",
      )
      .map((item) => ({
        id: item.id as number,
        sort: item.sort as number,
      }));

    expect(normalized.length).toBe(payload.items.length);
    expectSortedBySortThenId(normalized);
  });

  it("city-list не содержит дублирующихся code", async () => {
    const { response, payload } = await fetchJson(
      "/api/v1/city-list",
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);

    if (!Array.isArray(payload)) {
      return;
    }

    const codes = payload
      .map((item) =>
        typeof item?.code === "string" ? item.code : null,
      )
      .filter((code): code is string => code !== null);

    expect(codes.length).toBe(payload.length);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
