import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Карточка магазина под канон (mobile @390, _prototype/shop-card.jsx).

test("CARD-CONTACTS-01: контент-секция = phone/address, без tg/wa и навигатора", async ({
  page,
}) => {
  // barnaul-01: phone×2, address×1, whatsapp×1 (wa должен уйти из секции).
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const contacts = page.getByTestId("shop-contacts");
  await expect(contacts).toBeVisible();

  // Телефон и адрес присутствуют (навигационные ссылки сохранены).
  await expect(contacts.locator('a[href^="tel:"]')).toHaveCount(2);
  await expect(
    contacts.getByTestId("shop-contact-address"),
  ).toHaveCount(1);

  // Telegram/WhatsApp и кнопка навигатора убраны из контент-секции.
  await expect(contacts.locator('a[href*="t.me"]')).toHaveCount(0);
  await expect(contacts.locator('a[href*="wa.me"]')).toHaveCount(0);
  await expect(
    page.getByTestId("shop-contact-open-navi"),
  ).toHaveCount(0);

  // Ссылки контактов без подчёркивания.
  const decoration = await contacts
    .locator(".shop-contact-row")
    .first()
    .evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toBe("none");
});

test("CARD-HERO-01: слайды object-cover; верхний share присутствует", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const gallery = page.getByTestId("shop-gallery");
  await expect(gallery).toBeVisible();

  const imgFit = await gallery
    .locator("img")
    .first()
    .evaluate((el) => getComputedStyle(el).objectFit);
  expect(imgFit).toBe("cover");

  const videoFit = await gallery
    .locator("video")
    .first()
    .evaluate((el) => getComputedStyle(el).objectFit);
  expect(videoFit).toBe("cover");

  // Верхняя кнопка «Поделиться» в hero.
  const heroShare = page
    .locator(".shop-hero")
    .getByRole("button", { name: "Поделиться" });
  await expect(heroShare).toBeVisible();
});
