import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import {
  installApiMocks,
  TEST_GEOLOCATION_CONFIGURED_KEY,
  type ErrorScenario,
  type RawCity,
} from "./mockApi";

type MockGeolocation =
  | {
      mode: "mock";
      status: "success";
      latitude: number;
      longitude: number;
    }
  | { mode: "mock"; status: "denied" | "error" };

type RealGeolocation = { mode: "real" };

type CityListConfig =
  | { mode: "error"; status: 500 }
  | { mode: "fixture"; cities: RawCity[] };

export type CitySelectionScenario = {
  id: string;
  description: string;
  execution?: "manual";
  server: {
    cityList: CityListConfig;
    geolocation: MockGeolocation | RealGeolocation;
  };
  client: {
    localStorageCityCode: string | null;
  };
  expected: {
    selectedCityCode: string;
    localStorageCityCode: string | null;
    citySelectionError: boolean;
    dialogVisible: boolean;
    geolocationRequested: boolean;
    selectionSource: string;
  };
};

const CONFIG_DIR = path.resolve(
  process.cwd(),
  "../system-tests/config/city-selection",
);
const CITY_STORAGE_KEY = "autoteka_city";
const GEO_COUNTER_KEY = "__autotekaGeolocationRequestCount";
const CITY_SELECTION_ERROR_MESSAGE =
  "Определить город для загрузки списка магазинов не удалось";
const SELECTION_SOURCES = [
  "error",
  "local-storage",
  "fallback-first-city",
  "nearest-geolocation",
  "real-geolocation-or-fallback",
] as const;

type SelectionSource = (typeof SELECTION_SOURCES)[number];

function fixtureCities(scenario: CitySelectionScenario): RawCity[] {
  return scenario.server.cityList.mode === "fixture"
    ? scenario.server.cityList.cities
    : [];
}

function firstFixtureCityCode(scenario: CitySelectionScenario): string {
  return fixtureCities(scenario)[0]?.code ?? "";
}

function sortedFixtureCityCodes(
  scenario: CitySelectionScenario,
): string[] {
  return [...fixtureCities(scenario)]
    .sort(
      (a, b) => a.sort - b.sort || a.code.localeCompare(b.code, "ru"),
    )
    .map((city) => city.code);
}

function assertExpectedOutcomeContract(
  scenario: CitySelectionScenario,
  fileName: string,
): void {
  const source = scenario.expected.selectionSource as SelectionSource;
  if (!SELECTION_SOURCES.includes(source)) {
    throw new Error(
      `${fileName}: неизвестный expected.selectionSource`,
    );
  }

  if (
    scenario.expected.citySelectionError !==
    scenario.expected.dialogVisible
  ) {
    throw new Error(
      `${fileName}: citySelectionError и dialogVisible должны совпадать`,
    );
  }

  if (source === "error") {
    if (
      scenario.expected.selectedCityCode !== "" ||
      scenario.expected.localStorageCityCode !== null ||
      !scenario.expected.citySelectionError ||
      scenario.expected.geolocationRequested
    ) {
      throw new Error(
        `${fileName}: error-сценарий должен завершаться без города/localStorage/geolocation и с ошибкой`,
      );
    }
    return;
  }

  if (scenario.expected.citySelectionError) {
    throw new Error(
      `${fileName}: успешный selectionSource не должен ожидать citySelectionError`,
    );
  }

  if (source === "local-storage") {
    if (
      scenario.client.localStorageCityCode !==
        scenario.expected.selectedCityCode ||
      scenario.expected.localStorageCityCode !==
        scenario.expected.selectedCityCode ||
      scenario.expected.geolocationRequested
    ) {
      throw new Error(
        `${fileName}: local-storage сценарий должен сохранить исходный валидный code без geolocation`,
      );
    }
    return;
  }

  if (source === "fallback-first-city") {
    const firstCityCode = firstFixtureCityCode(scenario);
    if (
      firstCityCode === "" ||
      scenario.expected.selectedCityCode !== firstCityCode ||
      scenario.expected.localStorageCityCode !== firstCityCode ||
      !scenario.expected.geolocationRequested
    ) {
      throw new Error(
        `${fileName}: fallback должен выбрать и сохранить первый серверный город после запроса geolocation`,
      );
    }
    return;
  }

  if (source === "nearest-geolocation") {
    if (
      scenario.server.geolocation.mode !== "mock" ||
      scenario.server.geolocation.status !== "success" ||
      scenario.expected.selectedCityCode === "" ||
      scenario.expected.localStorageCityCode !==
        scenario.expected.selectedCityCode ||
      !scenario.expected.geolocationRequested
    ) {
      throw new Error(
        `${fileName}: nearest-geolocation требует успешный mock GPS и сохранение выбранного code`,
      );
    }
    return;
  }

  if (
    scenario.server.geolocation.mode !== "real" ||
    scenario.expected.selectedCityCode !== "any-server-city" ||
    scenario.expected.localStorageCityCode !== "same-as-selected" ||
    !scenario.expected.geolocationRequested
  ) {
    throw new Error(
      `${fileName}: real-geolocation сценарий должен ожидать любой серверный город и сохранить его`,
    );
  }
}

