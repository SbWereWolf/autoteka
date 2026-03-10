import { describe, expect, it } from "vitest";
const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();
describe("TC-API-ENDPOINTS-021", () => {
  it("endpoints устойчивы к mixed query набору #21", async () => {
    const paths = [
      "/api/v1/city-list?page=21&per_page=63&q=test21",
      "/api/v1/category-list?page=20&per_page=105&sort=-id",
      "/api/v1/feature-list?q=%2521%25&lang=ru",
      "/api/v1/shop/__not_existing__=city&expand=category",
    ];
    for (const path of paths) {
      const res = await fetch(toUrl(path));
      expect(res.status).toBeLessThan(500);
    }
  });
  it("acceptable-contact-types устойчив к payload #21", async () => {
    const res = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: ["phone", "email", "x21", "x22"],
        }),
      },
    );
    expect(res.status).toBeLessThan(500);
  });
});
