import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("TC-UI-CLERK-MEDIA-005: audio toggle is shared across page videos until reload", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const heroGallery = page.getByTestId("shop-gallery");
  const promoGallery = page.getByTestId("shop-promo-card").first();

  // Точки — неинтерактивные индикаторы (канон ms-dot), кадр листаем
  // стрелками: фокус на кнопке активного кадра, keydown всплывает до корня.
  await heroGallery.getByTestId("gallery-frame-open-0").focus();
  await page.keyboard.press("ArrowRight");
  const heroAudioToggle = heroGallery.getByTestId("gallery-audio-toggle");
  await expect(heroAudioToggle).toBeVisible();
  const heroFooterLayout = await heroGallery.evaluate(() => {
    const audioToggle = document.querySelector(
      '[data-testid="gallery-audio-toggle"]',
    ) as HTMLElement | null;
    const dots = document.querySelector(".shop-gallery-dots") as HTMLElement | null;
    const audioRect = audioToggle?.getBoundingClientRect() ?? null;
    const dotsRect = dots?.getBoundingClientRect() ?? null;

    return {
      audioRect,
      dotsRect,
      gap:
        audioRect && dotsRect ? dotsRect.left - audioRect.right : null,
      halfWidth:
        audioRect ? audioRect.width / 2 : null,
    };
  });
  expect(heroFooterLayout.audioRect).toBeTruthy();
  expect(heroFooterLayout.dotsRect).toBeTruthy();
  expect(heroFooterLayout.gap).not.toBeNull();
  expect(heroFooterLayout.gap).toBeGreaterThan(0);
  if (
    heroFooterLayout.gap !== null &&
    heroFooterLayout.halfWidth !== null
  ) {
    expect(
      Math.abs(heroFooterLayout.gap - heroFooterLayout.halfWidth),
    ).toBeLessThanOrEqual(12);
  }
  await expect
    .poll(async () =>
      heroGallery
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).muted),
    )
    .toBe(true);

  await heroAudioToggle.click();
  await expect(heroAudioToggle).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () =>
      heroGallery
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).muted),
    )
    .toBe(false);

  await promoGallery.getByTestId("gallery-frame-open-0").focus();
  await page.keyboard.press("ArrowRight");
  const promoAudioToggle = promoGallery.getByTestId("gallery-audio-toggle");
  await expect(promoAudioToggle).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () =>
      promoGallery
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).muted),
    )
    .toBe(false);

  await page.reload({
    waitUntil: "domcontentloaded",
  });

  const reloadedHeroGallery = page.getByTestId("shop-gallery");
  await reloadedHeroGallery.getByTestId("gallery-frame-open-0").focus();
  await page.keyboard.press("ArrowRight");
  const reloadedToggle = reloadedHeroGallery.getByTestId(
    "gallery-audio-toggle",
  );
  await expect(reloadedToggle).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(async () =>
      reloadedHeroGallery
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).muted),
    )
    .toBe(true);
});
