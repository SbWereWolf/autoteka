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

test.describe("DK-5: DesktopState каталога @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("пустое состояние центрировано, min-height 420", async ({
    page,
  }) => {
    // kemerovo — город без магазинов в фикстуре → пустой каталог.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "autoteka_city",
        JSON.stringify("kemerovo"),
      );
    });
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const state = page.getByTestId("catalog-state");
    await expect(state).toBeVisible();

    const css = await state.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { minHeight: cs.minHeight, justify: cs.justifyContent };
    });
    expect(css.minHeight).toBe("420px");
    expect(css.justify).toBe("center");

    // Канон-медальон 88px.
    const med = await state
      .locator(".catalog-state-medallion")
      .boundingBox();
    expect(med).toBeTruthy();
    if (med) {
      expect(Math.round(med.width)).toBe(88);
      expect(Math.round(med.height)).toBe(88);
    }
  });
});

test.describe("DK-2: правая панель магазина = канон ds-card @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("зелёная точка, контакты без underline, ds-actions, нет навигатор-кнопки", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });

    const card = page.getByTestId("shop-info-aside");
    await expect(card).toBeVisible();

    // «Время работы» — глиф часов (канон ClockIcon).
    await expect(card.locator(".shop-schedule-clock")).toBeVisible();

    // Контакт-строка без underline.
    const deco = await card
      .locator(".shop-contact-row")
      .first()
      .evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(deco).toBe("none");

    // Навигатор-кнопки в десктоп-панели нет.
    await expect(
      card.getByTestId("shop-contact-open-navi"),
    ).toHaveCount(0);

    // ds-actions: CTA «Маршрут» ≥44 таргет + share-кнопка.
    const route = card.getByTestId("shop-ds-action-route");
    await expect(route).toBeVisible();
    const box = await route.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    await expect(
      card.getByTestId("shop-ds-action-share"),
    ).toBeVisible();
  });
});

test.describe("DK-3: десктоп-шапка dk-header @1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("шапка sticky 64 на каталоге и магазине", async ({ page }) => {
    await installApiMocks(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cat = await page
      .locator(".catalog-topbar")
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { pos: cs.position, h: cs.height };
      });
    expect(cat.pos).toBe("sticky");
    expect(cat.h).toBe("64px");

    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });
    const header = page.locator(".catalog-topbar");
    await expect(header).toBeVisible();
    const sh = await header.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { pos: cs.position, h: cs.height };
    });
    expect(sh.pos).toBe("sticky");
    expect(sh.h).toBe("64px");
  });

  test("город-pill: поповер открывается, Esc закрывает с возвратом фокуса", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const pill = page.getByTestId("topbar-city-pill");
    await pill.click();
    const menu = page.getByRole("menu", { name: "Выбор города" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.activeElement?.getAttribute("data-testid"),
        ),
      )
      .toBe("topbar-city-pill");
  });

  test("выбор города в pill меняет выдачу", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByTestId("topbar-city-pill").click();
    await page
      .getByRole("menuitemradio", { name: "Нижний Новгород" })
      .click();
    await expect(page.locator(".catalog-shop-tile")).toHaveCount(1);
  });
});
