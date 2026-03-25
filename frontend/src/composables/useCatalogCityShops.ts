import {
  computed,
  onMounted,
  ref,
  watch,
  toValue,
  type MaybeRefOrGetter,
} from "vue";
import { apiClient } from "../api/HttpApiClient";
import { ApiError } from "../api/ApiClient";
import { sortShopsByRules } from "../utils/sortShops";
import type { Shop } from "../types";

export type CatalogCityShopsSources = {
  cityCode: MaybeRefOrGetter<string>;
  selectedCategoryIds: MaybeRefOrGetter<string[]>;
  selectedFeatureId: MaybeRefOrGetter<string>;
};

export function useCatalogCityShops(sources: CatalogCityShopsSources) {
  const cityShops = ref<Shop[]>([]);
  const isLoading = ref(false);
  const loadError = ref(false);

  async function loadCityShops() {
    isLoading.value = true;
    loadError.value = false;
    try {
      const response = await apiClient.getCityShops(
        toValue(sources.cityCode),
      );
      cityShops.value = response.items;
    } catch (error) {
      cityShops.value = [];
      if (error instanceof ApiError && error.status === 404) {
        loadError.value = false;
        return;
      }
      loadError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  const sorted = computed(() =>
    sortShopsByRules({
      shops: cityShops.value,
      selectedCategoryIds: toValue(sources.selectedCategoryIds),
      selectedFeatureId: toValue(sources.selectedFeatureId),
    }),
  );

  const seedBase = computed(
    () => toValue(sources.cityCode).length * 17,
  );

  watch(
    () => toValue(sources.cityCode),
    () => {
      loadCityShops();
    },
  );

  onMounted(() => {
    loadCityShops();
  });

  return {
    sorted,
    seedBase,
    isLoading,
    loadError,
    loadCityShops,
  };
}
