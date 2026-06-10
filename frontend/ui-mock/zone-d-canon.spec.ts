import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

// Зона D — мобильный канон-аудит (@390 из конфига).

test("D1: лого тайла заполняет 58px-зону и центрировано", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // barnaul-01 имеет thumbUrl → рендерится .catalog-shop-tile-media.
  const tile = page.locator('a.catalog-shop-tile[href$="/shop/barnaul-01"]');
  const zone = tile.locator(".catalog-shop-tile-logo");
  const media = tile.locator(".catalog-shop-tile-media");

  const zoneBox = await zone.boundingBox();
  const mediaBox = await media.boundingBox();
  expect(zoneBox).toBeTruthy();
  expect(mediaBox).toBeTruthy();
  if (zoneBox && mediaBox) {
    // Containment в 58px-зону (с допуском 1px).
    expect(mediaBox.x).toBeGreaterThanOrEqual(zoneBox.x - 1);
    expect(mediaBox.y).toBeGreaterThanOrEqual(zoneBox.y - 1);
    expect(mediaBox.x + mediaBox.width).toBeLessThanOrEqual(
      zoneBox.x + zoneBox.width + 1,
    );
    expect(mediaBox.y + mediaBox.height).toBeLessThanOrEqual(
      zoneBox.y + zoneBox.height + 1,
    );
    // Заполняет зону по высоте (не усохло до интринсик-размера).
    expect(mediaBox.height).toBeGreaterThanOrEqual(zoneBox.height - 2);
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
