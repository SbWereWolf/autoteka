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
    browserName: "chromium",
    baseURL:
      process.env.PLAYWRIGHT_UI_MOCK_BASE_URL ??
      "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command:
      "npm run build && exec ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
