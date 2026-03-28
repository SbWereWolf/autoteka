import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpApiClient } from "./HttpApiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HttpApiClient promo contract", () => {
  it("loads GET /shop/{code}/promotion and keeps galleryItems in the payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [
          {
            id: "promo-1",
            code: "barnaul-01-summer-sale",
            title: "Летняя распродажа",
            description: "Скидки на расходники и аккумуляторы до конца месяца.",
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            galleryItems: [
              {
                id: "promo-1-image-1",
                type: "image",
                src: "https://cdn.example.test/promo-summer-1.webp",
                sort: 1,
              },
            ],
          },
        ],
      } as Response);

    const client = new HttpApiClient("https://example.test/api/v1");

    const promotions = await (client as any).getShopPromotions(
      "barnaul-01",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/v1/shop/barnaul-01/promotion",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
        }),
      }),
    );
    expect(promotions).toHaveLength(1);
    expect(promotions[0]).toMatchObject({
      code: "barnaul-01-summer-sale",
      description: "Скидки на расходники и аккумуляторы до конца месяца.",
      endDate: "2026-03-31",
      galleryItems: [
        {
          id: "promo-1-image-1",
          type: "image",
          src: "https://cdn.example.test/promo-summer-1.webp",
          sort: 1,
        },
      ],
      id: "promo-1",
      startDate: "2026-03-01",
      title: "Летняя распродажа",
    });
  });

  it("returns an empty array for a shop with no active promotions", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [],
      } as Response);

    const client = new HttpApiClient("https://example.test/api/v1");

    const promotions = await (client as any).getShopPromotions(
      "nizhny-01",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(promotions).toEqual([]);
  });
});
