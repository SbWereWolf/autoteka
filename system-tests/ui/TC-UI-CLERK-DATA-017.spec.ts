import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-DATA-017", () => {
  it("admin list/create страницы устойчивы к шумным заголовкам", async () => {
    const targets = [
      "/admin/resource/shop-resource/index-page?search=test",
      "/admin/resource/shop-resource/create-page?source=e2e",
    ];

    for (const t of targets) {
      const res = await fetch(toUrl(t), {
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.3",
        },
      });
      const html = await res.text();
      expect(res.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
