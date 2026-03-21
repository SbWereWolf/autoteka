/**
 * TC-README-004 (часть 3): online e2e на реальном backend.
 * Проверяем, что запросы к API не ломаются и каталог загружается.
 * Документ: README.md
 */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  try {
    const response = await request.get("/");
    test.skip(!response.ok(), "Online contour is unavailable");
  } catch {
    test.skip(true, "Online contour is unavailable");
  }
});

test("TC-README-004: каталог нового дизайна загружается на живом контуре", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("catalog-feature-select"),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "TOauto.ru" })).toBeVisible();
  await expect(page.locator(".catalog-shop-tile").first()).toBeVisible();
});
