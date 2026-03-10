import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-013", () => {
  it("OPTIONS/HEAD на show и post-only endpoints не приводят к 5xx", async () => {
    const targets = [
      "/api/v1/city/__not_existing__",
      "/api/v1/shop/__not_existing__",
      "/api/v1/shop/__not_existing__/acceptable-contact-types",
    ];

    for (const target of targets) {
      for (const method of ["OPTIONS", "HEAD"] as const) {
        const response = await fetch(toUrl(target), { method });
        expect(response.status).toBeLessThan(500);
      }
    }
  });

  it("POST acceptable-contact-types с null/object/array payload не приводит к 5xx", async () => {
    const payloads: unknown[] = [
      null,
      {},
      [],
      [null, "", "phone", 42],
    ];

    for (const payload of payloads) {
      const response = await fetch(
        toUrl(
          "/api/v1/shop/__not_existing__/acceptable-contact-types",
        ),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      expect(response.status).toBeLessThan(500);
    }
  });
});
