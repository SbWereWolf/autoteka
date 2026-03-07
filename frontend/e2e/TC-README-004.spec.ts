/**
 * TC-README-004 (часть 3): при VITE_API_BASE_URL=/api/v1 запросы к API работают.
 * Документ: README.md
 * Требует: приложение на baseURL (Docker), собранное с VITE_API_BASE_URL=/api/v1.
 */
import { expect, test } from "@playwright/test";

test("TC-README-004: запросы к /api/v1 не ломаются, каталог загружается", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Каталог магазинов")).toBeVisible();
  const citySelect = page.getByRole("combobox").first();
  await expect(citySelect).toHaveValue("barnaul");
  await expect(page.getByText(/\d+ шт\./)).toBeVisible();
});
