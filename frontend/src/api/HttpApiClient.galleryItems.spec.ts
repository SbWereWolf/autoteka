import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpApiClient } from "./HttpApiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HttpApiClient galleryItems contract", () => {
  it("normalizes mixed galleryItems for GET /shop/{code}", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          code: "barnaul-01",
          cityId: 1,
          title: "CarsHelps",
          slogan: "Запчасти рядом, когда они нужны",
          description: "27 лет помогаем автовладельцам находить нужные запчасти.",
          scheduleNote: "",
          siteUrl: "carshelps.ru",
          latitude: null,
          longitude: null,
          thumbUrl: null,
          galleryItems: [
            {
              id: 101,
              type: "image",
              src: "/media/gallery-image.webp",
              sort: 10,
            },
            {
              id: 102,
              type: "video",
              src: "/media/gallery-video.mp4",
              poster: "/media/gallery-video-poster.webp",
              mime: "video/mp4",
              sort: 10,
            },
          ],
          categoryIds: [],
          featureIds: [],
        }),
      } as Response);

    const client = new HttpApiClient("https://example.test/api/v1");
    const shop = (await client.getShop("barnaul-01")) as any;

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/v1/shop/barnaul-01",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
        }),
      }),
    );
    expect(shop.galleryItems).toEqual([
      {
        id: "101",
        type: "image",
        src: "https://example.test/media/gallery-image.webp",
        sort: 10,
      },
      {
        id: "102",
        type: "video",
        src: "https://example.test/media/gallery-video.mp4",
        poster: "https://example.test/media/gallery-video-poster.webp",
        mime: "video/mp4",
        sort: 10,
      },
    ]);
  });

  it("normalizes mixed galleryItems for GET /shop/{code}/promotion", async () => {
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
                id: 201,
                type: "image",
                src: "/media/promo-image.webp",
                sort: 1,
              },
              {
                id: 202,
                type: "video",
                src: "/media/promo-video.mp4",
                poster: "/media/promo-video-poster.webp",
                mime: "video/mp4",
                sort: 2,
              },
            ],
          },
        ],
      } as Response);

    const client = new HttpApiClient("https://example.test/api/v1");
    const promotions = await client.getShopPromotions("barnaul-01");
    const promotion = promotions[0] as any;

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/v1/shop/barnaul-01/promotion",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
        }),
      }),
    );
    expect(promotion.galleryItems).toEqual([
      {
        id: "201",
        type: "image",
        src: "https://example.test/media/promo-image.webp",
        sort: 1,
      },
      {
        id: "202",
        type: "video",
        src: "https://example.test/media/promo-video.mp4",
        poster: "https://example.test/media/promo-video-poster.webp",
        mime: "video/mp4",
        sort: 2,
      },
    ]);
  });
});
