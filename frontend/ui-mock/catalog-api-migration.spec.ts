import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

async function waitForUiMockFrontend(request: APIRequestContext) {
  const deadline = Date.now() + 120_000;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    try {
      const response = await request.get("/", {
        timeout: 5_000,
      });
      if (response.ok()) {
        return true;
      }

      lastError = new Error(`Unexpected HTTP status: ${response.status()}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw lastError ?? new Error("UI mock frontend is unavailable");
}

test.beforeEach(async ({ request }) => {
  try {
    await waitForUiMockFrontend(request);
  } catch {
    test.skip(true, "UI mock frontend is unavailable");
  }
});

test("UI-MOCK-01: каталог показывает новый top bar и плитки без названий", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-hamburger-line")).toHaveCount(4);
  await expect(page.getByRole("img", { name: "TOauto.ru" })).toBeVisible();
  await expect(page.locator(".catalog-shop-tile")).toHaveCount(2);
  await expect(page.getByText("CarsHelps")).toHaveCount(0);

  const stickyMetrics = await page.evaluate(() => {
    const sticky = document.querySelector(
      '[data-testid="catalog-feature-sticky"]',
    ) as HTMLElement | null;
    const rect = sticky?.getBoundingClientRect() ?? null;
    return rect
      ? {
          viewportHeight: window.innerHeight,
          gapBottom: window.innerHeight - rect.bottom,
        }
      : null;
  });

  expect(stickyMetrics).toBeTruthy();
  if (stickyMetrics) {
    expect(stickyMetrics.gapBottom).toBeGreaterThanOrEqual(
      stickyMetrics.viewportHeight * 0.05,
    );
  }

  await expect(page.getByTestId("catalog-feature-chevron")).toHaveCount(0);
  await expect(
    page.locator(
      '[data-testid="catalog-feature-sticky"] .catalog-select-icon',
    ),
  ).toHaveCount(1);

  const stickyLayout = await page.evaluate(() => {
    const sticky = document.querySelector(
      '[data-testid="catalog-feature-sticky"]',
    ) as HTMLElement | null;
    const select = document.querySelector(
      '[data-testid="catalog-feature-select"]',
    ) as HTMLElement | null;

    const stickyRect = sticky?.getBoundingClientRect() ?? null;
    const selectRect = select?.getBoundingClientRect() ?? null;

    if (!stickyRect || !selectRect) {
      return null;
    }

    const stickyCenterX = stickyRect.left + stickyRect.width / 2;
    const stickyCenterY = stickyRect.top + stickyRect.height / 2;
    const selectCenterX = selectRect.left + selectRect.width / 2;
    const selectCenterY = selectRect.top + selectRect.height / 2;

    return {
      widthRatio: selectRect.width / stickyRect.width,
      centerOffsetX: Math.abs(stickyCenterX - selectCenterX),
      centerOffsetY: Math.abs(stickyCenterY - selectCenterY),
    };
  });

  expect(stickyLayout).toBeTruthy();
  if (stickyLayout) {
    expect(stickyLayout.widthRatio).toBeLessThanOrEqual(0.92);
    expect(stickyLayout.centerOffsetX).toBeLessThanOrEqual(8);
    expect(stickyLayout.centerOffsetY).toBeLessThanOrEqual(8);
  }
});

test("UI-MOCK-02: overlay меняет город и обновляет каталог", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(
    page.locator(".catalog-menu-panel .catalog-brand-logo"),
  ).toHaveCount(0);
  const citySelect = page.getByTestId("menu-city-select");
  await expect(citySelect).toHaveValue("barnaul");
  await citySelect.selectOption("nizhny");
  await expect(page.locator(".catalog-shop-tile")).toHaveCount(1);
});

test("UI-MOCK-03: страница магазина показывает slogan, контакты и schedule note", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator(".shop-back-button")).toBeVisible();
  await expect(page.locator(".shop-back-icon")).toHaveCount(0);
  await expect(page.locator(".shop-back-raster")).toBeVisible();
  await expect(page.locator(".shop-back-button")).toHaveText("");
  await expect(
    page.getByTestId("shop-slogan"),
  ).toBeVisible();
  await expect(page.getByTestId("shop-slogan")).toContainText(
    "Запчасти рядом, когда они нужны",
  );
  await expect(
    page.getByTestId("shop-schedule-note"),
  ).toContainText("Время работы");
  await expect(
    page.getByTestId("shop-schedule-note"),
  ).toContainText("09:00 - 20:00");
  await expect(page.getByTestId("shop-contacts")).toBeVisible();
  await expect(page.getByText("Контакты:")).toBeVisible();
  await expect(page.getByTestId("shop-contacts").locator("a")).toHaveCount(5);
  await expect(page.getByTestId("shop-features")).toBeVisible();
  await expect(page.getByText("Отечественные запчасти")).toBeVisible();
  await expect(page.getByText("Корейские запчасти")).toBeVisible();
  await expect(page.getByText("carshelps.ru")).toBeVisible();
  await expect(page.getByText("Перейти на сайт")).toHaveCount(0);
  await expect(page.getByText("Возможности")).toHaveCount(0);
  await expect(page.locator(".shop-gallery-dot")).toHaveCount(2);

  const heroLayout = await page.evaluate(() => {
    const slogan = document.querySelector(
      '[data-testid="shop-slogan"]',
    ) as HTMLElement | null;
    const description = document.querySelector(
      '[data-testid="shop-description"]',
    ) as HTMLElement | null;
    const note = document.querySelector(
      '[data-testid="shop-schedule-note"]',
    ) as HTMLElement | null;
    const dots = document.querySelector(
      '.shop-gallery-dots',
    ) as HTMLElement | null;
    const gallery = document.querySelector(
      '.shop-hero-gallery',
    ) as HTMLElement | null;

    const sloganRect = slogan?.getBoundingClientRect() ?? null;
    const descriptionRect = description?.getBoundingClientRect() ?? null;
    const noteRect = note?.getBoundingClientRect() ?? null;
    const dotsRect = dots?.getBoundingClientRect() ?? null;
    const galleryRect = gallery?.getBoundingClientRect() ?? null;
    const descriptionStyle = description
      ? window.getComputedStyle(description)
      : null;
    const noteStyle = note ? window.getComputedStyle(note) : null;

    return {
      sloganRect,
      descriptionRect,
      noteRect,
      dotsRect,
      galleryRect,
      descriptionLineHeight: descriptionStyle
        ? Number.parseFloat(descriptionStyle.lineHeight)
        : null,
      descriptionFontSize: descriptionStyle
        ? Number.parseFloat(descriptionStyle.fontSize)
        : null,
      noteFontSize: noteStyle
        ? Number.parseFloat(noteStyle.fontSize)
        : null,
      noteFontWeight: noteStyle?.fontWeight ?? null,
    };
  });

  expect(heroLayout.descriptionRect).toBeTruthy();
  expect(heroLayout.sloganRect).toBeTruthy();
  expect(heroLayout.noteRect).toBeTruthy();
  expect(heroLayout.dotsRect).toBeTruthy();
  if (
    heroLayout.sloganRect &&
    heroLayout.descriptionRect &&
    heroLayout.descriptionLineHeight
  ) {
    expect(
      heroLayout.descriptionRect.top - heroLayout.sloganRect.bottom,
    ).toBeGreaterThanOrEqual(heroLayout.descriptionLineHeight - 1);
  }
  if (
    heroLayout.noteRect &&
    heroLayout.dotsRect &&
    heroLayout.galleryRect &&
    heroLayout.descriptionLineHeight
  ) {
    const noteCenter = heroLayout.noteRect.left + heroLayout.noteRect.width / 2;
    const galleryCenter =
      heroLayout.galleryRect.left + heroLayout.galleryRect.width / 2;
    expect(Math.abs(noteCenter - galleryCenter)).toBeLessThanOrEqual(8);
    expect(
      heroLayout.dotsRect.top - heroLayout.noteRect.bottom,
    ).toBeGreaterThanOrEqual(heroLayout.descriptionLineHeight - 1);
  }
  expect(heroLayout.noteFontWeight).toMatch(/^(600|700|800|900|bold)$/);
  if (heroLayout.noteFontSize && heroLayout.descriptionFontSize) {
    expect(
      Math.abs(heroLayout.noteFontSize - heroLayout.descriptionFontSize),
    ).toBeLessThanOrEqual(0.5);
  }
});

test("UI-MOCK-03A: loading skeleton шапки магазина не накладывается", async ({
  page,
}) => {
  await installApiMocks(page, {
    delaysMs: {
      shopByCode: {
        "barnaul-01": 1500,
      },
    },
  });

  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByTestId("shop-loading-back-skeleton"),
  ).toBeVisible();
  await expect(
    page.getByTestId("shop-loading-logo-skeleton"),
  ).toBeVisible();

  const loadingLayout = await page.evaluate(() => {
    const back = document.querySelector(
      '[data-testid="shop-loading-back-skeleton"]',
    ) as HTMLElement | null;
    const logo = document.querySelector(
      '[data-testid="shop-loading-logo-skeleton"]',
    ) as HTMLElement | null;

    const backRect = back?.getBoundingClientRect() ?? null;
    const logoRect = logo?.getBoundingClientRect() ?? null;

    if (!backRect || !logoRect) {
      return null;
    }

    return {
      overlapX:
        Math.min(backRect.right, logoRect.right) -
        Math.max(backRect.left, logoRect.left),
      gapX: logoRect.left - backRect.right,
    };
  });

  expect(loadingLayout).toBeTruthy();
  if (loadingLayout) {
    expect(loadingLayout.overlapX).toBeLessThanOrEqual(0);
    expect(loadingLayout.gapX).toBeGreaterThanOrEqual(0);
  }

  await expect(page.locator(".shop-back-button")).toBeVisible();
});

test("UI-MOCK-04: 404 магазин показывает экран ошибки", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/nonexistent", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Магазин не найден" }),
  ).toBeVisible();
});

test("UI-MOCK-05: ошибка контактов не ломает страницу магазина", async ({
  page,
}) => {
  await installApiMocks(page, {
    contactsByCode: {
      "barnaul-01": 500,
    },
  });
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByText("Часть контактов сейчас недоступна."),
  ).toBeVisible();
  await expect(
    page.getByText("Запчасти рядом, когда они нужны"),
  ).toBeVisible();
});

test("UI-MOCK-06: theme editor и theme switcher удалены", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("theme-switcher")).toHaveCount(0);
  await expect(page.getByText(/theme-a-/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "CSS переменные" }),
  ).toHaveCount(0);
});

test("UI-MOCK-07: на узком viewport появляется горизонтальный scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 280, height: 800 });
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
});

test("UI-MOCK-08: интерактивные элементы visibly реагируют на hover и press", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", {
    waitUntil: "domcontentloaded",
  });

  const snapshot = async (
    selector: string,
    options: { first?: boolean } = {},
  ) =>
    (options.first ? page.locator(selector).first() : page.locator(selector))
      .evaluate((element) => {
      const style = window.getComputedStyle(element as HTMLElement);
      return {
        transform: style.transform,
        boxShadow: style.boxShadow,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
      };
    });

  const brandBefore = await snapshot(".catalog-brand-link");
  await page.locator(".catalog-brand-link").hover();
  const brandHover = await snapshot(".catalog-brand-link");
  expect(brandHover).not.toEqual(brandBefore);

  const tileBackgrounds = await page.locator(".catalog-shop-tile").evaluateAll(
    (elements) =>
      elements.slice(0, 2).map((element) => {
        const style = window.getComputedStyle(element as HTMLElement);
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
        };
      }),
  );

  expect(tileBackgrounds).toHaveLength(2);
  expect(tileBackgrounds[0]).toEqual(tileBackgrounds[1]);

  const tileBefore = await snapshot(".catalog-shop-tile", {
    first: true,
  });
  await page.locator(".catalog-shop-tile").first().hover();
  const tileHover = await snapshot(".catalog-shop-tile", {
    first: true,
  });
  await page.locator(".catalog-shop-tile").first().dispatchEvent("pointerdown");
  const tileActive = await snapshot(".catalog-shop-tile", {
    first: true,
  });

  expect(tileHover).not.toEqual(tileBefore);
  expect(tileActive).not.toEqual(tileBefore);

  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const backBefore = await snapshot(".shop-back-button");
  await page.locator(".shop-back-button").hover();
  const backHover = await snapshot(".shop-back-button");
  await page.locator(".shop-back-button").click({ trial: true });
  await page.locator(".shop-back-button").dispatchEvent("pointerdown");
  const backActive = await snapshot(".shop-back-button");
  await page.locator(".shop-back-button").dispatchEvent("pointerup");

  expect(backHover).not.toEqual(backBefore);
  expect(backActive).not.toEqual(backBefore);

  const contactBefore = await snapshot(".shop-contact-link", {
    first: true,
  });
  await page.locator(".shop-contact-link").first().hover();
  const contactHover = await snapshot(".shop-contact-link", {
    first: true,
  });
  expect(contactHover).not.toEqual(contactBefore);
});
