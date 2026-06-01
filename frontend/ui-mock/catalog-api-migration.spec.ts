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

      lastError = new Error(
        `Unexpected HTTP status: ${response.status()}`,
      );
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
    page.getByRole("button", { name: "Открыть фильтры" }),
  ).toBeVisible();
  await expect(
    page.locator("button[data-menu-button] svg"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("img", { name: "TOauto.ru" }),
  ).toBeVisible();
  await expect(page.locator(".catalog-shop-tile")).toHaveCount(2);
  await expect(page.getByText("CarsHelps")).toHaveCount(0);
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toHaveAttribute("href", "/shop/barnaul-01");
  await expect(
    page.locator('.catalog-shop-tile img[alt="CarsHelps"]'),
  ).toHaveCount(1);
  await expect(
    page.locator(".catalog-shop-tile").nth(1),
  ).toHaveAttribute("aria-label", "Orange Parts");

  const sortBar = page.getByTestId("catalog-sort-bar");
  await expect(sortBar).toBeVisible();
  const sortButton = sortBar.getByRole("button");
  await expect(sortButton).toContainText("Сначала: ");
  await expect(sortButton).toHaveAttribute("aria-haspopup", "dialog");
  await expect(sortButton).toHaveAttribute("aria-expanded", "false");
});

test("UI-MOCK-02: overlay меняет город и обновляет каталог", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
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
  await expect(page.getByTestId("shop-slogan")).toBeVisible();
  await expect(page.getByTestId("shop-slogan")).toContainText(
    "Запчасти рядом, когда они нужны",
  );
  await expect(page.getByTestId("shop-schedule-note")).toContainText(
    "Время работы",
  );
  await expect(page.getByTestId("shop-schedule-note")).toContainText(
    "09:00 - 20:00",
  );
  await expect(page.getByTestId("shop-contacts")).toBeVisible();
  await expect(page.getByText("Контакты:")).toBeVisible();
  await expect(
    page.getByTestId("shop-contacts").locator("a"),
  ).toHaveCount(5);
  await expect(page.getByTestId("shop-features")).toBeVisible();
  await expect(page.getByText("Отечественные запчасти")).toBeVisible();
  await expect(page.getByText("Корейские запчасти")).toBeVisible();
  await expect(page.getByText("carshelps.ru")).toBeVisible();
  await expect(page.getByText("Перейти на сайт")).toHaveCount(0);
  await expect(page.getByText("Возможности")).toHaveCount(0);
  await expect(
    page.getByTestId("shop-gallery").locator(".shop-gallery-dot"),
  ).toHaveCount(2);

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
      '[data-testid="shop-gallery"] .shop-gallery-dots',
    ) as HTMLElement | null;
    const gallery = document.querySelector(
      ".shop-hero-gallery",
    ) as HTMLElement | null;

    const sloganRect = slogan?.getBoundingClientRect() ?? null;
    const descriptionRect =
      description?.getBoundingClientRect() ?? null;
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
    const noteCenter =
      heroLayout.noteRect.left + heroLayout.noteRect.width / 2;
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
      Math.abs(
        heroLayout.noteFontSize - heroLayout.descriptionFontSize,
      ),
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
    (options.first
      ? page.locator(selector).first()
      : page.locator(selector)
    ).evaluate((element) => {
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

  const tileBackgrounds = await page
    .locator(".catalog-shop-tile")
    .evaluateAll((elements) =>
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
  await page
    .locator(".catalog-shop-tile")
    .first()
    .dispatchEvent("pointerdown");
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

test("UI-MOCK-09: каталог показывает скелетон при загрузке и аннонс", async ({
  page,
}) => {
  await installApiMocks(page, {
    delaysMs: { cityCatalogByCode: { barnaul: 1500 } },
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const skeleton = page.getByTestId("catalog-skeleton");
  await expect(skeleton).toBeVisible();
  await expect(skeleton).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".catalog-skeleton-tile")).toHaveCount(6);

  const live = page.locator('[role="status"]');
  await expect(live).toHaveText("Загрузка каталога");

  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(2);
  await expect(skeleton).toHaveCount(0);
  await expect(live).toHaveText("Каталог загружен");
});

test("UI-MOCK-10: пустой каталог в городе без магазинов", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(2);

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await page.getByTestId("menu-city-select").selectOption("kemerovo");
  await page
    .locator(".catalog-menu-panel")
    .getByRole("button", { name: "Закрыть" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  await expect(state.locator(".catalog-state-title")).toHaveText(
    "Ничего не найдено",
  );
  await expect(state.locator(".catalog-state-text")).toHaveText(
    "В этом городе пока нет магазинов.",
  );
  await expect(
    state.locator(".catalog-state-medallion path"),
  ).toHaveCount(1);

  await expect(page.locator('[role="status"]')).toHaveText(
    "Ничего не найдено",
  );
});

test("UI-MOCK-11: ошибка загрузки каталога и повтор", async ({
  page,
}) => {
  let cityRequestCount = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/v1/city/barnaul")) {
      cityRequestCount += 1;
    }
  });

  await installApiMocks(page, {
    cityCatalogByCode: { barnaul: 500 },
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  await expect(state.locator(".catalog-state-title")).toHaveText(
    "Не удалось загрузить",
  );
  await expect(state.locator(".catalog-state-text")).toHaveText(
    "Что-то пошло не так. Попробуйте ещё раз.",
  );
  await expect(
    state.locator(".catalog-state-medallion path"),
  ).toHaveCount(3);

  await expect(page.locator('[role="status"]')).toHaveText(
    "Не удалось загрузить",
  );

  const before = cityRequestCount;
  await page.locator(".catalog-state-cta").click();
  await expect
    .poll(() => cityRequestCount, { timeout: 5000 })
    .toBeGreaterThan(before);
});

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

test("UI-MOCK-12: дровер фильтров — APG-структура и inert фона", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAttribute(
    "aria-labelledby",
    "filters-title",
  );
  await expect(page.locator("#filters-title")).toHaveText("Фильтры");

  const bgInert = await page.evaluate(() => {
    const main = document.querySelector("main");
    return Boolean(main?.closest("[inert]"));
  });
  expect(bgInert).toBe(true);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const dialogEl = document.querySelector('[role="dialog"]');
        return Boolean(
          dialogEl && dialogEl.contains(document.activeElement),
        );
      }),
    )
    .toBe(true);
});

