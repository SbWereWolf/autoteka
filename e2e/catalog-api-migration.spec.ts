import { expect, test } from "@playwright/test";

test("E2E-01: старт приложения и дефолты", async ({ page }) => {
  await page.goto("/");
  const citySelect = page.getByRole("combobox").first();
  await expect(citySelect).toHaveValue("barnaul");
  await expect(page.getByText("Каталог магазинов")).toBeVisible();
  await expect(page.getByText("17 шт.")).toBeVisible();
});

test("E2E-02: смена города обновляет каталог", async ({ page }) => {
  await page.goto("/");
  const citySelect = page.getByRole("combobox").first();
  await citySelect.selectOption("nizhny");
  await expect(page.getByText("3 шт.")).toBeVisible();
});

test("E2E-03: карточка магазина показывает категории/фичи и контакты", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("button.ui-tile").first().click();

  await expect(page.getByText("Описание")).toBeVisible();
  await expect(page.getByText("Контакты")).toBeVisible();
  await expect(
    page.locator(".shop-meta-badge").first(),
  ).toBeVisible();
});

test("E2E-04: 404 магазин", async ({ page }) => {
  await page.goto("/shop/nonexistent");
  await expect(page.getByText("Магазин не найден.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }),
  ).toBeVisible();
});
