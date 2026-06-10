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

  // Телефон и адрес присутствуют как текст (ссылки — в action-баре).
  await expect(
    contacts.getByTestId("shop-contact-phone"),
  ).toHaveCount(2);
  await expect(
    contacts.getByTestId("shop-contact-address"),
  ).toHaveCount(1);

  // Контент-строки — не ссылки (нет <a>).
  await expect(contacts.locator("a")).toHaveCount(0);

  // Telegram/WhatsApp и кнопка навигатора в контент-секции отсутствуют.
  await expect(
    contacts.getByTestId("shop-contact-telegram"),
  ).toHaveCount(0);
  await expect(
    contacts.getByTestId("shop-contact-whatsapp"),
  ).toHaveCount(0);
  await expect(
    page.getByTestId("shop-contact-open-navi"),
  ).toHaveCount(0);

  // Контакт-строки без подчёркивания.
  const decoration = await contacts
    .locator(".shop-contact-row")
    .first()
    .evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toBe("none");
});

test("CARD-CONTACTS-MAIL-GLYPH: email-строка = канон-глиф mail @390", async ({
  page,
}) => {
  // barnaul-01: добавлен email-контакт → строка shop-contact-email
  // рисует канон-глиф Claude Design (d начинается с «M20 4C21.1»).
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const email = page
    .getByTestId("shop-contacts")
    .getByTestId("shop-contact-email");
  await expect(email).toHaveCount(1);

  const d = await email
    .locator("path")
    .first()
    .getAttribute("d");
  expect(d).not.toBeNull();
  expect(d?.startsWith("M20 4C21.1")).toBe(true);
});

test("CARD-SLOGAN-DEDUP: слоган скрыт при совпадении с названием @390", async ({
  page,
}) => {
  // mediatest-slogan: slogan === title → shop-slogan не рендерится.
  await installApiMocks(page);
  await page.goto("/shop/mediatest-slogan", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("shop-name")).toHaveText("Slogan Echo");
  await expect(page.getByTestId("shop-slogan")).toHaveCount(0);
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

// Back-кнопка hero: focus-visible кольцо (.ix-onimg-рецепт) не срезается
// overflow:hidden у .shop-hero — инсет 8px ≥ ширины кольца 4px.
test("CARD-BACK-RING: focus-кольцо back не срезано @390", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const back = page.locator(".shop-back-button");
  await expect(back).toBeVisible();

  const shadow = await back.evaluate((el) => {
    (el as HTMLElement).focus();
    return getComputedStyle(el).boxShadow;
  });
  expect(shadow).not.toBe("none");

  // Кольцо 4px должно помещаться внутри clip-области .shop-hero.
  const RING = 4;
  const btn = await back.boundingBox();
  const hero = await page.locator(".shop-hero").boundingBox();
  expect(btn).toBeTruthy();
  expect(hero).toBeTruthy();
  if (btn && hero) {
    expect(btn.x - hero.x).toBeGreaterThanOrEqual(RING);
    expect(btn.y - hero.y).toBeGreaterThanOrEqual(RING);
  }
});
