import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Нижний action-бар карточки магазина (mobile-only, viewport 390 из конфига).
// Happy-path магазин barnaul-01 имеет phone + whatsapp + address + site,
// но НЕ имеет telegram — поэтому telegram-иконка естественно скрыта.

test("ACTIONBAR-01: бар присутствует, контактные действие отрисованы по primary-маппингу", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const bar = page.locator(".shop-actionbar");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute(
    "aria-label",
    "Связаться с магазином",
  );

  // Бар вложен в <main>, поэтому <footer> не даёт contentinfo-лендмарк —
  // role="group" гарантирует, что доступное имя реально экспонируется AT.
  await expect(
    page.getByRole("group", { name: "Связаться с магазином" }),
  ).toBeVisible();

  // Маршрут — кнопка (действие), магазин имеет address.
  const route = page.getByTestId("shop-actionbar-route");
  await expect(route).toBeVisible();
  await expect(route).toHaveText("Маршрут");

  // Телефон — ссылка (навигация) tel:
  const phone = page.getByTestId("shop-actionbar-phone");
  await expect(phone).toBeVisible();
  await expect(phone).toHaveAttribute("href", /^tel:/);

  // WhatsApp присутствует (есть в фикстуре barnaul-01).
  await expect(page.getByTestId("shop-actionbar-whatsapp")).toBeVisible();

  // Сайт присутствует (siteUrl у barnaul-01 непустой).
  await expect(page.getByTestId("shop-actionbar-site")).toBeVisible();

  // Поделиться — кнопка (действие), всегда видна.
  const share = page.getByTestId("shop-actionbar-share");
  await expect(share).toBeVisible();
  await expect(share).toHaveAttribute("aria-label", "Поделиться");

  // Таргеты ≥44×44 (телефон-ссылка и share-кнопка).
  const phoneBox = await phone.boundingBox();
  const shareBox = await share.boundingBox();
  expect(phoneBox).toBeTruthy();
  expect(shareBox).toBeTruthy();
  if (phoneBox) {
    expect(phoneBox.height).toBeGreaterThanOrEqual(44);
    expect(phoneBox.width).toBeGreaterThanOrEqual(44);
  }
  if (shareBox) {
    expect(shareBox.height).toBeGreaterThanOrEqual(44);
    expect(shareBox.width).toBeGreaterThanOrEqual(44);
  }
});

test("ACTIONBAR-02: отсутствующий тип контакта скрывает свою иконку", async ({
  page,
}) => {
  // barnaul-02: есть phone + address + site, но НЕТ telegram и whatsapp.
  await installApiMocks(page);
  await page.goto("/shop/barnaul-02", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator(".shop-actionbar")).toBeVisible();

  // Присутствующие действия.
  await expect(page.getByTestId("shop-actionbar-route")).toBeVisible();
  await expect(page.getByTestId("shop-actionbar-phone")).toBeVisible();
  await expect(page.getByTestId("shop-actionbar-site")).toBeVisible();
  await expect(page.getByTestId("shop-actionbar-share")).toBeVisible();

  // Отсутствующие типы — иконки скрыты (не отрисованы).
  await expect(page.getByTestId("shop-actionbar-whatsapp")).toHaveCount(0);
  await expect(page.getByTestId("shop-actionbar-telegram")).toHaveCount(0);
});
