import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-011", () => {
  it("list endpoints с шумными query не приводят к 5xx", async () => {
    const paths = [
      "/api/v1/city-list?sort=%00&limit=-1&x=%E0%A4%A",
      "/api/v1/category-list?page=0&per_page=999999&q=%27%22",
      "/api/v1/feature-list?filter[foo]=bar&__proto__=x",
    ];

    for (const path of paths) {
      const response = await fetch(toUrl(path));
      expect(response.status).toBeLessThan(500);
      const contentType = response.headers.get("content-type") ?? "";
      expect(contentType.includes("application/json")).toBe(true);
    }
  });

  it("show endpoints с шумными query не приводят к 5xx", async () => {
    const cityResponse = await fetch(
      toUrl("/api/v1/city/__not_existing__?include=items&x=%00"),
    );
    expect(cityResponse.status).toBeLessThan(500);

    const shopResponse = await fetch(
      toUrl("/api/v1/shop/__not_existing__?expand=gallery&limit=-10"),
    );
    expect(shopResponse.status).toBeLessThan(500);
  });
});
