import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-005", () => {
  it("GET на POST-only /acceptable-contact-types возвращает 405", async () => {
    const response = await fetch(
      toUrl("/api/v1/shop/__not_existing__/acceptable-contact-types"),
      { method: "GET" },
    );
    expect(response.status).toBe(405);
  });

  it("POST на list-эндпоинты возвращает 405", async () => {
    const endpoints = [
      "/api/v1/city-list",
      "/api/v1/category-list",
      "/api/v1/feature-list",
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(toUrl(endpoint), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status, `endpoint=${endpoint}`).toBe(405);
    }
  });

  it("GET /city/{code} и /shop/{code} с несуществующим code возвращают 404", async () => {
    const missingCodes = [
      "__not_existing__",
      "missing-code-123",
      "NO_SUCH_CODE",
    ];

    for (const code of missingCodes) {
      const cityResponse = await fetch(toUrl(`/api/v1/city/${code}`));
      expect(cityResponse.status, `city code=${code}`).toBe(404);

      const shopResponse = await fetch(toUrl(`/api/v1/shop/${code}`));
      expect(shopResponse.status, `shop code=${code}`).toBe(404);
    }
  });

  it("POST /acceptable-contact-types с mixed payload не даёт 5xx", async () => {
    const response = await fetch(
      toUrl("/api/v1/shop/__not_existing__/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([
          "",
          "   ",
          0,
          null,
          false,
          "unknown",
          { code: "phone" },
        ]),
      },
    );

    expect(response.status).toBe(404);
  });
});
