import { expect, test, type Locator, type Page } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

const VIEWPORTS: Array<{
  name: string;
  viewport: { width: number; height: number };
}> = [
  { name: "390", viewport: { width: 390, height: 844 } },
  { name: "1280", viewport: { width: 1280, height: 800 } },
];

async function expectHeightReserved(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThan(0);
}

async function openMediatestCatalog(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "autoteka_city",
      JSON.stringify("mediatest"),
    );
  });
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

// 1. Тайл каталога с пришедшим-но-404 thumbUrl → плейсхолдер «Нет логотипа»,
//    высота контейнера зарезервирована. На 390 и на десктопе.
for (const { name, viewport } of VIEWPORTS) {
  test.describe(`MEDIA-DEGRADE: 404-миниатюра тайла @${name}`, () => {
    test.use({ viewport });

    test(`тайл с 404-thumbUrl показывает «Нет логотипа» @${name}`, async ({
      page,
    }) => {
      await openMediatestCatalog(page);

      const tile = page.locator(".catalog-shop-tile");
      await expect(tile).toHaveCount(1);
      await expect(tile.getByText("Нет логотипа")).toBeVisible();
      await expectHeightReserved(tile);
    });
  });
}

// 1b. Тайл каталога БЕЗ thumbUrl (поле отсутствует) → v-else ветка ShopTile:
//     <span class="catalog-shop-tile-placeholder">Нет логотипа</span>.
//     barnaul-02 в фикстуре не имеет thumbUrl.
test.describe("MEDIA-DEGRADE: отсутствующий thumbUrl тайла @390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("тайл без thumbUrl рендерит плейсхолдер «Нет логотипа» (v-else)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "autoteka_city",
        JSON.stringify("barnaul"),
      );
    });
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const tile = page.locator(
      'a.catalog-shop-tile[href$="/shop/barnaul-02"]',
    );
    await expect(tile).toHaveCount(1);

    const placeholder = tile.locator(".catalog-shop-tile-placeholder");
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toHaveText("Нет логотипа");
  });
});

// 2. 404-картинка hero-галереи ShopPage → плейсхолдер «Нет изображения»,
//    высота зарезервирована. Только 390×844 (мобильный hero; логотип на
//    мобиле больше не рендерится — деградацию ловим на медиа hero-галереи).
test.describe("MEDIA-DEGRADE: 404-медиа hero-галереи @390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("404-картинка hero-галереи показывает «Нет изображения»", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/shop/mediatest-404", {
      waitUntil: "domcontentloaded",
    });

    const gallery = page.getByTestId("shop-gallery");
    await expect(gallery).toBeVisible();
    await expect(
      gallery.getByText("Нет изображения").first(),
    ).toBeVisible();
    await expectHeightReserved(gallery);
  });
});

// 3. Магазин с пустым galleryItems → текст-плейсхолдер галереи,
//    высота контейнера зарезервирована. На 390 и на десктопе.
for (const { name, viewport } of VIEWPORTS) {
  test.describe(`MEDIA-DEGRADE: пустая галерея @${name}`, () => {
    test.use({ viewport });

    test(`пустой galleryItems показывает текст-плейсхолдер @${name}`, async ({
      page,
    }) => {
      await installApiMocks(page);
      await page.goto("/shop/mediatest-empty", {
        waitUntil: "domcontentloaded",
      });

      const gallery = page.getByTestId("shop-gallery");
      await expect(gallery).toBeVisible();
      await expect(
        gallery.getByText(
          "Для этого магазина изображения ещё не загружены",
        ),
      ).toBeVisible();
      await expectHeightReserved(gallery);
    });
  });
}
