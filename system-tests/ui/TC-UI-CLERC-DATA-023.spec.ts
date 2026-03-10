import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-DATA-023", () => {
  it("admin страницы устойчивы к query/pagination #23", async () => {
    const urls = [
      "/admin/resource/shop-resource/index-page?page=23&per_page=46&search=test23",
      "/admin/resource/shop-resource/index-page?search=%2523%25%5F",
      "/admin/resource/shop-resource/create-page?from=e2e23",
    ];

    for (const url of urls) {
      const res = await fetch(toUrl(url));
      const html = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
