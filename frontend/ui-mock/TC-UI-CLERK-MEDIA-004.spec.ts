import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("TC-UI-CLERK-MEDIA-004: promotion card consumes mixed galleryItems and renders video in the card carousel", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const calls = {
      play: 0,
      pause: 0,
    };

    (window as typeof window & {
      __galleryVideoCalls?: typeof calls;
    }).__galleryVideoCalls = calls;

    const prototype = HTMLMediaElement.prototype as typeof HTMLMediaElement.prototype & {
      play: () => Promise<void>;
      pause: () => void;
    };

    prototype.play = () => {
      const state = (window as typeof window & {
        __galleryVideoCalls?: typeof calls;
      }).__galleryVideoCalls;
      if (state) {
        state.play += 1;
      }
      return Promise.resolve();
    };

    prototype.pause = () => {
      const state = (window as typeof window & {
        __galleryVideoCalls?: typeof calls;
      }).__galleryVideoCalls;
      if (state) {
        state.pause += 1;
      }
    };
  });

  await installApiMocks(page);
  await page.goto("/shop/barnaul-01", {
    waitUntil: "domcontentloaded",
  });

  const firstCard = page.getByTestId("shop-promo-card").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.locator("video")).toHaveCount(1);
  await expect(firstCard.locator("img")).toHaveCount(1);
  await expect(firstCard.locator("video")).toHaveAttribute(
    "poster",
    /promo-summer-clip-poster\.webp$/,
  );

  await firstCard.locator('[data-testid="gallery-next"]').click();
  await expect(firstCard.getByTestId("gallery-audio-toggle")).toBeVisible();
  await expect(firstCard.getByTestId("gallery-audio-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect
    .poll(async () =>
      firstCard
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).muted),
    )
    .toBe(true);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const state = (window as typeof window & {
          __galleryVideoCalls?: { play: number; pause: number };
        }).__galleryVideoCalls;
        return state?.play ?? 0;
      }),
    )
    .toBe(1);

  await firstCard.locator('[data-testid="gallery-prev"]').click();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const state = (window as typeof window & {
          __galleryVideoCalls?: { play: number; pause: number };
        }).__galleryVideoCalls;
        return state?.pause ?? 0;
      }),
    )
    .toBeGreaterThanOrEqual(1);
});
