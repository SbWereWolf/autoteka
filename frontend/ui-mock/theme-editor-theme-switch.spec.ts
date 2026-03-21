import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("legacy theme runtime удалён из интерфейса", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");

  await expect(page.getByTestId("theme-switcher")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "CSS переменные" }),
  ).toHaveCount(0);
  await expect(page.locator("[data-testid^='css-var-input']")).toHaveCount(0);
});
