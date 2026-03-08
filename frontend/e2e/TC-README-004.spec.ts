/**
 * TC-README-004 (часть 3): online e2e на реальном backend.
 * Проверяем, что запросы к API не ломаются и каталог загружается.
 * Документ: README.md
 */
import { expect, test } from "@playwright/test";

test("TC-README-004: запросы к /api/v1 не ломаются, каталог загружается", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Каталог магазинов")).toBeVisible();
  const citySelect = page.getByRole("combobox").first();
  await expect(citySelect).toBeVisible();
  await expect(citySelect).not.toHaveValue("");
  await expect(page.locator("button.ui-tile").first()).toBeVisible();
  await expect(page.getByText(/\d+ шт\./)).toBeVisible();
});
