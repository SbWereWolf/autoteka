import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const toUrl = (path: string) => new URL(path, baseUrl).toString();

describe("TC-UI-CLERK-ERRORS-009", () => {
  it("несуществующий admin route не отдает 5xx", async () => {
    const response = await fetch(
      toUrl("/admin/__not-existing-resource__"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.length).toBeGreaterThan(0);
  });
});
