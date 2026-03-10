import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-API-ENDPOINTS-014", () => {
  it("unknown api routes возвращают <500", async () => {
    const paths = [
      "/api/v1/__missing__",
      "/api/v1/city/__missing__/extra",
      "/api/v1/shop/__missing__/unexpected",
      "/api/v1/shop/__missing__/acceptable-contact-types/extra",
    ];

    for (const path of paths) {
      const response = await fetch(toUrl(path));
      expect(response.status).toBeLessThan(500);
    }
  });

  it("content-types кроме json на acceptable-contact-types не приводят к 5xx", async () => {
    const payloads = [
      { contentType: "text/plain", body: "phone,email" },
      {
        contentType: "application/x-www-form-urlencoded",
        body: "types[]=phone&types[]=email",
      },
      {
        contentType: "multipart/form-data; boundary=----codex",
        body: '------codex\r\nContent-Disposition: form-data; name="types[]"\r\n\r\nphone\r\n------codex--\r\n',
      },
    ];

    for (const payload of payloads) {
      const response = await fetch(
        toUrl(
          "/api/v1/shop/__not_existing__/acceptable-contact-types",
        ),
        {
          method: "POST",
          headers: { "content-type": payload.contentType },
          body: payload.body,
        },
      );
      expect(response.status).toBeLessThan(500);
    }
  });
});
