import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-020", () => {
  it("GET list endpoints устойчивы к экстремальным page/per_page", async () => {
    const paths = [
      "/api/v1/city-list?page=0&per_page=0",
      "/api/v1/category-list?page=999999&per_page=1",
      "/api/v1/feature-list?page=-100&per_page=100000",
      "/api/v1/shop-list?page=1&per_page=2147483647",
    ];

    for (const path of paths) {
      const res = await fetch(toUrl(path));
      expect(res.status).toBeLessThan(500);
    }
  });

  it("GET show endpoints устойчивы к urlencoded спецсимволам", async () => {
    const paths = [
      "/api/v1/city/%25%32%35",
      "/api/v1/shop/%252F%252E%252E",
      "/api/v1/city/%00",
    ];

    for (const path of paths) {
      const res = await fetch(toUrl(path));
      expect(res.status).toBeLessThan(500);
    }
  });
});
