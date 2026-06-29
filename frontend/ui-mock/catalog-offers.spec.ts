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
