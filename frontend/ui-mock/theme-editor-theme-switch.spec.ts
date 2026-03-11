import { expect, test } from "@playwright/test";
import { installApiMocks } from "./support/mockApi";

test("при смене темы в форме подгружаются значения новой темы", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => {
    localStorage.setItem("autoteka_theme_editor_enabled", "true");
    localStorage.setItem("autoteka_theme", "a-neutral");
    localStorage.setItem(
      "autoteka_theme_overrides_v1",
      JSON.stringify({
        "a-neutral": {
          "--bg": "oklch(0.22 0.02 260)",
          "--shop-gallery-height": "70dvh",
          "--tile-title-font-ratio": "0.23",
          "--topbar-title-font-size": "1.5rem",
        },
        "a-accent": {
          "--bg": "oklch(0.68 0.15 50)",
          "--shop-gallery-height": "60dvh",
          "--tile-title-font-ratio": "0.19",
          "--topbar-title-font-size": "1.25rem",
        },
      }),
    );
  });

  await page.goto("/");

  await page.getByRole("button", { name: "CSS переменные" }).click();

  const bgInput = page.locator('[data-testid="css-var-input---bg"]');
  const galleryHeightInput = page.locator(
    '[data-testid="css-var-input---shop-gallery-height"]',
  );
  const tileRatioInput = page.locator(
    '[data-testid="css-var-input---tile-title-font-ratio"]',
  );
  const topbarTitleInput = page.locator(
    '[data-testid="css-var-input---topbar-title-font-size"]',
  );

  await expect(page.getByText("theme-a-neutral")).toBeVisible();
  await expect(bgInput).toHaveValue("oklch(0.22 0.02 260)");
  await expect(galleryHeightInput).toHaveValue("70dvh");
  await expect(tileRatioInput).toHaveValue("0.23");
  await expect(topbarTitleInput).toHaveValue("1.5rem");

  const themeSelect = page.getByRole("combobox", {
    name: "Тема оформления",
  });
  if (await themeSelect.isVisible()) {
    await themeSelect.selectOption("a-accent");
  } else {
    await page.getByRole("button", { name: "Тема A Accent" }).click();
  }

  await expect(page.getByText("theme-a-accent")).toBeVisible();
  await expect(bgInput).toHaveValue("oklch(0.68 0.15 50)");
  await expect(galleryHeightInput).toHaveValue("60dvh");
  await expect(tileRatioInput).toHaveValue("0.19");
  await expect(topbarTitleInput).toHaveValue("1.25rem");
});
