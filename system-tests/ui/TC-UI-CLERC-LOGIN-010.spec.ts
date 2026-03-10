import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-LOGIN-010", () => {
  it("/admin/login с query/callback параметрами не отдает 5xx", async () => {
    const urls = [
      "/admin/login",
      "/admin/login?redirect=%2Fadmin",
      "/admin/login?redirect=%2Fadmin%2Fresource%2Fshop-resource%2Findex-page",
      "/admin/login?next=javascript%3Aalert(1)",
      "/admin/login?redirect=%2Fadmin%2F__missing__",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
