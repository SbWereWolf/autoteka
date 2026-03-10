import { describe, expect, it } from "vitest";
const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();
describe("TC-API-ENDPOINTS-025", () => {
  it("endpoints устойчивы к mixed query набору #25", async () => {
    const paths = [
      "/api/v1/city-list?page=25&per_page=75&q=test25",
      "/api/v1/category-list?page=24&per_page=125&sort=-id",
      "/api/v1/feature-list?q=%2525%25&lang=ru",
      "/api/v1/shop/__not_existing__=city&expand=category",
    ];
    for (const path of paths) {
      const res = await fetch(toUrl(path));
      expect(res.status).toBeLessThan(500);
    }
  });
  it("acceptable-contact-types устойчив к payload #25", async () => {
    const res = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: ["phone", "email", "x25", "x26"],
        }),
      },
    );
    expect(res.status).toBeLessThan(500);
  });
});
