import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type BrowserLike,
  baseUrl,
  closeWithTimeout,
  getFirstShopPayload,
  getShopPayloadByCode,
  headed,
  waitForBaseUrlReady,
  waitForCatalogShell,
  waitForShopShell,
} from "./uiUserHelpers";

let browser: BrowserLike | undefined;

describe("TC-UI-USER-010", () => {
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: !headed });
  });

  afterAll(async () => {
    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("catalogue -> overlay -> shop page работает по новому UI", async () => {
    const context = await browser!.newContext();
    try {
      const page = await context.newPage();
      await waitForBaseUrlReady();
      await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await waitForCatalogShell(page);
      await page.waitForLoadState("networkidle");
      await page
        .locator("[data-menu-button]")
        .waitFor({ state: "visible", timeout: 10_000 });

      const shopPayload = await getFirstShopPayload();
      expect(shopPayload).toBeTruthy();
      if (!shopPayload?.code) return;

      await page.locator("[data-menu-button]").click();
      await page.waitForFunction(
        () => document.querySelector(".catalog-menu-panel") !== null,
        { timeout: 10_000 },
      );

      const menuMetrics = await page.evaluate(() => {
        const panel = document.querySelector(
          ".catalog-menu-panel",
        ) as HTMLElement | null;
        const closeButton = panel?.querySelector(
          'button[aria-label="Закрыть"]',
        ) as HTMLElement | null;
        const panelRect = panel?.getBoundingClientRect() ?? null;
        const closeRect = closeButton?.getBoundingClientRect() ?? null;
        return {
          hamburgerLines: document.querySelectorAll(
            "[data-menu-button] .catalog-hamburger-line",
          ).length,
          hasLogoInsidePanel:
            panel?.querySelector(".catalog-brand-logo") !== null,
          panelRect: panelRect
            ? {
                x: panelRect.x,
                y: panelRect.y,
                width: panelRect.width,
                height: panelRect.height,
              }
            : null,
          closeRect: closeRect
            ? {
                x: closeRect.x,
                y: closeRect.y,
                width: closeRect.width,
                height: closeRect.height,
              }
            : null,
        };
      });

      expect(menuMetrics.hamburgerLines).toBe(4);
      expect(menuMetrics.hasLogoInsidePanel).toBe(false);
      expect(menuMetrics.panelRect).toBeTruthy();
      expect(menuMetrics.closeRect).toBeTruthy();
      if (menuMetrics.panelRect && menuMetrics.closeRect) {
        expect(menuMetrics.closeRect.x).toBeGreaterThan(
          menuMetrics.panelRect.x + menuMetrics.panelRect.width * 0.65,
        );
        expect(menuMetrics.closeRect.y).toBeLessThan(
          menuMetrics.panelRect.y + menuMetrics.panelRect.height * 0.25,
        );
      }

      await page.getByRole("button", { name: "Закрыть меню" }).click();
      await page.waitForFunction(
        () => document.querySelector(".catalog-menu-panel") === null,
        { timeout: 10_000 },
      );

      await page
        .locator('[data-testid="catalog-grid-shell"] button')
        .first()
        .click();
      await page.waitForURL(/\/shop\/[^/?#]+(?:[?#].*)?$/, {
        timeout: 10_000,
      });
      await waitForShopShell(page);
      const currentShopCode = new URL(page.url()).pathname
        .split("/")
        .filter(Boolean)
        .at(-1);
      const currentShopPayload = currentShopCode
        ? await getShopPayloadByCode(currentShopCode)
        : null;

      const shopBackButtonText = await page.evaluate(() => {
        const button = document.querySelector(
          ".shop-back-button",
        ) as HTMLElement | null;
        return button?.textContent?.trim() ?? "";
      });
      expect(shopBackButtonText).toBe("");
      expect(await page.locator(".shop-back-icon").count()).toBe(0);
      expect(await page.locator(".shop-back-raster").count()).toBe(1);

      const heroMetrics = await page.evaluate(() => {
        const hero = document.querySelector(
          ".shop-hero-shell",
        ) as HTMLElement | null;
        const head = document.querySelector(
          ".shop-hero-head",
        ) as HTMLElement | null;
        const gallery = document.querySelector(
          ".shop-hero-gallery",
        ) as HTMLElement | null;
        const note = document.querySelector(
          '[data-testid="shop-schedule-note"]',
        ) as HTMLElement | null;
        const dots = document.querySelector(
          ".shop-gallery-dots",
        ) as HTMLElement | null;
        const slogan = document.querySelector(
          '[data-testid="shop-slogan"]',
        ) as HTMLElement | null;
        const description = document.querySelector(
          '[data-testid="shop-description"]',
        ) as HTMLElement | null;
        const categories = Array.from(
          document.querySelectorAll(
            ".shop-feature-badge--category",
          ),
        ).map((element) => element.textContent?.trim() ?? "");
        const heroRect = hero?.getBoundingClientRect() ?? null;
        const headRect = head?.getBoundingClientRect() ?? null;
        const galleryRect = gallery?.getBoundingClientRect() ?? null;
        const noteRect = note?.getBoundingClientRect() ?? null;
        const dotsRect = dots?.getBoundingClientRect() ?? null;
        const sloganRect = slogan?.getBoundingClientRect() ?? null;
        const descriptionRect = description?.getBoundingClientRect() ?? null;
        const noteStyle = note ? window.getComputedStyle(note) : null;
        const descriptionStyle = description
          ? window.getComputedStyle(description)
          : null;
        return {
          heroRect: heroRect
            ? {
                left: heroRect.left,
                top: heroRect.top,
                width: heroRect.width,
                height: heroRect.height,
              }
            : null,
          headRect: headRect
            ? {
                left: headRect.left,
                top: headRect.top,
                width: headRect.width,
                height: headRect.height,
              }
            : null,
          galleryRect: galleryRect
            ? {
                left: galleryRect.left,
                top: galleryRect.top,
                width: galleryRect.width,
                height: galleryRect.height,
              }
            : null,
          noteRect: noteRect
            ? {
                left: noteRect.left,
                top: noteRect.top,
                width: noteRect.width,
                height: noteRect.height,
                bottom: noteRect.bottom,
              }
            : null,
          dotsRect: dotsRect
            ? {
                left: dotsRect.left,
                top: dotsRect.top,
                width: dotsRect.width,
                height: dotsRect.height,
                bottom: dotsRect.bottom,
              }
            : null,
          sloganRect: sloganRect
            ? {
                left: sloganRect.left,
                top: sloganRect.top,
                width: sloganRect.width,
                height: sloganRect.height,
                bottom: sloganRect.bottom,
              }
            : null,
          descriptionRect: descriptionRect
            ? {
                left: descriptionRect.left,
                top: descriptionRect.top,
                width: descriptionRect.width,
                height: descriptionRect.height,
                bottom: descriptionRect.bottom,
              }
            : null,
          categories,
          noteFontWeight: noteStyle?.fontWeight ?? null,
          noteFontSize: noteStyle
            ? Number.parseFloat(noteStyle.fontSize)
            : null,
          descriptionFontSize: descriptionStyle
            ? Number.parseFloat(descriptionStyle.fontSize)
            : null,
          descriptionLineHeight: descriptionStyle
            ? Number.parseFloat(descriptionStyle.lineHeight)
            : null,
        };
      });

      expect(heroMetrics.heroRect).toBeTruthy();
      expect(heroMetrics.headRect).toBeTruthy();
      expect(heroMetrics.galleryRect).toBeTruthy();
      if (heroMetrics.heroRect && heroMetrics.headRect && heroMetrics.galleryRect) {
        const headRatio =
          heroMetrics.headRect.height / heroMetrics.heroRect.height;
        const galleryRatio =
          heroMetrics.galleryRect.height / heroMetrics.heroRect.height;
        expect(headRatio).toBeGreaterThan(0.15);
        expect(headRatio).toBeLessThan(0.25);
        expect(galleryRatio).toBeGreaterThan(0.75);
        expect(galleryRatio).toBeLessThan(0.88);
      }
      if (
        heroMetrics.sloganRect &&
        heroMetrics.descriptionRect &&
        heroMetrics.descriptionLineHeight
      ) {
        expect(
          heroMetrics.descriptionRect.top - heroMetrics.sloganRect.bottom,
        ).toBeGreaterThanOrEqual(heroMetrics.descriptionLineHeight - 1);
      }

      const hasLegacyFeaturesTitle = await page.evaluate(
        () =>
          document
            .querySelector('[data-testid="shop-features"]')
            ?.textContent?.includes("Возможности") ?? false,
      );
      expect(hasLegacyFeaturesTitle).toBe(false);
      expect(heroMetrics.categories.length).toBeGreaterThan(0);

      const scheduleNote = String(
        currentShopPayload?.scheduleNote ?? shopPayload.scheduleNote ?? "",
      ).trim();
      if (scheduleNote.length > 0) {
        const noteCount = await page.locator(
          '[data-testid="shop-schedule-note"]',
        ).count();
        expect(noteCount).toBeGreaterThan(0);
        const noteText = await page
          .locator('[data-testid="shop-schedule-note"]')
          .first()
          .textContent();
        expect(noteText?.trim()).toBe(scheduleNote);
        expect(heroMetrics.noteFontWeight).toMatch(/^(600|700|800|900|bold)$/);
        if (heroMetrics.noteFontSize && heroMetrics.descriptionFontSize) {
          expect(
            Math.abs(heroMetrics.noteFontSize - heroMetrics.descriptionFontSize),
          ).toBeLessThanOrEqual(0.5);
        }
        if (
          heroMetrics.noteRect &&
          heroMetrics.dotsRect &&
          heroMetrics.galleryRect &&
          heroMetrics.descriptionLineHeight
        ) {
          const noteCenter =
            heroMetrics.noteRect.left + heroMetrics.noteRect.width / 2;
          const galleryCenter =
            heroMetrics.galleryRect.left + heroMetrics.galleryRect.width / 2;
          expect(Math.abs(noteCenter - galleryCenter)).toBeLessThanOrEqual(8);
          expect(
            heroMetrics.dotsRect.top - heroMetrics.noteRect.bottom,
          ).toBeGreaterThanOrEqual(heroMetrics.descriptionLineHeight - 1);
        }
      }

      if (
        Array.isArray(currentShopPayload?.galleryItems) &&
        currentShopPayload.galleryItems.length > 1
      ) {
        expect(
          await page.locator('[data-testid="gallery-prev"]').count(),
        ).toBe(1);
        expect(
          await page.locator('[data-testid="gallery-next"]').count(),
        ).toBe(1);
        expect(
          await page.locator(".shop-gallery-dot").count(),
        ).toBeGreaterThan(1);
      }

      await page.locator(".shop-back-button").click();
      await waitForCatalogShell(page);
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  }, 180_000);
});
