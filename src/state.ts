import { reactive, computed } from "vue";
import dicts from "./mocks/dicts.json";
import { loadLocal, saveLocal } from "./utils/storage";

export type ThemeId = (typeof dicts)["themes"][number]["id"];

const THEME_KEY = "autoteka_theme";

const defaultCityId = dicts.cities.find((c) => c.isDefault)?.id ?? dicts.cities[0].id;
const defaultTheme: ThemeId = (loadLocal<ThemeId>(THEME_KEY, "a-neutral"));

export const state = reactive({
  theme: defaultTheme as ThemeId,
  menuOpen: false,

  cityId: defaultCityId as string,
  selectedCategories: [] as string[],
  selectedFeature: dicts.defaultFeature as string
});

export function setTheme(themeId: ThemeId) {
  state.theme = themeId;
  saveLocal(THEME_KEY, themeId);
}

export function toggleCategory(cat: string) {
  const i = state.selectedCategories.indexOf(cat);
  if (i >= 0) state.selectedCategories.splice(i, 1);
  else state.selectedCategories.push(cat);
}

export function setCity(cityId: string) {
  state.cityId = cityId;
}

export function setFeature(feature: string) {
  state.selectedFeature = feature;
}

export const activeThemeMeta = computed(() => dicts.themes.find((t) => t.id === state.theme));
