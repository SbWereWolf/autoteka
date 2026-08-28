import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpApiClient } from "./HttpApiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HttpApiClient city coordinates contract", () => {
  it("normalizes coordinates in city list and city catalog responses", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [
          {
            id: 1,
            code: "barnaul",
            title: "Барнаул",
            sort: 10,
            latitude: 53.347,
            longitude: 83.778,
          },
          {
            id: 2,
            code: "unknown-coordinates",
            title: "Без координат",
            sort: 20,
            latitude: null,
            longitude: null,
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          city: {
            id: 1,
            code: "barnaul",
            title: "Барнаул",
            sort: 10,
            latitude: "53.347",
            longitude: "83.778",
          },
          items: [],
        }),
      } as Response);

    const client = new HttpApiClient("https://example.test/api/v1");

    const cities = await client.getCityList();
    const catalog = await client.getCityShops("barnaul");

    expect(cities).toEqual([
      {
        code: "barnaul",
        title: "Барнаул",
        sort: 10,
        latitude: "53.347",
        longitude: "83.778",
      },
      {
        code: "unknown-coordinates",
        title: "Без координат",
        sort: 20,
        latitude: null,
        longitude: null,
      },
    ]);
    expect(catalog.city).toEqual({
      code: "barnaul",
      title: "Барнаул",
      sort: 10,
      latitude: "53.347",
      longitude: "83.778",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
