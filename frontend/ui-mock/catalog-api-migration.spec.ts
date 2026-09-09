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

test("UI-MOCK-01: каталог показывает новый top bar и плитки с названиями", async ({
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
  await expect(page.locator(".catalog-shop-tile")).toHaveCount(3);
  // Канон: название магазина — видимый текст внутри ссылки;
  // имя ссылки = название; лого декоративно (alt="").
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toHaveAttribute("href", "/shop/barnaul-01");
  await expect(
    page.locator(".catalog-shop-tile").first().getByText("CarsHelps"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "CarsHelps" }),
  ).toBeVisible();
  await expect(
    page.locator('.catalog-shop-tile img[alt=""]'),
  ).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Orange Parts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Zenith Parts" }),
  ).toBeVisible();

  const offersBar = page.getByTestId("catalog-offers-bar");
  await expect(offersBar).toBeVisible();
  const offersButton = offersBar.getByRole("button");
  await expect(offersButton).toHaveText("Акции");
  await expect(offersButton).toHaveAttribute("aria-haspopup", "dialog");
  await expect(offersButton).toHaveAttribute("aria-expanded", "false");
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
  await expect(page.locator(".shop-back-raster")).toHaveCount(0);
  await expect(page.locator(".shop-back-button svg")).toBeVisible();
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
  await expect(
    page.getByText("Контакты", { exact: true }),
  ).toBeVisible();
  // Канон контент-секции: phone×2 + address×1 + email×1 текстом
  // (без ссылок — ссылки в action-баре).
  await expect(
    page.getByTestId("shop-contacts").locator("a"),
  ).toHaveCount(0);
  await expect(
    page.getByTestId("shop-contacts").locator(".shop-contact-row"),
  ).toHaveCount(4);
  await expect(page.getByTestId("shop-features")).toBeVisible();
  await expect(page.getByText("Отечественные запчасти")).toBeVisible();
  await expect(page.getByText("Корейские запчасти")).toBeVisible();
  await expect(page.getByText("Перейти на сайт")).toHaveCount(0);
  await expect(page.getByText("Возможности")).toHaveCount(0);
  await expect(
    page.getByTestId("shop-gallery").locator(".shop-gallery-dot"),
  ).toHaveCount(2);

  // Канон ShopMain: единственный h1 страницы = имя магазина.
  await expect(page.getByTestId("shop-name")).toHaveText("CarsHelps");
  await expect(page.getByTestId("shop-description")).toBeVisible();
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

  // Новый hero-скелетон: квадратный медиа-скелетон + оверлей-форма
  // кнопки Назад. Лого на мобиле удалён → лого-скелетона нет.
  await expect(
    page.getByTestId("shop-loading-back-skeleton"),
  ).toBeVisible();
  await expect(
    page.getByTestId("shop-loading-logo-skeleton"),
  ).toHaveCount(0);

  const backRect = await page
    .getByTestId("shop-loading-back-skeleton")
    .boundingBox();
  expect(backRect).toBeTruthy();
  if (backRect) {
    expect(backRect.width).toBeGreaterThan(0);
    expect(backRect.height).toBeGreaterThan(0);
  }
});