function assertScenario(
  value: unknown,
  fileName: string,
): asserts value is CitySelectionScenario {
  if (!value || typeof value !== "object") {
    throw new Error(`${fileName}: конфиг должен быть JSON object`);
  }

  const scenario = value as Partial<CitySelectionScenario>;
  if (
    !scenario.id ||
    !scenario.description ||
    !scenario.server ||
    !scenario.client ||
    !scenario.expected
  ) {
    throw new Error(
      `${fileName}: отсутствуют обязательные поля scenario`,
    );
  }

  const cityList = scenario.server.cityList;
  if (cityList.mode === "error") {
    if (cityList.status !== 500) {
      throw new Error(
        `${fileName}: поддерживаемый city-list error status — 500`,
      );
    }
  } else if (cityList.mode === "fixture") {
    if (!Array.isArray(cityList.cities)) {
      throw new Error(
        `${fileName}: server.cityList.cities должен быть массивом`,
      );
    }
  } else {
    throw new Error(`${fileName}: неизвестный server.cityList.mode`);
  }

  const geolocation = scenario.server.geolocation;
  if (geolocation.mode === "mock") {
    if (
      !(["success", "denied", "error"] as const).includes(
        geolocation.status,
      )
    ) {
      throw new Error(
        `${fileName}: неизвестный mock geolocation status`,
      );
    }
    if (
      geolocation.status === "success" &&
      (!Number.isFinite(geolocation.latitude) ||
        !Number.isFinite(geolocation.longitude))
    ) {
      throw new Error(
        `${fileName}: success geolocation требует конечные latitude/longitude`,
      );
    }
  } else if (geolocation.mode !== "real") {
    throw new Error(`${fileName}: неизвестный geolocation mode`);
  }

  assertExpectedOutcomeContract(
    scenario as CitySelectionScenario,
    fileName,
  );
}

export function loadCitySelectionScenarios(): CitySelectionScenario[] {
  if (!fs.existsSync(CONFIG_DIR)) {
    throw new Error(`Не найден каталог конфигов: ${CONFIG_DIR}`);
  }

  const files = fs
    .readdirSync(CONFIG_DIR)
    .filter((file) => /^\d{2}-.*\.json$/.test(file))
    .sort();

  if (files.length !== 7) {
    throw new Error(
      `Ожидалось 7 city-selection конфигов, найдено: ${files.length}`,
    );
  }

  const scenarios = files.map((fileName) => {
    const filePath = path.join(CONFIG_DIR, fileName);
    const value: unknown = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    );
    assertScenario(value, fileName);
    return value;
  });

  const ids = scenarios.map((scenario) => scenario.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("city-selection config id должны быть уникальными");
  }

  return scenarios;
}

