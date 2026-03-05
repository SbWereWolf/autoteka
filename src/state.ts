import { computed, reactive } from "vue";
import dicts from "./mocks/dicts.json";
import type { Category, City, Feature } from "./types";
import { loadLocal, saveLocal } from "./utils/storage";

export type ThemeId = (typeof dicts)["themes"][number]["id"];

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
  cityId: string;
  selectedCategoryIds: string[];
  selectedFeatureId: string;
  cities: City[];
  categories: Category[];
  features: Feature[];
};

export const state = reactive<AppState>({
  theme: "a-neutral",
  menuOpen: false,
  themeEditorOpen: false,
  themeEditorEnabled: false,
  cityId: "",
  selectedCategoryIds: [],
  selectedFeatureId: "",
  cities: [],
  categories: [],
  features: [],
});

function stableSort<T extends { id: string; sort: number }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.sort - b.sort || a.id.localeCompare(b.id, "ru"),
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

  const citySet = new Set(state.cities.map((city) => city.id));
  const categorySet = new Set(
    state.categories.map((category) => category.id),
  );
  const featureSet = new Set(
    state.features.map((feature) => feature.id),
  );
  const themeSet = new Set(dicts.themes.map((theme) => theme.id));

  const fallbackCityId = state.cities[0]?.id ?? "";
  const fallbackFeatureId = state.features[0]?.id ?? "";
  const fallbackThemeId = params.defaultThemeId ?? "a-neutral";

  const rawTheme = loadLocal<string>(THEME_KEY, fallbackThemeId);
  state.theme = (
    themeSet.has(rawTheme) ? rawTheme : fallbackThemeId
  ) as ThemeId;
  saveLocal(THEME_KEY, state.theme);

  const rawCityId = loadLocal<string>(CITY_KEY, fallbackCityId);
  state.cityId = citySet.has(rawCityId) ? rawCityId : fallbackCityId;
  saveLocal(CITY_KEY, state.cityId);

  const rawCategories = loadLocal<unknown>(CATEGORIES_KEY, []);
  state.selectedCategoryIds = sanitizeFromSet(
    rawCategories,
    categorySet,
  );
  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);

  const rawFeatureId = loadLocal<string>(
    FEATURE_KEY,
    fallbackFeatureId,
  );
  state.selectedFeatureId = featureSet.has(rawFeatureId)
    ? rawFeatureId
    : fallbackFeatureId;
  saveLocal(FEATURE_KEY, state.selectedFeatureId);

  state.themeEditorEnabled = loadLocal<boolean>(
    THEME_EDITOR_ENABLED_KEY,
    import.meta.env.DEV,
  );
}

export function setTheme(themeId: ThemeId) {
  state.theme = themeId;
  saveLocal(THEME_KEY, themeId);
}

export function toggleCategory(categoryId: string) {
  const i = state.selectedCategoryIds.indexOf(categoryId);
  if (i >= 0) state.selectedCategoryIds.splice(i, 1);
  else state.selectedCategoryIds.push(categoryId);
  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);
}

export function setCity(cityId: string) {
  state.cityId = cityId;
  saveLocal(CITY_KEY, cityId);
}

export function setFeature(featureId: string) {
  state.selectedFeatureId = featureId;
  saveLocal(FEATURE_KEY, featureId);
}

export const activeThemeMeta = computed(() =>
  dicts.themes.find((theme) => theme.id === state.theme),
);