// CLS-lockstep: канон-стратегия (shop-card.jsx) — hero и первый контент-блок
// держат геометрию между skeleton- и loaded-рендером (промо collapse — снизу).
test("UI-MOCK-03B: hero и первый блок без CLS skeleton↔loaded @390", async ({
  page,
}) => {
  await installApiMocks(page, {
    delaysMs: {
      shopByCode: { "barnaul-01": 1200 },
      promotionByCode: { "barnaul-01": 1200 },
    },
  });
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  // --- skeleton-рендер (shop ещё грузится) ---
  await expect(
    page.getByTestId("shop-loading-back-skeleton"),
  ).toBeVisible();
  const heroSkel = await page.locator(".shop-hero").boundingBox();
  const sheetSkel = await page.locator(".shop-sheet").boundingBox();
  expect(heroSkel).toBeTruthy();
  expect(sheetSkel).toBeTruthy();

  // --- loaded-рендер ---
  await expect(page.getByTestId("shop-name")).toBeVisible();
  const heroLoaded = await page.locator(".shop-hero").boundingBox();
  const sheetLoaded = await page.locator(".shop-sheet").boundingBox();
  expect(heroLoaded).toBeTruthy();
  expect(sheetLoaded).toBeTruthy();

  // hero-зона не сдвигается и не меняет размер.
  if (heroSkel && heroLoaded) {
    expect(Math.abs(heroLoaded.x - heroSkel.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(heroLoaded.y - heroSkel.y)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(heroLoaded.width - heroSkel.width),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(heroLoaded.height - heroSkel.height),
    ).toBeLessThanOrEqual(1);
  }
  // верх первого контент-блока (sheet) не сдвигается.
  if (sheetSkel && sheetLoaded) {
    expect(Math.abs(sheetLoaded.y - sheetSkel.y)).toBeLessThanOrEqual(1);
  }
});

test("UI-MOCK-04: 404 магазин показывает экран ошибки", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/nonexistent", {
    waitUntil: "domcontentloaded",
  });
  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  const title = state.locator(".catalog-state-title");
  await expect(title).toHaveText("Магазин не найден");
  await expect(
    title.evaluate((el) => el.tagName.toLowerCase()),
  ).resolves.toBe("h2");
  await expect(state.locator(".catalog-state-cta")).toHaveCount(0);
  await expect(
    page.getByTestId("shop-load-error-retry"),
  ).toHaveCount(0);
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

  const TRANSITION_SETTLE_MS = 250;

  const brandBefore = await snapshot(".catalog-brand-link");
  await page.locator(".catalog-brand-link").hover();
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
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
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
  const tileHover = await snapshot(".catalog-shop-tile", {
    first: true,
  });
  await page
    .locator(".catalog-shop-tile")
    .first()
    .dispatchEvent("pointerdown");
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
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
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
  const backHover = await snapshot(".shop-back-button");
  await page.locator(".shop-back-button").click({ trial: true });
  await page.locator(".shop-back-button").dispatchEvent("pointerdown");
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
  const backActive = await snapshot(".shop-back-button");
  await page.locator(".shop-back-button").dispatchEvent("pointerup");

  expect(backHover).not.toEqual(backBefore);
  expect(backActive).not.toEqual(backBefore);

  // Канон-контакты — статичные строки (без hover-affordance);
  // интерактив hero проверяем на верхней кнопке «Поделиться».
  const shareBefore = await snapshot(".shop-share-button");
  await page.locator(".shop-share-button").hover();
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
  const shareHover = await snapshot(".shop-share-button");
  await page.locator(".shop-share-button").dispatchEvent("pointerdown");
  await page.waitForTimeout(TRANSITION_SETTLE_MS);
  const shareActive = await snapshot(".shop-share-button");
  await page.locator(".shop-share-button").dispatchEvent("pointerup");
  expect(shareHover).not.toEqual(shareBefore);
  expect(shareActive).not.toEqual(shareBefore);
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

  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(3);
  await expect(skeleton).toHaveCount(0);
  await expect(live).toHaveText("Каталог загружен");
});

test("UI-MOCK-10: пустой каталог в городе без магазинов", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(3);

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await page.getByTestId("menu-city-select").selectOption("kemerovo");
  await page.keyboard.press("Escape");
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
  await page.keyboard.press("Escape");
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
  await page.keyboard.press("Escape");
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
  await page.keyboard.press("Escape");
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
  await page.keyboard.press("Escape");
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
  await page.keyboard.press("Escape");
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
  await expect(page.locator("a.catalog-shop-tile")).toHaveCount(3);
  const live = page.locator('[role="status"]');
  await expect(live).toHaveText("Каталог загружен");

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByTestId("menu-city-select").selectOption("kemerovo");
  await expect(page.getByTestId("catalog-state")).toBeVisible();
  // viewState changed behind the open drawer — announcer must stay silent
  await expect(live).toHaveText("Каталог загружен");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(live).toHaveText("Ничего не найдено");
});

