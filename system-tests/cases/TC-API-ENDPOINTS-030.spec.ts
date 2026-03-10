import { describe, expect, it } from "vitest";
const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();
describe("TC-API-ENDPOINTS-030", () => {
  it("endpoints устойчивы к mixed query набору #30", async () => {
    const paths = [
      "/api/v1/city-list?page=30&per_page=90&q=test30",
      "/api/v1/category-list?page=29&per_page=150&sort=-id",
      "/api/v1/feature-list?q=%2530%25&lang=ru",
      "/api/v1/shop/__not_existing__=city&expand=category",
    ];
    for (const path of paths) {
      const res = await fetch(toUrl(path));
      expect(res.status).toBeLessThan(500);
    }
  });
  it("acceptable-contact-types устойчив к payload #30", async () => {
    const res = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: ["phone", "email", "x30", "x31"],
        }),
      },
    );
    expect(res.status).toBeLessThan(500);
  });
});
