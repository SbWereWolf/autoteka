import { describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

const fetchWithRetry = async (path: string, retries = 4) => {
  let last: Response | null = null;
  for (let i = 0; i < retries; i += 1) {
    const response = await fetch(toUrl(path), { redirect: "follow" });
    last = response;
    if (response.status < 500) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return last;
};

describe("TC-SYSTEM-HEALTH-005", () => {
  it("/up отвечает без 5xx", async () => {
    const response = await fetchWithRetry("/up");
    expect(response).not.toBeNull();
    expect(response!.status).toBeLessThan(500);
  });

  it("/api/v1/category-list отвечает 200 и JSON", async () => {
    const response = await fetchWithRetry("/api/v1/category-list");
    expect(response).not.toBeNull();
    expect(response!.status).toBe(200);
    expect(
      (response!.headers.get("content-type") ?? "").includes(
        "application/json",
      ),
    ).toBe(true);
  });

  it("/admin/login отвечает без 5xx и отдает HTML", async () => {
    const response = await fetchWithRetry("/admin/login");
    expect(response).not.toBeNull();
    expect(response!.status).toBeLessThan(500);
    expect(
      (response!.headers.get("content-type") ?? "").includes(
        "text/html",
      ),
    ).toBe(true);
  });
});