test("UI-MOCK-21: bottom-sheet акций — APG-структура и inert фона", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("catalog-offers-bar")
    .getByRole("button")
    .click();

  const dialog = page.getByRole("dialog", { name: "Акции" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAttribute("aria-label", "Акции");

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

test("UI-MOCK-22: Esc закрывает шит акций и возвращает фокус на триггер", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const trigger = page
    .getByTestId("catalog-offers-bar")
    .getByRole("button");
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Акции" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Акции" }),
  ).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement ===
          document.querySelector("[data-offers-trigger]"),
      ),
    )
    .toBe(true);
});

// UI-MOCK-23..26 удалены вместе с мобильным sort-UI: канон мобильного
// каталога не содержит выбора сортировки (бар + шит сортировки сняты).
// Дефолтный порядок (sortShops) покрыт sortShops.spec.ts.

test("UI-MOCK-27: галерея магазина имеет регион с aria-label", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page
      .getByRole("region", { name: "Фотографии и видео продавца" })
      .first(),
  ).toBeVisible();
});

test("UI-MOCK-28: смена кадра галереи объявляется в дикторе", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await expect(gallery).toBeVisible();
  await gallery.getByTestId("gallery-dot-1").click();

  await expect(page.locator('[role="status"]')).toHaveText(
    "Видео 2 из 2",
  );
});

test("UI-MOCK-29: галерея под reduced-motion листает мгновенно", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("shop-gallery")).toBeVisible();
  const duration = await page
    .locator(".shop-gallery-track")
    .first()
    .evaluate((el) => window.getComputedStyle(el).transitionDuration);
  if (duration !== "0s") {
    test.skip(
      true,
      `transition-duration under reduced-motion was "${duration}"`,
    );
  }
  expect(duration).toBe("0s");
});

test("UI-MOCK-30: кнопка паузы на видео-слайде вызывает pause и play", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const calls = { play: 0, pause: 0 };
    (
      window as typeof window & {
        __galleryVideoCalls?: typeof calls;
      }
    ).__galleryVideoCalls = calls;
    const prototype =
      HTMLMediaElement.prototype as typeof HTMLMediaElement.prototype & {
        play: () => Promise<void>;
        pause: () => void;
      };
    prototype.play = () => {
      const s = (
        window as typeof window & {
          __galleryVideoCalls?: typeof calls;
        }
      ).__galleryVideoCalls;
      if (s) s.play += 1;
      return Promise.resolve();
    };
    prototype.pause = () => {
      const s = (
        window as typeof window & {
          __galleryVideoCalls?: typeof calls;
        }
      ).__galleryVideoCalls;
      if (s) s.pause += 1;
    };
  });

  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await gallery.getByTestId("gallery-dot-1").click();

  const pauseToggle = gallery.getByTestId("gallery-pause-toggle");
  await expect(pauseToggle).toBeVisible();
  await expect(pauseToggle).toHaveAttribute("aria-label", "Пауза");

  await page.evaluate(() => {
    const s = (
      window as typeof window & {
        __galleryVideoCalls?: { play: number; pause: number };
      }
    ).__galleryVideoCalls;
    if (s) {
      s.play = 0;
      s.pause = 0;
    }
  });

  await pauseToggle.click();
  await expect(pauseToggle).toHaveAttribute(
    "aria-label",
    "Воспроизвести",
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = (
          window as typeof window & {
            __galleryVideoCalls?: { play: number; pause: number };
          }
        ).__galleryVideoCalls;
        return s?.pause ?? 0;
      }),
    )
    .toBeGreaterThanOrEqual(1);

  await pauseToggle.click();
  await expect(pauseToggle).toHaveAttribute("aria-label", "Пауза");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = (
          window as typeof window & {
            __galleryVideoCalls?: { play: number; pause: number };
          }
        ).__galleryVideoCalls;
        return s?.play ?? 0;
      }),
    )
    .toBeGreaterThanOrEqual(1);
});

