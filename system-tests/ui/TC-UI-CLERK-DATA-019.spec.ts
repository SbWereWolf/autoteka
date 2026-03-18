import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-DATA-019", () => {
  it("admin страницы устойчивы к page/per_page и символам поиска", async () => {
    const urls = [
      "/admin/resource/shop-resource/index-page?page=0&per_page=0",
      "/admin/resource/shop-resource/index-page?page=999&per_page=9999",
      "/admin/resource/shop-resource/index-page?search=%25%5F%2B%3F%2A",
      "/admin/resource/shop-resource/create-page?prefillCode=%252F%252E%252E",
    ];

    for (const url of urls) {
      const res = await fetch(toUrl(url));
      const html = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
