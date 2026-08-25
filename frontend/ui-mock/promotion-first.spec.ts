import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("PROMO-01: promo и shop стартуют параллельно, а contacts ждут shop", async ({
  page,
}) => {
  const requestTimes: Record<string, number> = {};

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/v1/shop/barnaul-01/promotion")) {
      requestTimes.promotion = Date.now();
    }
    if (url.endsWith("/api/v1/shop/barnaul-01")) {
      requestTimes.shop = Date.now();
    }
    if (url.includes("/acceptable-contact-types")) {
      requestTimes.contacts = Date.now();
    }
  });

  await installApiMocks(page, {
    delaysMs: {
      promotionByCode: {
        "barnaul-01": 1000,
      },
      shopByCode: {
        "barnaul-01": 1000,
      },
    },
  });

  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect
    .poll(() => Boolean(requestTimes.promotion), {
      timeout: 1500,
    })
    .toBe(true);
  await expect
    .poll(() => Boolean(requestTimes.shop), {
      timeout: 1500,
    })
    .toBe(true);

  expect(Math.abs(requestTimes.promotion - requestTimes.shop)).toBeLessThan(
    200,
  );
  expect(requestTimes.contacts).toBeUndefined();
});

test("PROMO-02: promo-first partial render keeps promo visible while shop is loading", async ({
  page,
}) => {
  await installApiMocks(page, {
    delaysMs: {
      promotionByCode: {
        "barnaul-01": 50,
      },
      shopByCode: {
        "barnaul-01": 1500,
      },
    },
  });

  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("shop-promo-section")).toBeVisible();
  await expect(page.locator(".shop-loading-back-skeleton")).toBeVisible();
});

test("PROMO-03: несколько акций идут одна под другой, а text-only не рисует пустую галерею", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const promoCards = page.getByTestId("shop-promo-card");
  await expect(promoCards).toHaveCount(2);

  const firstCard = promoCards.first();
  const secondCard = promoCards.nth(1);
  const hero = page.locator(".shop-hero");

  await expect(firstCard).toContainText("Летняя распродажа");
  await expect(firstCard.locator(".shop-gallery-shell")).toBeVisible();
  await expect(secondCard).toContainText("Текстовая акция");
  await expect(secondCard.locator(".shop-gallery-shell")).toHaveCount(0);
  await expect(hero.getByTestId("shop-promo-section")).toHaveCount(0);

  // Канон Step 9: промо ниже контента (под hero), не над галереей.
  const sectionBox = await page
    .getByTestId("shop-promo-section")
    .boundingBox();
  const heroBox = await hero.boundingBox();

  expect(sectionBox).toBeTruthy();
  expect(heroBox).toBeTruthy();
  if (sectionBox && heroBox) {
    expect(sectionBox.y).toBeGreaterThanOrEqual(
      heroBox.y + heroBox.height - 1,
    );
  }
});

test("PROMO-04: empty promo list does not render a block and later shop error is not user-visible after promo", async ({
  page,
}) => {
  await installApiMocks(page, {
    shopByCode: {
      "nizhny-01": 500,
    },
  });

  await page.goto("/shop/nizhny-01", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("shop-promo-section")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Магазин не найден" }))
    .toHaveCount(0);
  await expect(page.getByText("Не удалось загрузить магазин. Попробуйте ещё раз."))
    .toHaveCount(0);
});
