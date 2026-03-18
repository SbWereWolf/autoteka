import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-METHODS-013", () => {
  it("нестандартные HTTP-методы к admin страницам не приводят к 5xx", async () => {
    const targets = [
      "/admin/login",
      "/admin/resource/shop-resource/index-page",
      "/admin/resource/shop-resource/create-page",
    ];

    const methods = ["OPTIONS", "HEAD", "DELETE"] as const;

    for (const target of targets) {
      for (const method of methods) {
        const response = await fetch(toUrl(target), { method });
        expect(response.status).toBeLessThan(500);
      }
    }
  });
});
