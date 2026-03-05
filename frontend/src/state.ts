import { computed, reactive } from "vue";
import themeList from "./mocks/theme-list.json";
import type { Category, City, Feature } from "./types";
import { loadLocal, saveLocal } from "./utils/storage";

export type ThemeId = string;

const THEME_KEY = "autoteka_theme";
const CITY_KEY = "autoteka_city";
const CATEGORIES_KEY = "autoteka_categories";
const FEATURE_KEY = "autoteka_feature";
const THEME_EDITOR_ENABLED_KEY = "autoteka_theme_editor_enabled";

type AppState = {
  theme: ThemeId;
  menuOpen: boolean;
  themeEditorOpen: boolean;
  themeEditorEnabled: boolean;
  cityCode: string;
  selectedCategoryCodes: string[];
  selectedFeatureCode: string;
  cities: City[];
  categories: Category[];
  features: Feature[];
};

export const state = reactive<AppState>({
  theme: "a-neutral",
  menuOpen: false,
  themeEditorOpen: false,
  themeEditorEnabled: false,
  cityCode: "",
  selectedCategoryCodes: [],
  selectedFeatureCode: "",
  cities: [],
  categories: [],
  features: [],
});

function stableSort<T extends { code: string; sort: number }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.sort - b.sort || a.code.localeCompare(b.code, "ru"),
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

export function initState(params: {
  cities: City[];
  categories: Category[];
  features: Feature[];
  defaultThemeId?: ThemeId;
}) {
  state.cities = stableSort(params.cities);
  state.categories = stableSort(params.categories);
  state.features = stableSort(params.features);

  const citySet = new Set(state.cities.map((city) => city.code));
  const categorySet = new Set(
    state.categories.map((category) => category.code),
  );
  const featureSet = new Set(
    state.features.map((feature) => feature.code),
  );
  const themeSet = new Set(themeList.map((theme) => theme.id));

  const fallbackCityCode = state.cities[0]?.code ?? "";
  const fallbackFeatureCode = state.features[0]?.code ?? "";
  const fallbackThemeId = params.defaultThemeId ?? "a-neutral";

  const rawTheme = loadLocal<string>(THEME_KEY, fallbackThemeId);
  state.theme = (
    themeSet.has(rawTheme) ? rawTheme : fallbackThemeId
  ) as ThemeId;
  saveLocal(THEME_KEY, state.theme);

  const rawCityCode = loadLocal<string>(CITY_KEY, fallbackCityCode);
  state.cityCode = citySet.has(rawCityCode)
    ? rawCityCode
    : fallbackCityCode;
  saveLocal(CITY_KEY, state.cityCode);

  const rawCategories = loadLocal<unknown>(CATEGORIES_KEY, []);
  state.selectedCategoryCodes = sanitizeFromSet(
    rawCategories,
    categorySet,
  );
  saveLocal(CATEGORIES_KEY, state.selectedCategoryCodes);

  const rawFeatureCode = loadLocal<string>(
    FEATURE_KEY,
    fallbackFeatureCode,
  );
  state.selectedFeatureCode = featureSet.has(rawFeatureCode)
    ? rawFeatureCode
    : fallbackFeatureCode;
  saveLocal(FEATURE_KEY, state.selectedFeatureCode);

  state.themeEditorEnabled = loadLocal<boolean>(
    THEME_EDITOR_ENABLED_KEY,
    import.meta.env.DEV,
  );
}

export function setTheme(themeId: ThemeId) {
  state.theme = themeId;
  saveLocal(THEME_KEY, themeId);
}

export function toggleCategory(categoryCode: string) {
  const i = state.selectedCategoryCodes.indexOf(categoryCode);
  if (i >= 0) state.selectedCategoryCodes.splice(i, 1);
  else state.selectedCategoryCodes.push(categoryCode);
  saveLocal(CATEGORIES_KEY, state.selectedCategoryCodes);
}

export function setCity(cityCode: string) {
  state.cityCode = cityCode;
  saveLocal(CITY_KEY, cityCode);
}

export function setFeature(featureCode: string) {
  state.selectedFeatureCode = featureCode;
  saveLocal(FEATURE_KEY, featureCode);
}

export const activeThemeMeta = computed(() =>
  themeList.find((theme) => theme.id === state.theme),
);
