import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERC-ROBUSTNESS-012", () => {
  it("несуществующие admin resource routes не отдают 5xx", async () => {
    const urls = [
      "/admin/resource/__missing__/index-page",
      "/admin/resource/__missing__/create-page",
      "/admin/resource/shop-resource/edit-page?resourceItem=999999999",
      "/admin/resource/shop-resource/index-page?page=-1&per_page=100000",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
