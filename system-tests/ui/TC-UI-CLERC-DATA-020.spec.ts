import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-DATA-020", () => {
  it("admin страницы устойчивы к query/pagination #20", async () => {
    const urls = [
      "/admin/resource/shop-resource/index-page?page=20&per_page=40&search=test20",
      "/admin/resource/shop-resource/index-page?search=%2520%25%5F",
      "/admin/resource/shop-resource/create-page?from=e2e20",
    ];

    for (const url of urls) {
      const res = await fetch(toUrl(url));
      const html = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
