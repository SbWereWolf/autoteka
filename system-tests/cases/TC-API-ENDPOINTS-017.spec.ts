import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-017", () => {
  it("list/show endpoints устойчивы к encoded path и query", async () => {
    const paths = [
      "/api/v1/city/%2e%2e%2fadmin",
      "/api/v1/shop/%2f%2f%2f",
      "/api/v1/category-list?search=%2525252525&sort=%2Dname",
      "/api/v1/feature-list?per_page=0&page=-1",
    ];

    for (const path of paths) {
      const response = await fetch(toUrl(path));
      expect(response.status).toBeLessThan(500);
    }
  });

  it("POST acceptable-contact-types с очень длинной строкой не приводит к 5xx", async () => {
    const longName = "x".repeat(8192);
    const response = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: longName }),
      },
    );

    expect(response.status).toBeLessThan(500);
  });
});