function toMockApiScenario(
  scenario: CitySelectionScenario,
): ErrorScenario {
  if (scenario.server.cityList.mode === "error") {
    return { cityListStatus: scenario.server.cityList.status };
  }

  return { cities: scenario.server.cityList.cities };
}

export async function installCitySelectionScenario(
  page: Page,
  scenario: CitySelectionScenario,
): Promise<void> {
  await page.addInitScript(
    ({
      cityCode,
      geolocation,
      storageKey,
      counterKey,
      configuredKey,
    }) => {
      const testWindow = window as Window & Record<string, unknown>;
      testWindow[configuredKey] = true;

      localStorage.clear();
      if (cityCode !== null) {
        localStorage.setItem(storageKey, JSON.stringify(cityCode));
      }

      Object.defineProperty(window, counterKey, {
        configurable: true,
        writable: true,
        value: 0,
      });

      const incrementCounter = () => {
        const target = window as unknown as Record<string, unknown>;
        target[counterKey] = Number(target[counterKey] ?? 0) + 1;
      };

      if (geolocation.mode === "real") {
        const nativeGeolocation = navigator.geolocation;
        if (!nativeGeolocation) {
          return;
        }

        const nativeGetCurrentPosition =
          nativeGeolocation.getCurrentPosition.bind(nativeGeolocation);
        try {
          nativeGeolocation.getCurrentPosition = (
            success,
            error,
            options,
          ) => {
            incrementCounter();
            nativeGetCurrentPosition(success, error, options);
          };
        } catch {
          // Real-mode instrumentation is best-effort; the browser API itself is not mocked.
        }
        return;
      }

      const getCurrentPosition: Geolocation["getCurrentPosition"] = (
        success,
        error,
      ) => {
        incrementCounter();

        setTimeout(() => {
          if (geolocation.status === "success") {
            success({
              coords: {
                latitude: geolocation.latitude,
                longitude: geolocation.longitude,
                accuracy: 1,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({}),
              },
              timestamp: Date.now(),
              toJSON: () => ({}),
            });
            return;
          }

          error?.({
            code: geolocation.status === "denied" ? 1 : 2,
            message:
              geolocation.status === "denied"
                ? "Permission denied by test config"
                : "Position unavailable by test config",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }, 0);
      };

      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition,
          watchPosition: () => 0,
          clearWatch: () => undefined,
        } satisfies Geolocation,
      });
    },
    {
      cityCode: scenario.client.localStorageCityCode,
      geolocation: scenario.server.geolocation,
      storageKey: CITY_STORAGE_KEY,
      counterKey: GEO_COUNTER_KEY,
      configuredKey: TEST_GEOLOCATION_CONFIGURED_KEY,
    },
  );

  await installApiMocks(page, toMockApiScenario(scenario), {
    installDefaultGeolocation: false,
  });
}

async function selectedCityCodeFromFilter(page: Page): Promise<string> {
  await page.locator("[data-menu-button]").click();
  const select = page.getByTestId("menu-city-select");
  await expect(select).toBeVisible();
  return select.inputValue();
}

async function cityCodesFromFilter(page: Page): Promise<string[]> {
  const select = page.getByTestId("menu-city-select");
  return select
    .locator("option")
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
}

async function readStoredCity(page: Page): Promise<{
  raw: string | null;
  parsed: string | null;
}> {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return {
      raw,
      parsed: raw === null ? null : (JSON.parse(raw) as string),
    };
  }, CITY_STORAGE_KEY);
}

