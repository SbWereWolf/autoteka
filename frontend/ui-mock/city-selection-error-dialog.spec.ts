import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

const ERROR_MESSAGE =
  "Определить город для загрузки списка магазинов не удалось";

test("ошибка выбора города показывается нативным dialog по центру экрана", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await installApiMocks(page, { cities: [] });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const dialog = page.getByRole("dialog", {
    name: "Ошибка выбора города",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(ERROR_MESSAGE);
  expect(
    await dialog.evaluate((element) => element.matches(":modal")),
  ).toBe(true);

  const position = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      viewportCenterX: window.innerWidth / 2,
      viewportCenterY: window.innerHeight / 2,
    };
  });

  expect(
    Math.abs(position.centerX - position.viewportCenterX),
  ).toBeLessThan(2);
  expect(
    Math.abs(position.centerY - position.viewportCenterY),
  ).toBeLessThan(2);

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("при успешном выборе города dialog отсутствует", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("autoteka_city", JSON.stringify("barnaul"));
  });
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("dialog", { name: "Ошибка выбора города" }),
  ).toHaveCount(0);
});

const unrelatedReferenceFailures = [
  {
    title: "ошибка списка категорий",
    scenario: { categoryListStatus: 500 as const },
  },
  {
    title: "ошибка списка особенностей",
    scenario: { featureListStatus: 500 as const },
  },
];

for (const item of unrelatedReferenceFailures) {
  test(`${item.title} не показывается как ошибка выбора города`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("autoteka_city", JSON.stringify("barnaul"));
    });
    await installApiMocks(page, item.scenario);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#app .app")).toBeVisible();

    const dialog = page.locator("dialog.city-selection-error-dialog");
    await expect(dialog).not.toBeVisible();
    expect(
      await dialog.evaluate((element) => element.matches(":modal")),
    ).toBe(false);
  });
}

test("ошибка загрузки городов не оставляет необработанный rejection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const runtimeWindow = window as typeof window & {
      __unhandledRejections: string[];
    };
    runtimeWindow.__unhandledRejections = [];
    window.addEventListener("unhandledrejection", (event) => {
      runtimeWindow.__unhandledRejections.push(String(event.reason));
    });
    localStorage.clear();
  });

  await installApiMocks(page, { cityListStatus: 500 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#app .app")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Ошибка выбора города" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __unhandledRejections: string[];
            }
          ).__unhandledRejections,
      ),
    )
    .toEqual([]);
});
