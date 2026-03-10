import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-016", () => {
  it("API endpoints с граничными заголовками не приводят к 5xx", async () => {
    const scenarios = [
      {
        path: "/api/v1/city-list",
        headers: { Accept: "*/*", "Accept-Language": "ru,en;q=0.1" },
      },
      {
        path: "/api/v1/feature-list?q=%F0%9F%98%80",
        headers: {
          Accept: "application/json, text/plain;q=0.5",
          "X-Forwarded-Proto": "https",
        },
      },
      {
        path: "/api/v1/shop/__not_existing__",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    ];

    for (const scenario of scenarios) {
      const response = await fetch(toUrl(scenario.path), {
        headers: scenario.headers,
      });
      expect(response.status).toBeLessThan(500);
    }
  });

  it("POST acceptable-contact-types с пустым body не приводит к 5xx", async () => {
    const response = await fetch(
      toUrl("/api/v1/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      },
    );

    expect(response.status).toBeLessThan(500);
  });
});