test("UI-MOCK-13: дровер — Tab/Shift+Tab циклит фокус внутри", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return Boolean(
          dialog && dialog.contains(document.activeElement),
        );
      }),
    )
    .toBe(true);

  await page.evaluate((sel) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(sel));
    nodes[nodes.length - 1]?.focus();
  }, FOCUSABLE_SELECTOR);
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page.evaluate((sel) => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(sel),
        );
        return document.activeElement === nodes[0];
      }, FOCUSABLE_SELECTOR),
    )
    .toBe(true);

  await page.evaluate((sel) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(sel));
    nodes[0]?.focus();
  }, FOCUSABLE_SELECTOR);
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      page.evaluate((sel) => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(sel),
        );
        return document.activeElement === nodes[nodes.length - 1];
      }, FOCUSABLE_SELECTOR),
    )
    .toBe(true);

  const inside = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return Boolean(dialog && dialog.contains(document.activeElement));
  });
  expect(inside).toBe(true);
});

test("UI-MOCK-14: Esc закрывает дровер и возвращает фокус на триггер", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-menu-button]").click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement ===
          document.querySelector("[data-menu-button]"),
      ),
    )
    .toBe(true);
});

test("UI-MOCK-15: тоггл категории в дровере добавляет чип в ряд фильтров", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page
    .locator(".catalog-menu-panel")
    .getByRole("button", { name: "Корейские запчасти" })
    .click();

  const chipRow = page.locator('[data-testid="catalog-filter-row"]');
  await expect(chipRow).toBeVisible();
  await expect(
    chipRow.getByRole("button", {
      name: "Удалить фильтр: Корейские запчасти",
    }),
  ).toBeVisible();
});

test("UI-MOCK-16: удаление чипа снимает категорию", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  const menuPanel = page.locator(".catalog-menu-panel");
  await menuPanel
    .getByRole("button", { name: "Корейские запчасти" })
    .click();
  await menuPanel.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const chipRow = page.locator('[data-testid="catalog-filter-row"]');
  const chipBtn = chipRow.getByRole("button", {
    name: "Удалить фильтр: Корейские запчасти",
  });
  await expect(chipBtn).toBeVisible();
  await chipBtn.click();
  await expect(chipRow).toHaveCount(0);

  const stored = await page.evaluate(() =>
    localStorage.getItem("autoteka_categories"),
  );
  expect(stored).toBe("[]");
});

test("UI-MOCK-17: кнопка Очистить все убирает все чипы и категории", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  const menuPanel = page.locator(".catalog-menu-panel");
  await menuPanel
    .getByRole("button", { name: "Корейские запчасти" })
    .click();
  await menuPanel
    .getByRole("button", { name: "Японские запчасти" })
    .click();
  await menuPanel.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const chipRow = page.locator('[data-testid="catalog-filter-row"]');
  await expect(chipRow).toBeVisible();
  await chipRow
    .getByRole("button", { name: "Очистить все фильтры" })
    .click();
  await expect(chipRow).toHaveCount(0);

  const stored = await page.evaluate(() =>
    localStorage.getItem("autoteka_categories"),
  );
  expect(stored).toBe("[]");
});