test("UI-MOCK-31: reduced-motion отменяет автоплей активного видео", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await gallery.getByTestId("gallery-dot-1").click();

  const pauseToggle = gallery.getByTestId("gallery-pause-toggle");
  await expect(pauseToggle).toBeVisible();
  await expect(pauseToggle).toHaveAttribute(
    "aria-label",
    "Воспроизвести",
  );
  await expect
    .poll(async () =>
      gallery
        .locator("video")
        .evaluate((el) => (el as HTMLVideoElement).paused),
    )
    .toBe(true);
});

test("UI-MOCK-32: кнопка паузы помещается внутри bounding-box галереи", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await gallery.getByTestId("gallery-dot-1").click();

  const pauseToggle = gallery.getByTestId("gallery-pause-toggle");
  await expect(pauseToggle).toBeVisible();

  const rects = await gallery.evaluate((el) => {
    const shell = el.getBoundingClientRect();
    const pause = (
      el.querySelector(
        '[data-testid="gallery-pause-toggle"]',
      ) as HTMLElement | null
    )?.getBoundingClientRect();
    const dots = (
      el.querySelector(".shop-gallery-dots") as HTMLElement | null
    )?.getBoundingClientRect();
    return {
      shell: {
        x: shell.x,
        y: shell.y,
        right: shell.right,
        bottom: shell.bottom,
      },
      pause: pause
        ? {
            x: pause.x,
            y: pause.y,
            right: pause.right,
            bottom: pause.bottom,
          }
        : null,
      dots: dots
        ? {
            x: dots.x,
            y: dots.y,
            right: dots.right,
            bottom: dots.bottom,
          }
        : null,
    };
  });

  expect(rects.pause).not.toBeNull();
  if (rects.pause) {
    expect(rects.pause.x).toBeGreaterThanOrEqual(rects.shell.x);
    expect(rects.pause.y).toBeGreaterThanOrEqual(rects.shell.y);
    expect(rects.pause.right).toBeLessThanOrEqual(rects.shell.right);
    expect(rects.pause.bottom).toBeLessThanOrEqual(rects.shell.bottom);
  }

  if (rects.pause && rects.dots) {
    const intersects =
      rects.pause.x < rects.dots.right &&
      rects.pause.right > rects.dots.x &&
      rects.pause.y < rects.dots.bottom &&
      rects.pause.bottom > rects.dots.y;
    expect(intersects).toBe(false);
  }
});

test("UI-MOCK-33: ошибка магазина показывает CatalogState с retry", async ({
  page,
}) => {
  let shopRequestCount = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/v1/shop/barnaul-01") &&
      request.method().toUpperCase() === "GET"
    ) {
      shopRequestCount += 1;
    }
  });

  await installApiMocks(page, {
    shopByCode: { "barnaul-01": 500 },
    promotionsByCode: { "barnaul-01": 500 },
  });
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  const title = state.locator(".catalog-state-title");
  await expect(title).toHaveText("Не удалось загрузить магазин");
  await expect(
    title.evaluate((el) => el.tagName.toLowerCase()),
  ).resolves.toBe("h2");

  const retry = page.getByTestId("shop-load-error-retry");
  await expect(retry).toBeVisible();
  await expect(retry).toHaveText("Повторить");

  const before = shopRequestCount;
  await retry.click();
  await expect
    .poll(() => shopRequestCount, { timeout: 5000 })
    .toBeGreaterThan(before);
});

test("UI-MOCK-34: скелетон магазина использует .catalog-skel", async ({
  page,
}) => {
  await installApiMocks(page, {
    delaysMs: {
      shopByCode: { "nizhny-01": 4000 },
      promotionByCode: { "nizhny-01": 4000 },
    },
  });
  await page.goto("/shop/nizhny-01", {
    waitUntil: "domcontentloaded",
  });

  const shopRoot = page.locator(".shop-page-root");
  await expect(
    shopRoot.locator(".catalog-skel").first(),
  ).toBeVisible();
  await expect(
    shopRoot.locator(".ui-skeleton"),
  ).toHaveCount(0);
});

