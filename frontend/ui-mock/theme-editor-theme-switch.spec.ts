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
        },
        "a-accent": {
          "--bg": "oklch(0.68 0.15 50)",
        },
      }),
    );
  });

  await page.goto("/");

  await page.getByRole("button", { name: "CSS переменные" }).click();

  const bgInput = page.locator('[data-testid="css-var-input---bg"]');

  await expect(page.getByText("theme-a-neutral")).toBeVisible();
  await expect(bgInput).toHaveValue("oklch(0.22 0.02 260)");

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
});
