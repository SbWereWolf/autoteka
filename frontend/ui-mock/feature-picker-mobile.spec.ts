import { expect, test, type Page } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Ось фишек на мобайле (@390 из конфига): пикер в шите «Акции».
// Дефолт-город barnaul (localStorage чист): магазины barnaul-01/02/03,
// featureIds 01=[] / 02=["2" Акции] / 03=["1" доставка]. Reorder, не фильтр.

const TITLES = {
  delivery: "Самая быстрая доставка",
  promo: "Акции",
  open247: "Круглосуточно",
} as const;

async function openSheet(page: Page) {
  await page.locator("[data-offers-trigger]").click();
  await expect(page.getByRole("dialog", { name: "Акции" })).toBeVisible();
}

function readFeature(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem("autoteka_feature"));
}

test.describe("FEAT-M: мобайл-шит — пикер фишек @390", () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
  });

  test("FEAT-M1: шит показывает 3 чипа фишек с титулами", async ({
    page,
  }) => {
    await openSheet(page);
    const dialog = page.getByRole("dialog", { name: "Акции" });
    await expect(dialog.locator(".catalog-menu-chip")).toHaveCount(3);
    await expect(
      dialog.getByRole("button", { name: TITLES.delivery, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: TITLES.promo, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: TITLES.open247, exact: true }),
    ).toBeVisible();
  });

  test("FEAT-M2: выбор фишки — pressed, шит закрылся, localStorage", async ({
    page,
  }) => {
    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();

    await expect(page.getByRole("dialog", { name: "Акции" })).toHaveCount(0);
    expect(await readFeature(page)).toBe('"2"');

    await openSheet(page);
    const dialog = page.getByRole("dialog", { name: "Акции" });
    await expect(
      dialog.getByRole("button", { name: TITLES.promo, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      dialog.getByRole("button", { name: TITLES.delivery, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByRole("button", { name: TITLES.open247, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("FEAT-M3: single-select — новая фишка снимает предыдущую", async ({
    page,
  }) => {
    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();

    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.delivery, exact: true })
      .click();

    await openSheet(page);
    const dialog = page.getByRole("dialog", { name: "Акции" });
    await expect(
      dialog.getByRole("button", { name: TITLES.delivery, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      dialog.getByRole("button", { name: TITLES.promo, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(await readFeature(page)).toBe('"1"');
  });

  test("FEAT-M4: повторный тап снимает фишку (toggle → null)", async ({
    page,
  }) => {
    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();
    expect(await readFeature(page)).toBe('"2"');

    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();
    expect(await readFeature(page)).toBe("null");

    await openSheet(page);
    const dialog = page.getByRole("dialog", { name: "Акции" });
    await expect(
      dialog.getByRole("button", { name: TITLES.delivery, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByRole("button", { name: TITLES.promo, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByRole("button", { name: TITLES.open247, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("FEAT-M5: выбор фишки переупорядочивает плитки (reorder, не фильтр)", async ({
    page,
  }) => {
    const tiles = page.locator("a.catalog-shop-tile");
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toHaveAttribute("href", "/shop/barnaul-01");
    await expect(tiles.nth(1)).toHaveAttribute("href", "/shop/barnaul-02");
    await expect(tiles.nth(2)).toHaveAttribute("href", "/shop/barnaul-03");

    await openSheet(page);
    await page
      .getByRole("dialog", { name: "Акции" })
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();

    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toHaveAttribute("href", "/shop/barnaul-02");
    await expect(tiles.nth(1)).toHaveAttribute("href", "/shop/barnaul-01");
    await expect(tiles.nth(2)).toHaveAttribute("href", "/shop/barnaul-03");
  });
});

test.describe("FEAT-G: гард — секция фишек только на десктопе @390", () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
  });

  test("FEAT-G1: в мобайл-дровере секции «Акции» нет, «Категории» есть", async ({
    page,
  }) => {
    await page.locator("[data-menu-button]").click();
    const drawer = page.getByRole("dialog", { name: "Фильтры" });
    await expect(drawer).toBeVisible();

    // sanity: дровер открыт и работает — секция категорий на месте.
    await expect(
      drawer.getByRole("heading", { name: "Категории" }),
    ).toBeVisible();
    // фишки на мобайле только в шите, не в дровере.
    await expect(
      drawer.getByRole("heading", { name: "Акции", exact: true }),
    ).toHaveCount(0);
  });
});
