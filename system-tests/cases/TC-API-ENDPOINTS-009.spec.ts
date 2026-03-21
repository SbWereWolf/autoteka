import { describe, expect, it } from "vitest";
import { getFirstShopCode } from "../ui/uiUserHelpers";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;

const toUrl = (path: string) => new URL(path, baseUrl).toString();

const fetchJson = async (path: string) => {
  const response = await fetch(toUrl(path));
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON: status=${response.status} ct=${contentType}`,
    );
  }
  return JSON.parse(text) as unknown;
};

describe("TC-API-ENDPOINTS-009", () => {
  it("shop payload содержит новый контракт со scheduleNote", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const shop = (await fetchJson(
      `/api/v1/shop/${shopCode}`,
    )) as Record<string, unknown>;

    expect(typeof shop.id).toBe("number");
    expect(typeof shop.code).toBe("string");
    expect(typeof shop.title).toBe("string");
    expect(typeof shop.slogan).toBe("string");
    expect(typeof shop.description).toBe("string");
    expect(typeof shop.scheduleNote).toBe("string");
    expect(typeof shop.siteUrl).toBe("string");
    expect("latitude" in shop).toBe(true);
    expect("longitude" in shop).toBe(true);
    expect(Array.isArray(shop.categoryIds)).toBe(true);
    expect(Array.isArray(shop.featureIds)).toBe(true);
    expect(Array.isArray(shop.galleryImages)).toBe(true);
  });

  it("galleryImages и thumbUrl, если есть, представлены URL-строками", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const shop = (await fetchJson(`/api/v1/shop/${shopCode}`)) as {
      thumbUrl?: string | null;
      galleryImages?: unknown;
    };

    if (typeof shop.thumbUrl === "string") {
      expect(shop.thumbUrl.length).toBeGreaterThan(0);
    }

    if (Array.isArray(shop.galleryImages)) {
      for (const image of shop.galleryImages) {
        expect(typeof image).toBe("string");
        expect((image as string).length).toBeGreaterThan(0);
      }
    }
  });
});