function assertSelectionSource(
  scenario: CitySelectionScenario,
  selectedCityCode: string,
  storedCityCode: string | null,
  geolocationRequestCount: number,
): void {
  const source = scenario.expected.selectionSource as SelectionSource;
  const firstCityCode = firstFixtureCityCode(scenario);

  switch (source) {
    case "error":
      expect(selectedCityCode).toBe("");
      expect(storedCityCode).toBeNull();
      expect(geolocationRequestCount).toBe(0);
      return;
    case "local-storage":
      expect(selectedCityCode).toBe(
        scenario.client.localStorageCityCode,
      );
      expect(storedCityCode).toBe(selectedCityCode);
      expect(geolocationRequestCount).toBe(0);
      return;
    case "fallback-first-city":
      expect(selectedCityCode).toBe(firstCityCode);
      expect(storedCityCode).toBe(firstCityCode);
      expect(geolocationRequestCount).toBe(1);
      return;
    case "nearest-geolocation":
      expect(selectedCityCode).toBe(scenario.expected.selectedCityCode);
      expect(selectedCityCode).not.toBe(firstCityCode);
      expect(storedCityCode).toBe(selectedCityCode);
      expect(geolocationRequestCount).toBe(1);
      return;
    case "real-geolocation-or-fallback":
      expect(
        fixtureCities(scenario).map((city) => city.code),
      ).toContain(selectedCityCode);
      expect(storedCityCode).toBe(selectedCityCode);
      expect(geolocationRequestCount).toBeGreaterThan(0);
      return;
  }
}

export async function assertCitySelectionScenario(
  page: Page,
  scenario: CitySelectionScenario,
): Promise<void> {
  await page.locator("#app").waitFor({ state: "attached" });

  const dialog = page.locator(
    'dialog[aria-labelledby="city-selection-error-title"]',
  );
  const accessibleDialog = page.getByRole("dialog", {
    name: "Ошибка выбора города",
  });
  if (scenario.expected.citySelectionError) {
    await expect(accessibleDialog).toBeVisible();
    await expect(accessibleDialog).toContainText(
      CITY_SELECTION_ERROR_MESSAGE,
    );
    expect(
      await dialog.evaluate((element) => element.matches(":modal")),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(accessibleDialog).toBeHidden();
  } else {
    await expect(dialog).toBeHidden();
    expect(
      await dialog.evaluate((element) => element.hasAttribute("open")),
    ).toBe(false);
  }

  const selectedCityCode = await selectedCityCodeFromFilter(page);
  const filterCityCodes = await cityCodesFromFilter(page);
  expect(filterCityCodes).toEqual(sortedFixtureCityCodes(scenario));

  if (scenario.expected.selectedCityCode === "any-server-city") {
    expect(filterCityCodes).toContain(selectedCityCode);
  } else {
    expect(selectedCityCode).toBe(scenario.expected.selectedCityCode);
  }

  const storedCity = await readStoredCity(page);

  if (scenario.expected.localStorageCityCode === "same-as-selected") {
    expect(storedCity.parsed).toBe(selectedCityCode);
    expect(storedCity.raw).toBe(JSON.stringify(selectedCityCode));
  } else {
    expect(storedCity.parsed).toBe(
      scenario.expected.localStorageCityCode,
    );
    expect(storedCity.raw).toBe(
      scenario.expected.localStorageCityCode === null
        ? null
        : JSON.stringify(scenario.expected.localStorageCityCode),
    );
  }

  const geolocationRequestCount = await page.evaluate((counterKey) => {
    const target = window as unknown as Record<string, unknown>;
    return Number(target[counterKey] ?? 0);
  }, GEO_COUNTER_KEY);

  if (scenario.expected.geolocationRequested) {
    if (scenario.server.geolocation.mode === "real") {
      expect(geolocationRequestCount).toBeGreaterThan(0);
    } else {
      expect(geolocationRequestCount).toBe(1);
    }
  } else {
    expect(geolocationRequestCount).toBe(0);
  }

  assertSelectionSource(
    scenario,
    selectedCityCode,
    storedCity.parsed,
    geolocationRequestCount,
  );
}
