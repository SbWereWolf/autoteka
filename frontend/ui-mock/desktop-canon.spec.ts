import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Десктоп-канон-гарды (_prototype/desktop-*.jsx). Вьюпорт per-test.

test.describe("DK-1: стрелки десктоп-галереи = ix-onimg @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("radius 12, тёмная подложка rgba(0,0,0,.4), focus-кольцо", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });

    const arrow = page
      .getByTestId("shop-gallery")
      .locator(".shop-gallery-stage-arrow--right");
    await expect(arrow).toBeVisible();

    const style = await arrow.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, bg: cs.backgroundColor };
    });
    expect(style.radius).toBe("12px");
    expect(style.bg).toBe("rgba(0, 0, 0, 0.4)");

    // focus-visible кольцо (programmatic focus + computed box-shadow).
    const shadow = await arrow.evaluate((el) => {
      (el as HTMLElement).focus();
      return getComputedStyle(el).boxShadow;
    });
    expect(shadow).not.toBe("none");
  });
});

test.describe("DK-6: токен-ниты каталога", () => {
  test("h1 «Каталог» = 24px @1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const fs = await page
      .locator(".catalog-title")
      .evaluate((el) => getComputedStyle(el).fontSize);
    expect(fs).toBe("24px");
  });

  test("сетка 3 колонки @1280, 4 колонки @1440", async ({ page }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const grid = page.locator(".catalog-grid");
    await grid.waitFor();
    const cols1280 = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
    expect(cols1280).toBe(3);

    await page.setViewportSize({ width: 1440, height: 900 });
    const cols1440 = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
    expect(cols1440).toBe(4);
  });
});

test.describe("DK-4: sidebar-карточка каталога @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("карточка видима, slot sticky, заголовок 17px, чип togglable", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const panel = page.locator(".catalog-menu-panel--sidebar");
    await expect(panel).toBeVisible();

    const slotPos = await page
      .locator(".catalog-sidebar-slot")
      .evaluate((el) => getComputedStyle(el).position);
    expect(slotPos).toBe("sticky");

    const titleFs = await panel
      .locator(".catalog-menu-title")
      .evaluate((el) => getComputedStyle(el).fontSize);
    expect(titleFs).toBe("17px");

    const chip = panel.locator(".catalog-menu-chip").first();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});
