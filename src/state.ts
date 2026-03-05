import { reactive, computed } from "vue";
import dicts from "./mocks/dicts.json";
import { loadLocal, saveLocal } from "./utils/storage";

export type ThemeId = (typeof dicts)["themes"][number]["id"];

const THEME_KEY = "autoteka_theme";
const CITY_KEY = "autoteka_city";
const CATEGORIES_KEY = "autoteka_categories";
const FEATURE_KEY = "autoteka_feature";
const THEME_EDITOR_ENABLED_KEY = "autoteka_theme_editor_enabled";

const cityIds = new Set(dicts.cities.map((c) => c.id));
const categorySet = new Set(dicts.categories);
const featureSet = new Set(dicts.features);
const themeIds = new Set(dicts.themes.map((t) => t.id));

const fallbackCityId = dicts.cities.find((c) => c.isDefault)?.id ?? dicts.cities[0].id;
const fallbackFeature = dicts.defaultFeature;

function sanitizeTheme(theme: string): ThemeId {
  return (themeIds.has(theme) ? theme : "a-neutral") as ThemeId;
}

function sanitizeCity(cityId: string): string {
  return cityIds.has(cityId) ? cityId : fallbackCityId;
}

function sanitizeCategories(categories: unknown): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter((c): c is string => typeof c === "string" && categorySet.has(c))
    .filter((c, i, arr) => arr.indexOf(c) === i);
}

function sanitizeFeature(feature: string): string {
  return featureSet.has(feature) ? feature : fallbackFeature;
}

const defaultTheme = sanitizeTheme(loadLocal<string>(THEME_KEY, "a-neutral"));
const defaultCityId = sanitizeCity(loadLocal<string>(CITY_KEY, fallbackCityId));
const defaultCategories = sanitizeCategories(loadLocal<unknown>(CATEGORIES_KEY, []));
const defaultFeature = sanitizeFeature(loadLocal<string>(FEATURE_KEY, fallbackFeature));
const defaultThemeEditorEnabled = loadLocal<boolean>(THEME_EDITOR_ENABLED_KEY, import.meta.env.DEV);

export const state = reactive({
  theme: defaultTheme,
  menuOpen: false,
  themeEditorOpen: false,
  themeEditorEnabled: defaultThemeEditorEnabled,

  cityId: defaultCityId,
  selectedCategories: defaultCategories,
  selectedFeature: defaultFeature
});

export function setTheme(themeId: ThemeId) {
  state.theme = themeId;
  saveLocal(THEME_KEY, themeId);
}

export function toggleCategory(cat: string) {
  const i = state.selectedCategories.indexOf(cat);
  if (i >= 0) state.selectedCategories.splice(i, 1);
  else state.selectedCategories.push(cat);
  saveLocal(CATEGORIES_KEY, state.selectedCategories);
}

export function setCity(cityId: string) {
  const next = sanitizeCity(cityId);
  state.cityId = next;
  saveLocal(CITY_KEY, next);
}

export function setFeature(feature: string) {
  const next = sanitizeFeature(feature);
  state.selectedFeature = next;
  saveLocal(FEATURE_KEY, next);
}

export const activeThemeMeta = computed(() => dicts.themes.find((t) => t.id === state.theme));