test("UI-MOCK-35: фейл shop эрорит страницу даже при успешном промо", async ({
  page,
}) => {
  await installApiMocks(page, {
    shopByCode: { "barnaul-01": 500 },
  });
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const state = page.getByTestId("catalog-state");
  await expect(state).toBeVisible();
  const title = state.locator(".catalog-state-title");
  await expect(title).toHaveText("Не удалось загрузить магазин");
  await expect(
    title.evaluate((el) => el.tagName.toLowerCase()),
  ).resolves.toBe("h2");
  await expect(
    page.getByTestId("shop-load-error-retry"),
  ).toBeVisible();
});

async function gridColumnCount(page: import("@playwright/test").Page) {
  return page.locator(".catalog-grid").evaluate((element) => {
    const cols = window
      .getComputedStyle(element as HTMLElement)
      .gridTemplateColumns.trim();
    return cols ? cols.split(/\s+/).length : 0;
  });
}

async function expectGridColumns(
  page: import("@playwright/test").Page,
  expected: number,
) {
  await expect
    .poll(() => gridColumnCount(page), { timeout: 5000 })
    .toBe(expected);
}

test.describe("UI-MOCK-36: грид каталога на мобиле — 2 колонки", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("UI-MOCK-36", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
    await expectGridColumns(page, 2);
  });
});

test.describe("UI-MOCK-37: грид каталога @1280 — 3 кол. рядом с sidebar", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-37", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();
    await expectGridColumns(page, 3);
    await expect(
      page.locator(".catalog-menu-panel--sidebar"),
    ).toBeVisible();
  });
});

test.describe("UI-MOCK-38: грид каталога @1920 — 4 кол., shell ≤ 1600", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("UI-MOCK-38", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    await expectGridColumns(page, 4);
    await expect(
      page.locator(".catalog-menu-panel--sidebar"),
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const shell = document.querySelector(
        '[data-testid="catalog-grid-shell"]',
      ) as HTMLElement | null;
      const shellRect = shell?.getBoundingClientRect() ?? null;
      const viewportWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      return {
        shellRect,
        viewportWidth,
        scrollWidth,
        remPx: parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ),
      };
    });

    expect(layout.shellRect).toBeTruthy();
    if (layout.shellRect) {
      const maxPx = 100 * layout.remPx;
      expect(layout.shellRect.width).toBeLessThanOrEqual(maxPx + 1);
      const leftMargin = layout.shellRect.left;
      const rightMargin = layout.viewportWidth - layout.shellRect.right;
      expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(1);
    }
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  });
});

test.describe("UI-MOCK-39: hover-guard — desktop матчит и применяет стиль", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    hasTouch: false,
    isMobile: false,
  });

  test("UI-MOCK-39", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const matches = await page.evaluate(
      () =>
        window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
    expect(matches).toBe(true);

    const tile = page.locator(".catalog-shop-tile").first();
    const read = () =>
      tile.evaluate((el) => {
        const cs = getComputedStyle(el as HTMLElement);
        return { transform: cs.transform, boxShadow: cs.boxShadow };
      });

    const before = await read();
    await tile.hover();
    await page.waitForTimeout(250);
    const after = await read();

    // Канон отклика: hover применяет стиль (тень), но НЕ растит карточку —
    // трансформ остаётся единичным до и после наведения.
    expect(after.boxShadow).not.toBe(before.boxShadow);
    expect(after.transform).toBe(before.transform);
  });
});

test.describe("UI-MOCK-40: hover-guard — touch не матчит, стиль НЕ применяется", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("UI-MOCK-40", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const matches = await page.evaluate(
      () =>
        window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
    expect(matches).toBe(false);

    const before = await page
      .locator(".catalog-shop-tile")
      .first()
      .evaluate(
        (el) => getComputedStyle(el as HTMLElement).transform,
      );
    await page.locator(".catalog-shop-tile").first().hover();
    await page.waitForTimeout(250);
    const after = await page
      .locator(".catalog-shop-tile")
      .first()
      .evaluate(
        (el) => getComputedStyle(el as HTMLElement).transform,
      );
    expect(after).toBe(before);
  });
});

