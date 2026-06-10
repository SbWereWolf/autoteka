import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Нижний бар «Акции» + bottom-sheet (mobile, viewport 390 из конфига).
// Канон: _prototype/screens.jsx:213-300 (OffersSheet) + shared.jsx OffersBar.

test("OFFERS-01: бар «Акции» открывает dialog", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const bar = page.getByTestId("catalog-offers-bar");
  await expect(bar).toBeVisible();
  await bar.getByRole("button", { name: "Акции" }).click();

  await expect(page.getByRole("dialog", { name: "Акции" })).toBeVisible();
});

test("OFFERS-02: строки шита берутся из промо магазинов с feature «Акции»", async ({
  page,
}) => {
  // barnaul-02 имеет feature 2 и две акции в фикстуре.
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page
    .getByTestId("catalog-offers-bar")
    .getByRole("button", { name: "Акции" })
    .click();

  const dialog = page.getByRole("dialog", { name: "Акции" });
  const rows = dialog.locator(".catalog-offer-row");
  await expect(rows).toHaveCount(2);

  const first = rows.first();
  // Двухстрочная строка: заголовок акции + имя магазина из фикстуры.
  await expect(first.locator(".catalog-offer-label")).toHaveText(
    "Весеннее ТО со скидкой",
  );
  await expect(first.locator(".catalog-offer-shop")).toHaveText(
    "Orange Parts",
  );
  await expect(first).toHaveAttribute("href", "/shop/barnaul-02");
});

test("OFFERS-03: пустое состояние — «Пока нет акций»", async ({
  page,
}) => {
  // nizhny-01 имеет feature 2, но без акций в фикстуре → шит пуст.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "autoteka_city",
      JSON.stringify("nizhny"),
    );
  });
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page
    .getByTestId("catalog-offers-bar")
    .getByRole("button", { name: "Акции" })
    .click();

  const dialog = page.getByRole("dialog", { name: "Акции" });
  await expect(dialog.getByText("Пока нет акций")).toBeVisible();
  await expect(dialog.locator(".catalog-offer-row")).toHaveCount(0);
});
