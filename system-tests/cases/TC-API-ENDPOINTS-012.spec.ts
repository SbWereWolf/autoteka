import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-012", () => {
  it("POST acceptable-contact-types с большим payload не приводит к 5xx", async () => {
    const values = Array.from({ length: 200 }, (_, i) =>
      i % 4 === 0
        ? "phone"
        : i % 4 === 1
          ? "email"
          : i % 4 === 2
            ? "whatsapp"
            : `invalid-${i}`,
    );

    const response = await fetch(
      toUrl("/api/v1/shop/__not_existing__/acceptable-contact-types"),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    expect(response.status).toBeLessThan(500);
  });

  it("методы PUT/PATCH/DELETE на list endpoints не приводят к 5xx", async () => {
    const methods = ["PUT", "PATCH", "DELETE"] as const;
    const paths = [
      "/api/v1/city-list",
      "/api/v1/category-list",
      "/api/v1/feature-list",
    ];

    for (const method of methods) {
      for (const path of paths) {
        const response = await fetch(toUrl(path), { method });
        expect(response.status).toBeLessThan(500);
      }
    }
  });
});
