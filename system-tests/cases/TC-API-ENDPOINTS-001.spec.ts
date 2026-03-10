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

const fetchJsonWithRetry = async (path: string, retries = 4) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(toUrl(path));
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

describe("TC-API-ENDPOINTS-001", () => {
  it("GET /api/v1/city-list отвечает 200 и JSON-массивом", async () => {
    const { response, payload } = await fetchJsonWithRetry(
      "/api/v1/city-list",
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
  });

  it("GET /api/v1/category-list отвечает 200 и JSON-массивом", async () => {
    const { response, payload } = await fetchJsonWithRetry(
      "/api/v1/category-list",
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
  });

  it("GET /api/v1/feature-list отвечает 200 и JSON-массивом", async () => {
    const { response, payload } = await fetchJsonWithRetry(
      "/api/v1/feature-list",
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
  });

  it("GET /api/v1/city/__not_existing__ отдаёт 404", async () => {
    const response = await fetch(
      toUrl("/api/v1/city/__not_existing__"),
    );
    expect(response.status).toBe(404);
  });

  it("GET /api/v1/shop/__not_existing__ отдаёт 404", async () => {
    const response = await fetch(
      toUrl("/api/v1/shop/__not_existing__"),
    );
    expect(response.status).toBe(404);
  });

  it("POST /api/v1/shop/__not_existing__/acceptable-contact-types отдаёт 404", async () => {
    const response = await fetch(
      toUrl("/api/v1/shop/__not_existing__/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(["phone", "", "unknown"]),
      },
    );
    expect(response.status).toBe(404);
  });
});
