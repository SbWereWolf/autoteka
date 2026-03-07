import { defineConfig } from "@playwright/test";

/**
 * E2E-тесты против приложения, развёрнутого в Docker.
 * Перед запуском: docker compose up, frontend собран (npm run build).
 * baseURL: http://localhost (порт 80 по умолчанию).
 * Для другого порта задать PLAYWRIGHT_BASE_URL.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  // Без webServer: приложение уже в Docker. Запускать после docker compose up.
});