test("UI-MOCK-18: пустой результат с фильтрами показывает чипы внутри состояния", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  const menuPanel = page.locator(".catalog-menu-panel");
  await menuPanel
    .getByRole("button", { name: "Корейские запчасти" })
    .click();
  await page.getByTestId("menu-city-select").selectOption("kemerovo");
  await menuPanel.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  await expect(state.locator(".catalog-state-title")).toHaveText(
    "Ничего не найдено",
  );
  await expect(state.locator(".catalog-state-text")).toHaveText(
    "Снимите фильтр или измените параметры поиска.",
  );

  const chipRow = state.locator('[data-testid="catalog-filter-row"]');
  await expect(chipRow).toBeVisible();
  await expect(
    chipRow.getByRole("button", {
      name: "Удалить фильтр: Корейские запчасти",
    }),
  ).toBeVisible();
});

test("UI-MOCK-19: чипы объявляют снятие и очистку через диктор", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const menuPanel = page.locator(".catalog-menu-panel");
  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await menuPanel
    .getByRole("button", { name: "Корейские запчасти" })
    .click();
  await menuPanel.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const chipRow = page.locator('[data-testid="catalog-filter-row"]');
  const live = page.locator('[role="status"]');
  await chipRow
    .getByRole("button", {
      name: "Удалить фильтр: Корейские запчасти",
    })
    .click();
  await expect(live).toHaveText("Фильтр снят: Корейские запчасти");

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await menuPanel
    .getByRole("button", { name: "Корейские запчасти" })
    .click();
  await menuPanel
    .getByRole("button", { name: "Японские запчасти" })
    .click();
  await menuPanel.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await chipRow
    .getByRole("button", { name: "Очистить все фильтры" })
    .click();
  await expect(live).toHaveText("Фильтры очищены");
});

test("UI-MOCK-20: диктор молчит пока дровер открыт и объявляет на закрытии", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(2);
  const live = page.locator('[role="status"]');
  await expect(live).toHaveText("Каталог загружен");

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByTestId("menu-city-select").selectOption("kemerovo");
  await expect(page.getByTestId("catalog-state")).toBeVisible();
  // viewState changed behind the open drawer — announcer must stay silent
  await expect(live).toHaveText("Каталог загружен");

  await page
    .locator(".catalog-menu-panel")
    .getByRole("button", { name: "Закрыть" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(live).toHaveText("Ничего не найдено");
});

test("UI-MOCK-21: bottom-sheet сортировки — APG-структура и inert фона", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("catalog-sort-bar")
    .getByRole("button")
    .click();

  const dialog = page.getByRole("dialog", { name: "Сортировка" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAttribute("aria-labelledby", "sort-title");
  await expect(page.locator("#sort-title")).toHaveText("Сортировка");

  const bgInert = await page.evaluate(() => {
    const main = document.querySelector("main");
    return Boolean(main?.closest("[inert]"));
  });
  expect(bgInert).toBe(true);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return Boolean(d && d.contains(document.activeElement));
      }),
    )
    .toBe(true);
});

test("UI-MOCK-22: Esc закрывает шит сортировки и возвращает фокус на триггер", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const trigger = page
    .getByTestId("catalog-sort-bar")
    .getByRole("button");
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Сортировка" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Сортировка" }),
  ).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement ===
          document.querySelector("[data-sort-trigger]"),
      ),
    )
    .toBe(true);
});

test("UI-MOCK-23: тап по опции меняет фичу, обновляет localStorage и закрывает шит", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("catalog-sort-bar")
    .getByRole("button")
    .click();

  const dialog = page.getByRole("dialog", { name: "Сортировка" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: "Самовывоз" }).click();
  await expect(dialog).toHaveCount(0);

  const stored = await page.evaluate(() =>
    localStorage.getItem("autoteka_feature"),
  );
  expect(stored).toBe('"pickup"');

  await expect(
    page.getByTestId("catalog-sort-bar").getByRole("button"),
  ).toHaveText("Сначала: Самовывоз");
});

test("UI-MOCK-24: текущая фича помечена aria-checked в шите", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("catalog-sort-bar")
    .getByRole("button")
    .click();

  const dialog = page.getByRole("dialog", { name: "Сортировка" });
  const current = dialog.getByRole("radio", { name: "Акции" });
  await expect(current).toHaveAttribute("aria-checked", "true");
  const other = dialog.getByRole("radio", { name: "Самовывоз" });
  await expect(other).toHaveAttribute("aria-checked", "false");
});

test("UI-MOCK-25: выбор сортировки объявляется в дикторе", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("catalog-sort-bar")
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog", { name: "Сортировка" })
    .getByRole("radio", { name: "Самовывоз" })
    .click();
  await expect(page.locator('[role="status"]')).toHaveText(
    "Сортировка: Самовывоз",
  );
});

test("UI-MOCK-26: выбранная фича не появляется в ряду чипов", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('[data-testid="catalog-filter-row"]'),
  ).toHaveCount(0);

  await page
    .getByTestId("catalog-sort-bar")
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog", { name: "Сортировка" })
    .getByRole("radio", { name: "Самовывоз" })
    .click();
  await expect(
    page.locator('[data-testid="catalog-filter-row"]'),
  ).toHaveCount(0);
});
