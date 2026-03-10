import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-DATA-016", () => {
  it("admin pages устойчивы к длинным и encoded query", async () => {
    const longQuery = "a".repeat(2048);
    const urls = [
      `/admin/login?next=${encodeURIComponent("/admin/resource/shop-resource/index-page")}&token=${longQuery}`,
      `/admin/resource/shop-resource/index-page?search=${encodeURIComponent("%00%0A%0D<>")}`,
      `/admin/resource/shop-resource/create-page?draft=${longQuery}`,
      "/admin/resource/shop-resource/edit-page?resourceItem=%2e%2e%2f..%2f1",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
