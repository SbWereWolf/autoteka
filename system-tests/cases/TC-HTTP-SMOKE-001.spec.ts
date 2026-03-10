import { describe, expect, it } from "vitest";

const profile = process.env.TEST_PROFILE ?? "quick-local";
const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

describe("TC-HTTP-SMOKE-001", () => {
  it("BASE_URL отвечает HTTP-статусом < 500", async () => {
    const response = await fetch(baseUrl, { redirect: "manual" });
    expect(response.status).toBeGreaterThanOrEqual(100);
    expect(response.status).toBeLessThan(500);
  });

  it(`для профиля ${profile} задан TEST_STACK`, async () => {
    expect(process.env.TEST_STACK).toBeTruthy();
  });
});
