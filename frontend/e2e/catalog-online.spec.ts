import { expect, test } from "@playwright/test";

test("online e2e: карточка магазина открывается из каталога", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Каталог магазинов")).toBeVisible();

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
  await expect(page.getByText("Магазин не найден.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }),
  ).toBeVisible();
});
