import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-NAV-011", () => {
  it("admin index/create/edit маршруты с query/hash не отдают 5xx", async () => {
    const urls = [
      "/admin/resource/city-resource/index-page?sort=id#top",
      "/admin/resource/category-resource/index-page?page=1&per_page=50",
      "/admin/resource/feature-resource/create-page?from=test",
      "/admin/resource/contact-type-resource/create-page?back=%2Fadmin",
      "/admin/resource/shop-resource/index-page?search=test",
      "/admin/resource/shop-resource/edit-page?resourceItem=1",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