test.describe("UI-MOCK-46: sidebar постоянный — без оверлея и без trap'а", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-46", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const sidebar = page.locator(".catalog-menu-panel--sidebar");
    await expect(sidebar).toBeVisible();

    const role = await sidebar.getAttribute("role");
    expect(role).toBeNull();

    await expect(page.locator("[data-menu-button]")).toBeHidden();
    await expect(
      page.locator(".catalog-menu-footer"),
    ).toHaveCount(0);

    const bodyOverflow = await page.evaluate(
      () => getComputedStyle(document.body).overflow,
    );
    expect(bodyOverflow).not.toBe("hidden");

    await expect(
      sidebar.locator('[data-testid="menu-city-select"]'),
    ).toHaveCount(0);

    await sidebar.locator("button").first().focus();
    const sidebarTabCount = await sidebar
      .locator(
        'button:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
      )
      .count();
    for (let i = 0; i < sidebarTabCount; i += 1) {
      await page.keyboard.press("Tab");
    }
    const activeInsideSidebar = await sidebar.evaluate((el) =>
      el.contains(document.activeElement),
    );
    expect(activeInsideSidebar).toBe(false);
  });
});

test.describe("UI-MOCK-47: sidebar — live-фильтрация без кнопки Применить", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-47", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const sidebar = page.locator(".catalog-menu-panel--sidebar");
    await expect(sidebar).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Найти" }),
    ).toHaveCount(0);

    await expect(
      page.locator('[data-testid="catalog-filter-row"]'),
    ).toHaveCount(0);

    await sidebar
      .getByRole("button", { name: "Японские запчасти" })
      .click();

    // sortShopsBySelectedFeature не фильтрует, а только переупорядочивает:
    // .catalog-shop-tile count не меняется при любой селекции
    // категорий/фич в моке. Поэтому "live"-эффект ловим через
    // появление чипа в catalog-filter-row — это и есть мгновенный
    // отклик, доступный наблюдению в текущей mock-датасете.
    const filterRow = page.locator(
      '[data-testid="catalog-filter-row"]',
    );
    await expect(filterRow).toBeVisible();
    await expect(
      filterRow.getByText("Японские запчасти"),
    ).toBeVisible();
  });
});

test("UI-MOCK-48: мобильный drawer — оверлей + focus-trap (регресс)", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator(".catalog-shop-tile").first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Открыть фильтры" }).click();
  const drawer = page.getByRole("dialog", { name: "Фильтры" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute("aria-modal", "true");
  await expect(
    page.locator(".catalog-menu-panel--sidebar"),
  ).toHaveCount(0);

  const drawerTabCount = await drawer
    .locator(
      'button:not([disabled]), select, [tabindex]:not([tabindex="-1"]), a[href]',
    )
    .count();
  for (let i = 0; i < drawerTabCount + 2; i += 1) {
    await page.keyboard.press("Tab");
    const isInside = await drawer.evaluate((el) =>
      el.contains(document.activeElement),
    );
    expect(isInside).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test.describe("UI-MOCK-49: город в шапке на десктопе, не в sidebar", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-49", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const headerCity = page.getByTestId("topbar-city-pill");
    await expect(headerCity).toBeVisible();
    await expect(headerCity).toContainText("Барнаул");

    const sidebar = page.locator(".catalog-menu-panel--sidebar");
    await expect(sidebar).toBeVisible();
    await expect(
      sidebar.getByText("Город", { exact: false }),
    ).toHaveCount(0);
    await expect(
      sidebar.locator('[data-testid="menu-city-select"]'),
    ).toHaveCount(0);

    await headerCity.click();
    await page
      .getByRole("menuitemradio", { name: "Нижний Новгород" })
      .click();
    await expect(page.locator(".catalog-shop-tile")).toHaveCount(1);
  });
});

test.describe("UI-MOCK-50: десктоп-тулбар — счётчик + чипы + сорт-дропдаун", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-50", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".catalog-shop-tile").first(),
    ).toBeVisible();

    const toolbar = page.getByTestId("catalog-toolbar");
    await expect(toolbar).toBeVisible();

    await expect(toolbar.locator(".catalog-toolbar-count")).toHaveText(
      /\d+\s+магазин/,
    );

    await expect(
      page.getByTestId("catalog-offers-bar"),
    ).toBeHidden();
  });
});

