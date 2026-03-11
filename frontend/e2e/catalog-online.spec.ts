import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  try {
    const response = await request.get("/");
    test.skip(!response.ok(), "Online contour is unavailable");
  } catch {
    test.skip(true, "Online contour is unavailable");
  }
});

test("online e2e: карточка магазина открывается из каталога", async ({
  page,
}) => {
  await page.goto("/");

  const firstTile = page.locator("button.ui-tile").first();
  await expect(firstTile).toBeVisible();
  await firstTile.click();

  await expect(page.getByText("Описание")).toBeVisible();
  await expect(page.getByText("Контакты")).toBeVisible();
});

test("online e2e: страница неизвестного магазина отдаёт 404-экран", async ({
  page,
}) => {
  await page.goto("/shop/nonexistent");
  await expect(
    page.getByRole("heading", { name: "Магазин не найден" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }).first(),
  ).toBeVisible();
});
