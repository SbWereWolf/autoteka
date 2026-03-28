import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, BrowserContext, Page } from "playwright";
import {
  baseUrl,
  closeWithTimeout,
  headed,
} from "./uiUserHelpers";

type GalleryImageItem = {
  id: number;
  type: "image";
  src: string;
  sort: number;
};

type GalleryVideoItem = {
  id: number;
  type: "video";
  src: string;
  poster: string;
  mime: string;
  sort: number;
};

type GalleryItem = GalleryImageItem | GalleryVideoItem;

type ShopPayload = {
  id: number;
  code: string;
  cityId: string;
  title: string;
  slogan: string;
  description: string;
  scheduleNote: string;
  siteUrl: string;
  latitude: null;
  longitude: null;
  thumbUrl: string | null;
  galleryItems: GalleryItem[];
  categoryIds: string[];
  featureIds: string[];
};

const demoShopCode = "gallery-video-demo";

const mixedShopPayload: ShopPayload = {
  id: 501,
  code: demoShopCode,
  cityId: "demo-city",
  title: "Mixed Gallery Shop",
  slogan: "Image plus video",
  description: "Shop page used to prove mixed gallery rendering.",
  scheduleNote: "",
  siteUrl: "",
  latitude: null,
  longitude: null,
  thumbUrl: null,
  galleryItems: [
    {
      id: 1001,
      type: "image",
      src: "https://cdn.example.test/shop-image.webp",
      sort: 10,
    },
    {
      id: 1002,
      type: "video",
      src: "https://cdn.example.test/shop-video.webm",
      poster: "https://cdn.example.test/shop-poster.webp",
      mime: "video/webm",
      sort: 10,
    },
  ],
  categoryIds: [],
  featureIds: [],
};

let browser: Browser | undefined;

const closeBrowser = async () => {
  if (!browser) return;
  await closeWithTimeout(() => browser!.close(), 5_000);
};

describe("TC-UI-USER-021", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    await closeBrowser();
  });

  it("shop page renders mixed gallery items and controls the active video lifecycle", async () => {
    const context: BrowserContext = await browser!.newContext();
    try {
      const page: Page = await context.newPage();

      await page.addInitScript(() => {
        const telemetry = {
          playCalls: 0,
          pauseCalls: 0,
          currentTimeAssignments: [] as number[],
        };

        Object.defineProperty(window, "__galleryVideoTelemetry", {
          configurable: true,
          value: telemetry,
        });

        Object.defineProperty(HTMLMediaElement.prototype, "play", {
          configurable: true,
          value() {
            telemetry.playCalls += 1;
            return Promise.resolve();
          },
        });

        Object.defineProperty(HTMLMediaElement.prototype, "pause", {
          configurable: true,
          value() {
            telemetry.pauseCalls += 1;
          },
        });

        Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
          configurable: true,
          get() {
            return 0;
          },
          set(value: number) {
            telemetry.currentTimeAssignments.push(value);
          },
        });
      });

      await page.route(
        /\/api\/v1\/shop\/gallery-video-demo$/,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json; charset=utf-8",
            json: mixedShopPayload,
          });
        },
      );

      await page.route(
        /\/api\/v1\/shop\/gallery-video-demo\/promotion$/,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json; charset=utf-8",
            json: [],
          });
        },
      );

      await page.route(
        /\/api\/v1\/shop\/gallery-video-demo\/acceptable-contact-types$/,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json; charset=utf-8",
            json: {},
          });
        },
      );

      await page.goto(
        new URL(`/shop/${demoShopCode}`, baseUrl).toString(),
        {
          waitUntil: "domcontentloaded",
        },
      );

      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="shop-text-section"]') !==
            null &&
          document.querySelector('[data-testid="shop-gallery"]') !== null,
        { timeout: 30_000 },
      );

      const snapshot = await page.evaluate(() => {
        const shopGallery = document.querySelector(
          '[data-testid="shop-gallery"]',
        ) as HTMLElement | null;
        const shopVideo = shopGallery?.querySelector("video") as
          | HTMLVideoElement
          | null;
        const shopImage = shopGallery?.querySelector("img") as
          | HTMLImageElement
          | null;
        const videoTelemetry = (window as typeof window & {
          __galleryVideoTelemetry?: {
            playCalls: number;
            pauseCalls: number;
            currentTimeAssignments: number[];
          };
        }).__galleryVideoTelemetry;

        return {
          shopGallerySlides: shopGallery?.querySelectorAll(
            ".shop-gallery-slide",
          ).length ?? 0,
          shopGalleryVideos: shopGallery?.querySelectorAll("video").length ?? 0,
          shopGalleryImages: shopGallery?.querySelectorAll("img").length ?? 0,
          shopVideo: shopVideo
            ? {
                autoplay: shopVideo.autoplay,
                muted: shopVideo.muted,
                loop: shopVideo.loop,
                controls: shopVideo.controls,
                playsInline: shopVideo.hasAttribute("playsinline"),
                poster: shopVideo.getAttribute("poster"),
              }
            : null,
          shopImageAlt: shopImage?.alt ?? null,
          videoTelemetry,
        };
      });

      expect(snapshot.shopGallerySlides).toBeGreaterThanOrEqual(2);
      expect(snapshot.shopGalleryImages).toBe(1);
      expect(snapshot.shopGalleryVideos).toBe(1);
      expect(snapshot.shopVideo).toEqual({
        autoplay: false,
        muted: true,
        loop: true,
        controls: false,
        playsInline: true,
        poster: "https://cdn.example.test/shop-poster.webp",
      });

      const prevButtonCount = await page
        .locator('[data-testid="gallery-prev"]')
        .count();
      const nextButtonCount = await page
        .locator('[data-testid="gallery-next"]')
        .count();
      expect(prevButtonCount).toBe(1);
      expect(nextButtonCount).toBe(1);

      await page.locator('[data-testid="gallery-next"]').first().click();
      await page.waitForFunction(
        () =>
          ((window as typeof window & {
            __galleryVideoTelemetry?: {
              playCalls: number;
              pauseCalls: number;
              currentTimeAssignments: number[];
            };
          }).__galleryVideoTelemetry?.playCalls ?? 0) > 0,
        { timeout: 10_000 },
      );

      const postNavigationTelemetry = await page.evaluate(() => {
        const telemetry = (window as typeof window & {
          __galleryVideoTelemetry?: {
            playCalls: number;
            pauseCalls: number;
            currentTimeAssignments: number[];
          };
        }).__galleryVideoTelemetry;

        return telemetry ?? null;
      });

      expect(postNavigationTelemetry?.playCalls).toBeGreaterThanOrEqual(1);
      expect(postNavigationTelemetry?.pauseCalls).toBeGreaterThanOrEqual(1);
      expect(
        postNavigationTelemetry?.currentTimeAssignments.some(
          (value) => value === 0,
        ),
      ).toBe(true);
    } finally {
      await closeWithTimeout(() => context.close(), 5_000);
    }
  }, 90_000);
});
