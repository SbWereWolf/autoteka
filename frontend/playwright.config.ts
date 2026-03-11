import { defineConfig } from "@playwright/test";

/**
 * Дефолтный конфиг Playwright: online e2e для установленного контура.
 * Для offline UI на mock-данных используйте playwright.ui-mock.config.ts.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    browserName: "firefox",
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
});
