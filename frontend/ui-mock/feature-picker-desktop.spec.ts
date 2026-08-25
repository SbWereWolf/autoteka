import { expect, test, type Page } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Ось фишек на десктопе (@1280): секция «Акции» в постоянном левом сайдбаре.
// Дефолт-город barnaul: магазины barnaul-01/02/03,
// featureIds 01=[] / 02=["2" Акции] / 03=["1" доставка]. Reorder, не фильтр.

const TITLES = {
  delivery: "Самая быстрая доставка",
  promo: "Акции",
} as const;

// Секция фишек отделена от категорий по заголовку «Акции» (обе .catalog-menu-chip).
function featureSection(page: Page) {
  return page.locator("section.catalog-menu-group").filter({
    has: page.getByRole("heading", { name: "Акции", exact: true }),
  });
}

test.describe("FEAT-D: десктоп-сайдбар — секция фишек @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
  });

  test("FEAT-D1: секция «Акции» видна, 3 чипа фишек", async ({ page }) => {
    await expect(
      page.locator(".catalog-menu-panel--sidebar"),
    ).toBeVisible();

    const featSection = featureSection(page);
    await expect(featSection).toBeVisible();
    await expect(featSection.locator(".catalog-menu-chip")).toHaveCount(3);
  });

  test("FEAT-D2: тап фишки — pressed без закрытия + reorder", async ({
    page,
  }) => {
    const sidebar = page.locator(".catalog-menu-panel--sidebar");
    const akciiChip = featureSection(page).getByRole("button", {
      name: TITLES.promo,
      exact: true,
    });
    await akciiChip.click();

    // сайдбар постоянный — не закрывается.
    await expect(sidebar).toBeVisible();
    await expect(akciiChip).toHaveAttribute("aria-pressed", "true");

    const tiles = page.locator("a.catalog-shop-tile");
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toHaveAttribute("href", "/shop/barnaul-02");
    await expect(tiles.nth(1)).toHaveAttribute("href", "/shop/barnaul-01");
    await expect(tiles.nth(2)).toHaveAttribute("href", "/shop/barnaul-03");
  });

  test("FEAT-D3: single-select в сайдбаре — новая снимает предыдущую", async ({
    page,
  }) => {
    const featSection = featureSection(page);
    await featSection
      .getByRole("button", { name: TITLES.promo, exact: true })
      .click();
    await featSection
      .getByRole("button", { name: TITLES.delivery, exact: true })
      .click();

    await expect(
      featSection.getByRole("button", { name: TITLES.delivery, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      featSection.getByRole("button", { name: TITLES.promo, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");

    const tiles = page.locator("a.catalog-shop-tile");
    await expect(tiles.nth(0)).toHaveAttribute("href", "/shop/barnaul-03");
    await expect(tiles.nth(1)).toHaveAttribute("href", "/shop/barnaul-01");
    await expect(tiles.nth(2)).toHaveAttribute("href", "/shop/barnaul-02");
  });
});
