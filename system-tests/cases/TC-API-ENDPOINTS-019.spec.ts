import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-019", () => {
  it("HEAD/OPTIONS на list endpoints не приводят к 5xx", async () => {
    const reqs = [
      { method: "HEAD", path: "/api/v1/city-list" },
      { method: "HEAD", path: "/api/v1/category-list" },
      { method: "OPTIONS", path: "/api/v1/feature-list" },
      { method: "OPTIONS", path: "/api/v1/shop-list" },
    ];

    for (const r of reqs) {
      const res = await fetch(toUrl(r.path), { method: r.method });
      expect(res.status).toBeLessThan(500);
    }
  });

  it("POST acceptable-contact-types устойчив к mixed unicode payload", async () => {
    const res = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: ["Телефон", "📞", "e-mail", ""],
        }),
      },
    );

    expect(res.status).toBeLessThan(500);
  });
});
