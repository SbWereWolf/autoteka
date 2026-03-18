import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-QUERY-014", () => {
  it("admin pages с repeated query params не отдают 5xx", async () => {
    const urls = [
      "/admin/login?redirect=%2Fadmin&redirect=%2Fadmin%2Fresource%2Fshop-resource%2Findex-page",
      "/admin/resource/shop-resource/index-page?page=1&page=2&per_page=10&per_page=500",
      "/admin/resource/shop-resource/create-page?from=test&from=qa",
      "/admin/resource/shop-resource/edit-page?resourceItem=1&resourceItem=2",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
