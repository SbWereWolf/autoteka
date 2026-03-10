import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-015", () => {
  it("list endpoints с repeated query params не приводят к 5xx", async () => {
    const paths = [
      "/api/v1/city-list?sort=id&sort=code&sort=name",
      "/api/v1/category-list?page=1&page=2&per_page=10&per_page=999",
      "/api/v1/feature-list?q=test&q=%00&q=%22",
    ];

    for (const path of paths) {
      const response = await fetch(toUrl(path));
      expect(response.status).toBeLessThan(500);
    }
  });

  it("show endpoints с repeated query params не приводят к 5xx", async () => {
    const paths = [
      "/api/v1/city/__not_existing__?include=items&include=city",
      "/api/v1/shop/__not_existing__?expand=gallery&expand=contacts",
    ];

    for (const path of paths) {
      const response = await fetch(toUrl(path));
      expect(response.status).toBeLessThan(500);
    }
  });
});
