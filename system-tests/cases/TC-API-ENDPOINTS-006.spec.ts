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
  const payload = contentType.includes("application/json")
    ? JSON.parse(bodyText)
    : bodyText;
  return { response, payload };
};

describe("TC-API-ENDPOINTS-006", () => {
  it("POST acceptable-contact-types: object payload не ломает API и возвращает JSON object", async () => {
    const { payload: cities } = await fetchJson("/api/v1/city-list");
    if (!Array.isArray(cities) || cities.length === 0) return;

    const cityCode = (cities[0] as { code?: string }).code;
    if (!cityCode) return;

    const { payload: cityPayload } = await fetchJson(
      `/api/v1/city/${cityCode}`,
    );
    if (
      !cityPayload ||
      !Array.isArray(cityPayload.items) ||
      cityPayload.items.length === 0
    ) {
      return;
    }

    const shopCode = (cityPayload.items[0] as { code?: string }).code;
    if (!shopCode) return;

    const { response, payload } = await fetchJson(
      `/api/v1/shop/${shopCode}/acceptable-contact-types`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: true, email: true }),
      },
    );

    expect(response.status).toBe(200);
    expect(typeof payload).toBe("object");
    expect(Array.isArray(payload)).toBe(false);
  });

  it("POST acceptable-contact-types: string-array фильтрует невалидные значения", async () => {
    const { payload: cities } = await fetchJson("/api/v1/city-list");
    if (!Array.isArray(cities) || cities.length === 0) return;

    const cityCode = (cities[0] as { code?: string }).code;
    if (!cityCode) return;

    const { payload: cityPayload } = await fetchJson(
      `/api/v1/city/${cityCode}`,
    );
    if (
      !cityPayload ||
      !Array.isArray(cityPayload.items) ||
      cityPayload.items.length === 0
    ) {
      return;
    }

    const shopCode = (cityPayload.items[0] as { code?: string }).code;
    if (!shopCode) return;

    const { response, payload } = await fetchJson(
      `/api/v1/shop/${shopCode}/acceptable-contact-types`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([
          "",
          "   ",
          "unknown_type",
          "phone",
          "email",
        ]),
      },
    );

    expect(response.status).toBe(200);
    expect(typeof payload).toBe("object");

    if (payload && typeof payload === "object") {
      const keys = Object.keys(payload as Record<string, unknown>);
      expect(keys.includes("unknown_type")).toBe(false);
      expect(keys.includes("")).toBe(false);
    }
  });
});
