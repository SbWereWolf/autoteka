import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("TC-UI-CLERK-MEDIA-003: shop page consumes mixed galleryItems and renders video in the hero gallery", async ({
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

  const gallery = page.getByTestId("shop-gallery");
  await expect(gallery).toBeVisible();
  await expect(gallery.locator("video")).toHaveCount(1);
  await expect(gallery.locator("img")).toHaveCount(1);
  await expect(gallery.locator("video")).toHaveAttribute(
    "poster",
    /gallery-video-poster\.webp$/,
  );

  await gallery.locator('[data-testid="gallery-next"]').click();
  await expect(gallery.getByTestId("gallery-audio-toggle")).toBeVisible();
  await expect(gallery.getByTestId("gallery-audio-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect
    .poll(async () =>
      gallery
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

  await gallery.locator('[data-testid="gallery-prev"]').click();
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
