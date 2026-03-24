import { describe, expect, it } from "vitest";
import {
  buildYandexMapsWebUrl,
  buildYandexNavigatorMapSearchUrl,
} from "./yandexAddressOpen";

describe("yandexAddressOpen", () => {
  it("строит диплинк map_search с кодированием текста", () => {
    expect(
      buildYandexNavigatorMapSearchUrl("Москва, Тверская 1"),
    ).toBe(
      "yandexnavi://map_search?text=" +
        encodeURIComponent("Москва, Тверская 1"),
    );
  });

  it("строит веб-ссылку Яндекс.Карт с кодированием текста", () => {
    expect(buildYandexMapsWebUrl("Барнаул, ул. Попова, 70")).toBe(
      "https://yandex.ru/maps/?text=" +
        encodeURIComponent("Барнаул, ул. Попова, 70"),
    );
  });

  it("обрезает пробелы по краям перед кодированием", () => {
    const inner = "  Адрес  ";
    expect(buildYandexNavigatorMapSearchUrl(inner)).toBe(
      `yandexnavi://map_search?text=${encodeURIComponent("Адрес")}`,
    );
    expect(buildYandexMapsWebUrl(inner)).toBe(
      `https://yandex.ru/maps/?text=${encodeURIComponent("Адрес")}`,
    );
  });
});
