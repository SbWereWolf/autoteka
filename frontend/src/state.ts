import { reactive } from "vue";
import type { Category, City, Feature } from "./types";
import { loadLocal, saveLocal } from "./utils/storage";

const CITY_KEY = "autoteka_city";
const CATEGORIES_KEY = "autoteka_categories";
const SORT_MODE_KEY = "autoteka_sort_mode";

export type SortMode =
  | "default"
  | "promo-first"
  | "fast-delivery-first"
  | "name-asc";

export const SORT_MODES: SortMode[] = [
  "default",
  "promo-first",
  "fast-delivery-first",
  "name-asc",
];

export const SORT_MODE_LABELS: Record<SortMode, string> = {
  default: "По умолчанию",
  "promo-first": "Сначала с акциями",
  "fast-delivery-first": "Сначала с быстрой доставкой",
  "name-asc": "По названию А–Я",
};

type AppState = {
  menuOpen: boolean;
  sortOpen: boolean;
  cityCode: string;
  selectedCategoryIds: string[];
  sortMode: SortMode;
  cities: City[];
  categories: Category[];
  features: Feature[];
};

export const state = reactive<AppState>({
  menuOpen: false,
  sortOpen: false,
  cityCode: "",
  selectedCategoryIds: [],
  sortMode: "default",
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

function sanitizeSortMode(value: unknown): SortMode {
  return SORT_MODES.includes(value as SortMode)
    ? (value as SortMode)
    : "default";
}

export function initState(params: {
  cities: City[];
  categories: Category[];
  features: Feature[];
}) {
  state.cities = stableSort(params.cities);
  state.categories = stableSort(params.categories);
  state.features = stableSort(params.features);

  const citySet = new Set(state.cities.map((city) => city.code));
  const categorySet = new Set(
    state.categories.map((category) => category.id),
  );

  const fallbackCityCode = state.cities[0]?.code ?? "";

  const rawCityCode = loadLocal<string>(CITY_KEY, fallbackCityCode);
  state.cityCode = citySet.has(rawCityCode)
    ? rawCityCode
    : fallbackCityCode;
  saveLocal(CITY_KEY, state.cityCode);

  const rawCategories = loadLocal<unknown>(CATEGORIES_KEY, []);
  state.selectedCategoryIds = sanitizeFromSet(
    rawCategories,
    categorySet,
  );
  saveLocal(CATEGORIES_KEY, state.selectedCategoryIds);

  const rawSortMode = loadLocal<unknown>(SORT_MODE_KEY, "default");
  state.sortMode = sanitizeSortMode(rawSortMode);
  saveLocal(SORT_MODE_KEY, state.sortMode);
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

export function setSortMode(mode: SortMode) {
  if (!SORT_MODES.includes(mode)) {
    return;
  }
  state.sortMode = mode;
  saveLocal(SORT_MODE_KEY, mode);
}
