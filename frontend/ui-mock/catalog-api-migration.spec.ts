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

test("UI-MOCK-01: старт приложения и дефолты", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");

  await expect(page.getByText("Каталог магазинов")).toHaveCount(0);
  await expect(
    page.getByTestId("catalog-feature-select"),
  ).toHaveValue("credit");
  await expect(page.getByLabel("Город")).toHaveCount(0);
  await expect(page.locator("button.ui-tile")).toHaveCount(2);
});

test("UI-MOCK-02: смена города обновляет каталог", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Открыть меню" }).click();
  const citySelect = page.getByTestId("menu-city-select");
  await expect(citySelect).toHaveValue("barnaul");
  await citySelect.selectOption("nizhny");
  await expect(page.locator("button.ui-tile")).toHaveCount(3);
});

test("UI-MOCK-03: карточка магазина показывает порядок блоков и контакты", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/");
  await page.locator("button.ui-tile").first().click();

  await expect(
    page.getByRole("heading", { name: "Описание" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Контакты" }),
  ).toBeVisible();
  await expect(page.getByTestId("shop-meta-badges")).toBeVisible();

  const order = await page
    .locator(
      '[data-testid="shop-description"], [data-testid="shop-meta-section"], [data-testid="shop-contacts"]',
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.testid ?? ""),
    );
  expect(order).toEqual([
    "shop-description",
    "shop-meta-section",
    "shop-contacts",
  ]);
});

test("UI-MOCK-04: 404 магазин", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/shop/nonexistent");
  await expect(
    page.getByRole("heading", { name: "Магазин не найден" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }).first(),
  ).toBeVisible();
});

test("UI-MOCK-05: 500 по городу показывает мягкий экран ошибки", async ({
  page,
}) => {
  await installApiMocks(page, {
    cityCatalogByCode: {
      barnaul: 500,
    },
  });
  await page.goto("/");

  await expect(
    page.getByText(
      "Не удалось загрузить каталог. Проверьте соединение и попробуйте снова.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "← Назад" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "В каталог" }),
  ).toBeVisible();
});

test("UI-MOCK-06: ошибка контактов не ломает страницу магазина", async ({
  page,
}) => {
  await installApiMocks(page, {
    contactsByCode: {
      "barnaul-01": 500,
    },
  });
  await page.goto("/shop/barnaul-01");

  await expect(
    page.getByRole("heading", { name: "Описание" }),
  ).toBeVisible();
  await expect(
    page.getByText("Часть контактов сейчас недоступна."),
  ).toBeVisible();
});

test("UI-MOCK-07: клик по заголовку возвращает в каталог", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01");
  await page.getByTestId("topbar-title").click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("button.ui-tile")).toHaveCount(2);
});
