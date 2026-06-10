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