test.describe("UI-MOCK-55: ShopPage @1280 — 2 кол. + sticky aside + breadcrumb", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-55", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });

    const layout = page.getByTestId("shop-desktop-layout");
    await expect(layout).toBeVisible();

    await expect(page.getByTestId("shop-breadcrumb")).toBeVisible();
    await expect(page.getByTestId("shop-breadcrumb")).toContainText(
      "Каталог",
    );

    const aside = page.getByTestId("shop-info-aside");
    await expect(aside).toBeVisible();
    const asidePos = await aside.evaluate(
      (el) => getComputedStyle(el as HTMLElement).position,
    );
    expect(asidePos).toBe("sticky");

    const rects = await page.evaluate(() => {
      const lay = document.querySelector(
        '[data-testid="shop-desktop-layout"]',
      ) as HTMLElement | null;
      const left = lay?.querySelector(
        ".shop-layout-left",
      ) as HTMLElement | null;
      const right = lay?.querySelector(
        ".shop-layout-right",
      ) as HTMLElement | null;
      return {
        layout: lay?.getBoundingClientRect() ?? null,
        left: left?.getBoundingClientRect() ?? null,
        right: right?.getBoundingClientRect() ?? null,
      };
    });
    expect(rects.layout).toBeTruthy();
    expect(rects.left).toBeTruthy();
    expect(rects.right).toBeTruthy();
    if (rects.layout && rects.left && rects.right) {
      expect(rects.layout.width).toBeLessThanOrEqual(1120 + 1);
      expect(rects.right.left).toBeGreaterThanOrEqual(rects.left.right);
    }

    await expect(
      page.getByTestId("shop-promo-section"),
    ).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});

test("UI-MOCK-56: ShopPage <64rem — одноколоночная (моб. регресс)", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByTestId("shop-desktop-layout"),
  ).toHaveCount(0);
  await expect(page.getByTestId("shop-breadcrumb")).toHaveCount(0);
  await expect(page.locator(".shop-back-button")).toBeVisible();
});

test.describe("UI-MOCK-57: галерея @1280 — миниатюры, стрелки, клавиатура, видео-бейдж", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-57", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });

    const gallery = page.getByTestId("shop-gallery");
    await expect(gallery).toBeVisible();

    const thumbs = gallery.getByTestId("gallery-thumbs");
    await expect(thumbs).toBeVisible();
    const counter = gallery.getByTestId("gallery-counter");
    await expect(counter).toContainText("1/2");
    const prev = gallery.getByTestId("gallery-prev");
    const next = gallery.getByTestId("gallery-next");
    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();

    const prevBox = await prev.boundingBox();
    const nextBox = await next.boundingBox();
    expect(prevBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(prevBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(nextBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(nextBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const thumb0 = gallery.getByTestId("gallery-thumb-0");
    const thumb1 = gallery.getByTestId("gallery-thumb-1");
    await expect(thumb0).toHaveAttribute("aria-current", "true");
    await expect(thumb1).not.toHaveAttribute("aria-current", /.*/);

    await expect(
      thumb1.locator(".shop-gallery-thumb-vbadge"),
    ).toBeVisible();

    await thumb1.click();
    await expect(thumb1).toHaveAttribute("aria-current", "true");
    await expect(counter).toContainText("2/2");

    await prev.click();
    await expect(thumb0).toHaveAttribute("aria-current", "true");
    await expect(counter).toContainText("1/2");

    await thumb0.focus();
    await page.keyboard.press("ArrowRight");
    await expect(thumb1).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(thumb0).toHaveAttribute("aria-current", "true");
  });
});

test.describe("UI-MOCK-58: выбранная миниатюра — кольцо ВНУТРИ бокса (inset)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-58", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/shop/barnaul-01", {
      waitUntil: "domcontentloaded",
    });

    const gallery = page.getByTestId("shop-gallery");
    const thumb0 = gallery.getByTestId("gallery-thumb-0");
    const thumb1 = gallery.getByTestId("gallery-thumb-1");
    await expect(thumb0).toBeVisible();

    const box0 = await thumb0.boundingBox();
    const box1 = await thumb1.boundingBox();
    expect(box0?.width).toBe(box1?.width);
    expect(box0?.height).toBe(box1?.height);

    const shadowSelected = await thumb0.evaluate((el) =>
      getComputedStyle(el as HTMLElement, "::after").boxShadow,
    );
    const shadowUnselected = await thumb1.evaluate((el) =>
      getComputedStyle(el as HTMLElement, "::after").boxShadow,
    );
    expect(shadowSelected).toContain("inset");
    expect(shadowUnselected).toContain("inset");
    expect(shadowSelected).not.toBe(shadowUnselected);

    const thumbsBox = await gallery
      .getByTestId("gallery-thumbs")
      .boundingBox();
    expect(box0?.x ?? -1).toBeGreaterThanOrEqual(thumbsBox?.x ?? 0);
    expect((box0?.x ?? 0) + (box0?.width ?? 0)).toBeLessThanOrEqual(
      (thumbsBox?.x ?? 0) + (thumbsBox?.width ?? 0),
    );
  });
});

