import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Зона D — мобильный канон-аудит (@390 из конфига).

// Кэп высоты лого = .catalog-shop-tile-media { max-height } в tailwind.css.
const LOGO_CAP_PX = 96; // 6rem

test("D1: лого тайла упирается в кэп 96px, центрировано и не растянуто на зону", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // barnaul-01 имеет thumbUrl → рендерится .catalog-shop-tile-media.
  // Фикстура квадратная 512x512 (mockApi отдаёт размер из имени файла):
  // на вырожденном 1x1 проверка кэпа проходила бы при любом значении.
  const tile = page.locator('a.catalog-shop-tile[href$="/shop/barnaul-01"]');
  const zone = tile.locator(".catalog-shop-tile-logo");
  const media = tile.locator(".catalog-shop-tile-media");

  const zoneBox = await zone.boundingBox();
  const mediaBox = await media.boundingBox();
  expect(zoneBox).toBeTruthy();
  expect(mediaBox).toBeTruthy();
  if (zoneBox && mediaBox) {
    // Гард на вырожденную фикстуру: квадрат должен быть квадратом.
    expect(mediaBox.width).toBeGreaterThan(1);
    expect(Math.abs(mediaBox.width - mediaBox.height)).toBeLessThanOrEqual(1);
    // Containment в зону лого (с допуском 1px).
    expect(mediaBox.x).toBeGreaterThanOrEqual(zoneBox.x - 1);
    expect(mediaBox.y).toBeGreaterThanOrEqual(zoneBox.y - 1);
    expect(mediaBox.x + mediaBox.width).toBeLessThanOrEqual(
      zoneBox.x + zoneBox.width + 1,
    );
    expect(mediaBox.y + mediaBox.height).toBeLessThanOrEqual(
      zoneBox.y + zoneBox.height + 1,
    );
    // Квадрат шире кэпа упирается в него ровно: не выше и не ниже.
    // Зона по высоте больше кэпа, поэтому ограничивает именно max-height.
    expect(mediaBox.height).toBeGreaterThanOrEqual(LOGO_CAP_PX - 1);
    expect(mediaBox.height).toBeLessThanOrEqual(LOGO_CAP_PX + 1);
    // И лого не растянуто на всю высокую flex:1-зону.
    expect(mediaBox.height).toBeLessThan(zoneBox.height);
    // Центрировано по вертикали в зоне (допуск 2px).
    const mediaCy = mediaBox.y + mediaBox.height / 2;
    const zoneCy = zoneBox.y + zoneBox.height / 2;
    expect(Math.abs(mediaCy - zoneCy)).toBeLessThanOrEqual(2);
    // Горизонтально центрировано в зоне (допуск 1px).
    const mediaCx = mediaBox.x + mediaBox.width / 2;
    const zoneCx = zoneBox.x + zoneBox.width / 2;
    expect(Math.abs(mediaCx - zoneCx)).toBeLessThanOrEqual(1);
  }
});

test("D2: clear-all — круглый таргет ≥44px с aria-label", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "autoteka_categories",
      JSON.stringify(["domestic", "korean"]),
    );
  });
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const clear = page.getByRole("button", {
    name: "Очистить все фильтры",
  });
  await expect(clear).toBeVisible();
  const box = await clear.boundingBox();
  expect(box).toBeTruthy();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  // Канон-чип — удаляемый токен с aria-label.
  const chip = page
    .locator(".catalog-filter-chip-btn")
    .first();
  await expect(chip).toHaveAttribute("aria-label", /Удалить фильтр:/);

  // focus-visible кольцо у чипа и clear-all (канон .ix-chip/.fclear).
  const chipShadow = await chip.evaluate((el) => {
    (el as HTMLElement).focus();
    return getComputedStyle(el).boxShadow;
  });
  expect(chipShadow).not.toBe("none");
  const clearShadow = await clear.evaluate((el) => {
    (el as HTMLElement).focus();
    return getComputedStyle(el).boxShadow;
  });
  expect(clearShadow).not.toBe("none");
});

test("D3: каталог-шелл изолирован, паттерн-правило присутствует", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const shell = page.locator(".app-catalog-shell");
  await expect(shell).toBeVisible();

  const isolation = await shell.evaluate(
    (el) => getComputedStyle(el).isolation,
  );
  expect(isolation).toBe("isolate");

  // Псевдо ::before напрямую не проверить — фиксируем background-image правила.
  const bgImage = await shell.evaluate(
    (el) => getComputedStyle(el, "::before").backgroundImage,
  );
  expect(bgImage).toContain("catalog-pattern");
});
