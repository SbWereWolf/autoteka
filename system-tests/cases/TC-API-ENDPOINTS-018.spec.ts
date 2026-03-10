import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-018", () => {
  it("API list endpoints устойчивы к нестандартным Accept/charset", async () => {
    const scenarios = [
      {
        path: "/api/v1/city-list",
        headers: { Accept: "application/xml" },
      },
      {
        path: "/api/v1/category-list?per_page=5000",
        headers: { Accept: "application/json; charset=utf-8" },
      },
      {
        path: "/api/v1/feature-list?q=%D1%82%D0%B5%D1%81%D1%82",
        headers: { "Accept-Charset": "utf-8,windows-1251;q=0.7" },
      },
    ];

    for (const s of scenarios) {
      const res = await fetch(toUrl(s.path), { headers: s.headers });
      expect(res.status).toBeLessThan(500);
    }
  });

  it("API show endpoints устойчивы к path traversal-like input", async () => {
    const paths = [
      "/api/v1/city/..%2F..%2Fadmin",
      "/api/v1/shop/%2e%2e%2f%2e%2e%2f",
    ];

    for (const p of paths) {
      const res = await fetch(toUrl(p));
      expect(res.status).toBeLessThan(500);
    }
  });
});
