import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-DATA-018", () => {
  it("admin страницы устойчивы к query с unicode и пробелами", async () => {
    const urls = [
      "/admin/resource/shop-resource/index-page?search=%D0%A2%D0%B5%D1%81%D1%82%20shop",
      "/admin/resource/shop-resource/index-page?search=%F0%9F%9A%97%20car%20service",
      "/admin/resource/shop-resource/create-page?prefillName=%D0%9D%D0%BE%D0%B2%D1%8B%D0%B9%20%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD",
    ];

    for (const url of urls) {
      const res = await fetch(toUrl(url));
      const html = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
