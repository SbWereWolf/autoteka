import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-010", () => {
  it("OPTIONS /api/v1/city-list не приводит к 5xx", async () => {
    const response = await fetch(toUrl("/api/v1/city-list"), {
      method: "OPTIONS",
    });

    expect(response.status).toBeLessThan(500);
  });

  it("HEAD /api/v1/feature-list не приводит к 5xx", async () => {
    const response = await fetch(toUrl("/api/v1/feature-list"), {
      method: "HEAD",
    });

    expect(response.status).toBeLessThan(500);
  });
});
