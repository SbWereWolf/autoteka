import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("UI-MOCK-01: старт приложения и дефолты", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");
  const citySelect = page.getByRole("combobox").first();
  await expect(citySelect).toHaveValue("barnaul");
  await expect(page.getByText("Каталог магазинов")).toBeVisible();
  await expect(page.getByText("2 шт.")).toBeVisible();
});

test("UI-MOCK-02: смена города обновляет каталог", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/");
  const citySelect = page.getByRole("combobox").first();
  await citySelect.selectOption("nizhny");
  await expect(page.getByText("3 шт.")).toBeVisible();
});

test("UI-MOCK-03: карточка магазина показывает категории/фичи и контакты", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/");
  await page.locator("button.ui-tile").first().click();

  await expect(
    page.getByRole("heading", { name: "Описание" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Контакты" }),
  ).toBeVisible();
  await expect(
    page.locator(".shop-meta-badge").first(),
  ).toBeVisible();
});

test("UI-MOCK-04: 404 магазин", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/shop/nonexistent");
  await expect(page.getByText("Магазин не найден.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }),
  ).toBeVisible();
});