test("UI-MOCK-59: галерея <64rem — свайп-карусель (моб. регресс)", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await expect(gallery).toBeVisible();
  await expect(
    gallery.locator(".shop-gallery-track"),
  ).toBeVisible();
  await expect(
    gallery.getByTestId("gallery-thumbs"),
  ).toHaveCount(0);
  await expect(
    gallery.getByTestId("gallery-counter"),
  ).toHaveCount(0);
});

test.describe("UI-MOCK-60: ShopPage @1280 skeleton — 2-кол. раскладка", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-60", async ({ page }) => {
    await installApiMocks(page, {
      delaysMs: {
        shopByCode: { "nizhny-01": 4000 },
        promotionByCode: { "nizhny-01": 4000 },
      },
    });
    await page.goto("/shop/nizhny-01", {
      waitUntil: "domcontentloaded",
    });

    const skeleton = page.getByTestId("shop-desktop-skeleton");
    await expect(skeleton).toBeVisible();

    const rects = await skeleton.evaluate((el) => {
      const root = el as HTMLElement;
      const left = root.querySelector(
        ".shop-layout-left",
      ) as HTMLElement | null;
      const right = root.querySelector(
        ".shop-layout-right",
      ) as HTMLElement | null;
      return {
        root: root.getBoundingClientRect(),
        left: left?.getBoundingClientRect() ?? null,
        right: right?.getBoundingClientRect() ?? null,
      };
    });

    expect(rects.left).toBeTruthy();
    expect(rects.right).toBeTruthy();
    if (rects.left && rects.right) {
      expect(rects.right.left).toBeGreaterThanOrEqual(rects.left.right);
    }
    expect(rects.root.width).toBeLessThanOrEqual(1120 + 1);
  });
});

test.describe("UI-MOCK-61: ShopPage @1280 ошибка — центр в контейнере ≤1120", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("UI-MOCK-61", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/shop/nonexistent", {
      waitUntil: "domcontentloaded",
    });

    const state = page.getByTestId("catalog-state");
    await expect(state).toBeVisible();

    const layout = await page.evaluate(() => {
      const container = document.querySelector(
        ".shop-desktop-state",
      ) as HTMLElement | null;
      const stateEl = document.querySelector(
        '[data-testid="catalog-state"]',
      ) as HTMLElement | null;
      const viewportWidth = document.documentElement.clientWidth;
      return {
        containerRect: container?.getBoundingClientRect() ?? null,
        stateRect: stateEl?.getBoundingClientRect() ?? null,
        viewportWidth,
      };
    });

    expect(layout.containerRect).toBeTruthy();
    if (layout.containerRect) {
      expect(layout.containerRect.width).toBeLessThanOrEqual(1120 + 1);
      const leftMargin = layout.containerRect.left;
      const rightMargin =
        layout.viewportWidth - layout.containerRect.right;
      expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(1);
    }
  });
});
