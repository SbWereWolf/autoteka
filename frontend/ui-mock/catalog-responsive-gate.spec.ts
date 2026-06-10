import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Гейт responsive-контракта каталога. Поведение НЕ меняем —
// только фиксируем текущие responsive-классы грид-контейнера
// (.catalog-grid) и max-width оболочки (.catalog-grid-shell)
// тестами. Числа выведены из src/styles/tailwind.css:
//   .catalog-grid          -> 2 кол.
//   @media (min-width:40rem) -> 3 кол.
//   @media (min-width:64rem) -> 3 кол.
//   @media (min-width:90rem) -> 4 кол.
//   .catalog-grid-shell max-width: 80rem, @64rem -> 100rem.

async function gridColumnCount(page: import("@playwright/test").Page) {
  return page.locator(".catalog-grid").evaluate((element) => {
    const cols = window
      .getComputedStyle(element as HTMLElement)
      .gridTemplateColumns.trim();
    return cols ? cols.split(/\s+/).length : 0;
  });
}

async function expectGridColumns(
  page: import("@playwright/test").Page,
  expected: number,
) {
  await expect
    .poll(() => gridColumnCount(page), { timeout: 5000 })
    .toBe(expected);
}

test("RESP-GATE-01: колонки грида 390/1280/1920", async ({ page }) => {
  await installApiMocks(page);

  const cases: Array<{ width: number; cols: number }> = [
    { width: 390, cols: 2 },
    { width: 1280, cols: 3 },
    { width: 1920, cols: 4 },
  ];

  for (const { width, cols } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
    await expectGridColumns(page, cols);
  }
});

test("RESP-GATE-02: каталог-shell ≤ 100rem @1920", async ({ page }) => {
  await installApiMocks(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toBeVisible();

  const layout = await page.evaluate(() => {
    const shell = document.querySelector(
      '[data-testid="catalog-grid-shell"]',
    ) as HTMLElement | null;
    return {
      width: shell?.getBoundingClientRect().width ?? null,
      remPx: parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      ),
    };
  });

  expect(layout.width).not.toBeNull();
  if (layout.width !== null) {
    expect(layout.width).toBeLessThanOrEqual(100 * layout.remPx + 1);
  }
});

test("RESP-GATE-03: drawer @390, sidebar @1280", async ({ page }) => {
  await installApiMocks(page);

  // Мобильный гейт (390): bottom-sheet сортировки + drawer
  // фильтров; постоянный sidebar отсутствует.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toBeVisible();

  await expect(page.getByTestId("catalog-offers-bar")).toBeVisible();
  await expect(
    page.locator(".catalog-menu-panel--sidebar"),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await expect(
    page.getByRole("dialog", { name: "Фильтры" }),
  ).toBeVisible();

  // Десктопный аналог (1280): постоянный sidebar; bottom-sheet
  // сортировки отсутствует.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toBeVisible();

  await expect(
    page.locator(".catalog-menu-panel--sidebar"),
  ).toBeVisible();
  await expect(page.getByTestId("catalog-offers-bar")).toHaveCount(0);
});
