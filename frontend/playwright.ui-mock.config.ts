import { defineConfig } from "@playwright/test";

/**
 * Offline UI-тесты на mock-данных: поднимается только frontend.
 * API-запросы перехватываются в тестах через installApiMocks.
 */
export default defineConfig({
  testDir: "./ui-mock",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    browserName: "firefox",
    baseURL:
      process.env.PLAYWRIGHT_UI_MOCK_BASE_URL ??
      "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 2048, height: 1280 },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
