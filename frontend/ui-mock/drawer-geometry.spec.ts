import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Геометрия мобильного дровера фильтров под канон
// (_prototype/screens.jsx:161-199): flex-column, без border-top между
// секциями, ритм верхней группы город→категории = 14px.
test.describe("DRAWER-геометрия @390", () => {
  test("нет border-top между секциями; зазор CitySelect→«Категории» = 14px", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.locator("[data-menu-button]").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // (1) Ни одна секция дровера не имеет видимого border-top.
    const sections = dialog.locator(".catalog-menu-group");
    await expect(sections).toHaveCount(2);
    for (const section of await sections.all()) {
      const borderTopWidth = await section.evaluate(
        (el) => getComputedStyle(el).borderTopWidth,
      );
      expect(borderTopWidth).toBe("0px");
    }

    // (2) Вертикальный зазор: низ CitySelect → верх заголовка «Категории».
    const cityBox = await dialog
      .locator('[data-testid="menu-city-select"]')
      .boundingBox();
    const headingBox = await dialog
      .getByRole("heading", { name: "Категории" })
      .boundingBox();

    expect(cityBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    if (cityBox && headingBox) {
      const gap = headingBox.y - (cityBox.y + cityBox.height);
      expect(Math.abs(gap - 14)).toBeLessThanOrEqual(1);
    }
  });
});
