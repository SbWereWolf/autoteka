import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// SHEET-DOTS канон (_prototype/media-slider.jsx): точки пагинации ms-dot
// (бел./полупрозр.-бел. на скриме) + нижний скрим продлён до низа фото
// (заходит под наезд листа), белое поле защищено стекингом (лист выше скрима).

test.describe("SHEET-DOTS @390", () => {
  test("SHEET-SCRIM-GEOM: скрим до низа фото, наезд цел, белое защищено стекингом", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("shop-name").waitFor();

    const geo = await page.evaluate(() => {
      const visEl = (sel: string) =>
        Array.from(document.querySelectorAll(sel)).find(
          (el) => (el as HTMLElement).offsetParent,
        ) as HTMLElement | undefined;
      const rect = (el?: HTMLElement) =>
        el ? el.getBoundingClientRect() : null;
      const hero = rect(visEl(".shop-hero"));
      const scrim = rect(visEl(".shop-gallery-scrim-bottom"));
      const sheet = rect(visEl(".shop-sheet"));
      // Проба стекинга: точка в зоне наезда (центр X), топ-элемент = лист.
      const hit = sheet
        ? (document.elementFromPoint(195, sheet.top + 8) as HTMLElement | null)
        : null;
      return {
        hero: hero ? { bottom: hero.bottom } : null,
        scrim: scrim
          ? { bottom: scrim.bottom, height: scrim.height }
          : null,
        sheet: sheet ? { top: sheet.top } : null,
        hitInSheet: !!hit?.closest(".shop-sheet"),
        hitInHero: !!hit?.closest(".shop-hero"),
      };
    });

    expect(geo.hero).toBeTruthy();
    expect(geo.scrim).toBeTruthy();
    expect(geo.sheet).toBeTruthy();
    if (geo.hero && geo.scrim && geo.sheet) {
      // Новый инвариант: низ скрима == низ фото (±1px).
      expect(
        Math.abs(geo.scrim.bottom - geo.hero.bottom),
      ).toBeLessThanOrEqual(1);
      // Высота скрима 7.25rem (116px).
      expect(Math.abs(geo.scrim.height - 116)).toBeLessThanOrEqual(1);
      // Наезд листа не сломан: верх листа == низ фото − 20px.
      expect(
        Math.abs(geo.sheet.top - (geo.hero.bottom - 20)),
      ).toBeLessThanOrEqual(1);
      // Белое поле защищено стекингом: в зоне наезда сверху — лист, не hero.
      expect(geo.hitInSheet).toBe(true);
      expect(geo.hitInHero).toBe(false);
    }
  });

  test("SHEET-DOTS-COLOR: точки = канон ms-dot (бел. / полупрозр.-бел.)", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("shop-name").waitFor();

    const colors = await page.evaluate(() => {
      const vis = (sel: string) =>
        Array.from(document.querySelectorAll(sel)).find(
          (el) => (el as HTMLElement).offsetParent,
        );
      const active = vis(".shop-gallery-dot--active");
      const base = Array.from(
        document.querySelectorAll(
          ".shop-gallery-dot:not(.shop-gallery-dot--active)",
        ),
      ).find((el) => (el as HTMLElement).offsetParent);
      return {
        active: active ? getComputedStyle(active).backgroundColor : null,
        base: base ? getComputedStyle(base).backgroundColor : null,
      };
    });

    // .ms-dot--on { background:#fff } / .ms-dot { background:rgba(255,255,255,.4) }
    expect(colors.active).toBe("rgb(255, 255, 255)");
    expect(colors.base).toBe("rgba(255, 255, 255, 0.4)");
  });
});
