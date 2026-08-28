import { reactive } from "vue";
import type { Category, City, Feature } from "./types";
import { findNearestGpsPoint } from "./utils/findNearestGpsPoint";
import { loadLocal, saveLocal } from "./utils/storage";
import {
  createBrowserGeolocationProvider,
  type GeolocationProvider,
} from "./utils/userGeolocation";

const CITY_KEY = "autoteka_city";
const CATEGORIES_KEY = "autoteka_categories";
const FEATURE_KEY = "autoteka_feature";

type AppState = {
  menuOpen: boolean;
  offersOpen: boolean;
  cityCode: string;
  citySelectionError: boolean;
  selectedCategoryIds: string[];
  selectedFeatureId: string | null;
  cities: City[];
  categories: Category[];
  features: Feature[];
};

export const state = reactive<AppState>({
  menuOpen: false,
  offersOpen: false,
  cityCode: "",
  citySelectionError: false,
  selectedCategoryIds: [],
  selectedFeatureId: null,
  cities: [],
  categories: [],
  features: [],
});

function stableSort<T extends { sort: number }>(items: T[]): T[] {
  const keyOf = (item: T) =>
    typeof item === "object" &&
    item !== null &&
    "code" in item &&
    typeof item.code === "string"
      ? item.code
      : typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof item.id === "string"
        ? item.id
        : "";

  return [...items].sort(
    (a, b) => a.sort - b.sort || keyOf(a).localeCompare(keyOf(b), "ru"),
  );
}

function sanitizeFromSet(
  values: unknown,
  allowed: Set<string>,
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter(
      (value): value is string =>
        typeof value === "string" && allowed.has(value),
    )
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function sanitizeFeatureId(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const allowed = new Set(state.features.map((item) => item.id));
  return allowed.has(value) ? value : null;
}

function coordinate(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function initState(
  params: {
    cities: City[];
    categories: Category[];
    features: Feature[];
  },
  geolocationProvider: GeolocationProvider = createBrowserGeolocationProvider(),
) {
  const fallbackCityCode = params.cities[0]?.code ?? "";

  state.cityCode = "";
  state.cities = stableSort(params.cities);
  state.categories = stableSort(params.categories);
  state.features = stableSort(params.features);

  const citySet = new Set(state.cities.map((city) => city.code));
  const categorySet = new Set(
    state.categories.map((category) => category.id),
  );

  const rawCityCode = loadLocal<unknown>(CITY_KEY, null);
  if (typeof rawCityCode === "string" && citySet.has(rawCityCode)) {
    state.cityCode = rawCityCode;
    state.citySelectionError = false;
  } else {
    let selectedCityCode = fallbackCityCode;

    if (state.cities.length > 0) {
      const geolocationResult = await geolocationProvider.getPosition();

      if (geolocationResult.status === "success") {
        const nearestCity = findNearestGpsPoint(
          state.cities.map((city) => ({
            code: city.code,
            lat: coordinate(city.latitude),
            lon: coordinate(city.longitude),
          })),
          geolocationResult.position,
        );

        if (citySet.has(nearestCity.code)) {
          selectedCityCode = nearestCity.code;
        }
      }
    }

    if (selectedCityCode === "") {
      state.citySelectionError = true;
    } else {
      state.cityCode = selectedCityCode;
      state.citySelectionError = false;
      saveLocal(CITY_KEY, state.cityCode);
    }
  }

  const rawCategories = loadLocal<unknown>(CATEGORIES_KEY, []);
  state.selectedCategoryIds = sanitizeFromSet(
    rawCategories,
    categorySet,
  );
  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);

  const rawFeatureId = loadLocal<unknown>(FEATURE_KEY, null);
  state.selectedFeatureId = sanitizeFeatureId(rawFeatureId);
  saveLocal(FEATURE_KEY, state.selectedFeatureId);
}

export function toggleCategory(categoryId: string) {
  const allowed = new Set(state.categories.map((item) => item.id));
  if (!allowed.has(categoryId)) {
    return;
  }

  const index = state.selectedCategoryIds.indexOf(categoryId);
  if (index >= 0) {
    state.selectedCategoryIds.splice(index, 1);
  } else {
    state.selectedCategoryIds.push(categoryId);
  }

  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);
}

export function clearCategories() {
  state.selectedCategoryIds = [];
  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);
}

export function setCity(cityCode: string) {
  const allowed = new Set(state.cities.map((item) => item.code));
  if (!allowed.has(cityCode)) {
    return;
  }

  state.cityCode = cityCode;
  saveLocal(CITY_KEY, cityCode);
}

export function setSelectedFeature(featureId: string | null) {
  if (featureId === null) {
    state.selectedFeatureId = null;
    saveLocal(FEATURE_KEY, state.selectedFeatureId);
    return;
  }
  const allowed = new Set(state.features.map((item) => item.id));
  if (!allowed.has(featureId)) {
    return;
  }
  state.selectedFeatureId = featureId;
  saveLocal(FEATURE_KEY, featureId);
}
