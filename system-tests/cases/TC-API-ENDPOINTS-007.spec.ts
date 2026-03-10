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

const resolveFirstShopCode = async (): Promise<string | null> => {
  const { payload: cities } = await fetchJson("/api/v1/city-list");
  if (!Array.isArray(cities) || cities.length === 0) return null;

  const cityCode = (cities[0] as { code?: string }).code;
  if (!cityCode) return null;

  const { payload: cityPayload } = await fetchJson(
    `/api/v1/city/${cityCode}`,
  );
  if (
    !cityPayload ||
    !Array.isArray(cityPayload.items) ||
    cityPayload.items.length === 0
  ) {
    return null;
  }

  return (cityPayload.items[0] as { code?: string }).code ?? null;
};

describe("TC-API-ENDPOINTS-007", () => {
  it("POST acceptable-contact-types с object payload возвращает пустой object", async () => {
    const shopCode = await resolveFirstShopCode();
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
    expect(payload).toEqual({});
  });

  it("POST acceptable-contact-types с JSON-string body не вызывает 5xx", async () => {
    const shopCode = await resolveFirstShopCode();
    if (!shopCode) return;

    const response = await fetch(
      toUrl(`/api/v1/shop/${shopCode}/acceptable-contact-types`),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify("phone"),
      },
    );

    expect(response.status).toBeLessThan(500);
  });

  it("POST acceptable-contact-types с text/plain body не вызывает 5xx", async () => {
    const shopCode = await resolveFirstShopCode();
    if (!shopCode) return;

    const response = await fetch(
      toUrl(`/api/v1/shop/${shopCode}/acceptable-contact-types`),
      {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "phone,email",
      },
    );

    expect(response.status).toBeLessThan(500);
  });
});
