import { test } from "@playwright/test";
import {
  assertCitySelectionScenario,
  installCitySelectionScenario,
  loadCitySelectionScenarios,
} from "./support/citySelectionScenario";

const scenarios = loadCitySelectionScenarios();
const REAL_GEOLOCATION_TEST_TIMEOUT_MS = 360_000;

for (const scenario of scenarios) {
  const runRealScenario =
    scenario.server.geolocation.mode !== "real" ||
    process.env.CITY_SELECTION_REAL_GEOLOCATION === "1";

  test(`${scenario.id}: ${scenario.description}`, async ({ page }) => {
    if (scenario.server.geolocation.mode === "real") {
      test.setTimeout(REAL_GEOLOCATION_TEST_TIMEOUT_MS);
    }

    test.skip(
      !runRealScenario,
      "Реальная геолокация запускается явно: CITY_SELECTION_REAL_GEOLOCATION=1",
    );

    await installCitySelectionScenario(page, scenario);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertCitySelectionScenario(page, scenario);
  });
}
