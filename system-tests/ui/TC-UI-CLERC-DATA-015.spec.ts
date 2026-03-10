import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-DATA-015", () => {
  it("admin pages с нестандартными query значениями не отдают 5xx", async () => {
    const urls = [
      "/admin/resource/shop-resource/index-page?search=%22%3E%3Cscript%3E1%3C%2Fscript%3E",
      "/admin/resource/shop-resource/index-page?search=%00%01%02",
      "/admin/resource/shop-resource/create-page?seed=1&seed=%F0%9F%98%80",
      "/admin/resource/shop-resource/edit-page?resourceItem=__not_existing__&tab=contacts",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
