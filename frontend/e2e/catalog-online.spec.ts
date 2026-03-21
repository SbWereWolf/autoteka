import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  try {
    const response = await request.get("/");
    test.skip(!response.ok(), "Online contour is unavailable");
  } catch {
    test.skip(true, "Online contour is unavailable");
  }
});

test("online e2e: каталог показывает новый top bar и открывает магазин", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-hamburger-line")).toHaveCount(4);
  await expect(page.getByRole("img", { name: "TOauto.ru" })).toBeVisible();

  const firstTile = page.locator(".catalog-shop-tile").first();
  await expect(firstTile).toBeVisible();
  await firstTile.click();

  await expect(page.locator(".shop-back-button")).toBeVisible();
  await expect(page.locator(".shop-back-icon")).toBeVisible();
  await expect(page.locator(".shop-back-button")).toHaveText("");
  await expect(page.getByTestId("shop-contacts")).toBeVisible();
  await expect(page.getByText("Контакты:")).toBeVisible();
});

test("online e2e: неизвестный магазин отдаёт 404-экран", async ({
  page,
}) => {
  await page.goto("/shop/nonexistent");
  await expect(
    page.getByRole("heading", { name: "Магазин не найден" }),
  ).toBeVisible();
});
