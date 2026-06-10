import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// CHROME-канон: отклик интерактива (hover без роста / press вжимается),
// тёмный оверлей бургер-меню, стабильная высота тулбара каталога.

test("CHROME-SCALE-TOKENS: scale-токены = спека отклика (hover 1, press 0.97/0.92)", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      weak: cs.getPropertyValue("--transform-scale-weak").trim(),
      regular: cs.getPropertyValue("--transform-scale-regular").trim(),
      strong: cs.getPropertyValue("--transform-scale-strong").trim(),
    };
  });
  // hover не растит, press 0.97, press мелких таргетов 0.92.
  expect(tokens.weak).toBe("1");
  expect(tokens.regular).toBe("0.97");
  expect(tokens.strong).toBe("0.92");
});

test("CHROME-MENU-OVERLAY: оверлей бургер-меню тёмный rgba(15,15,16,.25) @390", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Открыть фильтры" }).click();

  const overlay = page.getByRole("button", { name: "Закрыть меню" });
  await expect(overlay).toBeVisible();
  const bg = await overlay.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(bg).toBe("rgba(15, 15, 16, 0.25)");
});

test.describe("CHROME-TOOLBAR-LOCKSTEP @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("высота тулбара одинакова с фильтром и без", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const toolbar = page.locator(".catalog-toolbar");
    await toolbar.waitFor();
    const noFilter = await toolbar.boundingBox();
    expect(noFilter).toBeTruthy();

    // Выбор категории в sidebar-панели рождает чип в тулбаре.
    await page
      .locator(".catalog-menu-panel--sidebar .catalog-menu-chip")
      .first()
      .click();
    await page.locator(".catalog-filter-chips").waitFor();
    const withFilter = await toolbar.boundingBox();
    expect(withFilter).toBeTruthy();

    if (noFilter && withFilter) {
      expect(
        Math.abs(withFilter.height - noFilter.height),
      ).toBeLessThanOrEqual(1);
    }
  });
});
