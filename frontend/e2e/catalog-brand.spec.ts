import { expect, test } from "@playwright/test";

test.use({
  geolocation: { latitude: 53.361, longitude: 83.764 },
  permissions: ["geolocation"],
});

for (const width of [320, 768, 1280]) {
  test(`новый логотип сохраняет вёрстку при ширине ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const logo = page.getByRole("img", {
      name: "Гастрокорт Онлайн",
      exact: true,
    });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveJSProperty("naturalWidth", 686);
    await expect(logo).toHaveJSProperty("naturalHeight", 132);
    const metrics = await logo.evaluate((image: HTMLImageElement) => {
      const rect = image.getBoundingClientRect();
      const header = image.closest("header")!.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        headerTop: header.top,
        headerBottom: header.bottom,
        scrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      };
    });
    expect(metrics.width / metrics.height).toBeCloseTo(686 / 132, 1);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(width);
    expect(metrics.top).toBeGreaterThanOrEqual(metrics.headerTop);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.headerBottom);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
    await expect(logo.locator("..")).toHaveAttribute("href", "/");
    const filters = page.getByRole("button", {
      name: "Открыть фильтры",
      exact: true,
    });
    if (width < 1024) {
      await expect(filters).toBeVisible();
      const button = await filters.boundingBox();
      expect(button!.x + button!.width).toBeLessThanOrEqual(
        metrics.left,
      );
      await filters.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(filters).toBeHidden();
      const city = page.getByTestId("topbar-city-pill");
      await expect(city).toBeVisible();
      expect((await city.boundingBox())!.x).toBeGreaterThanOrEqual(
        metrics.right,
      );
    }
    await page.screenshot({
      path: `../tasks/catalog-logo-database-reset/runtime/catalog-${width}.png`,
    });
  });
}
