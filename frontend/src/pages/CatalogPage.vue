<template>
  <div class="app-container pb-28" >
    <div
      class="catalog-grid-shell"
      data-testid="catalog-grid-shell"
    >
      <div
        v-if="!isLoading && !loadError && sorted.length > 0"
        class="catalog-grid"
      >
        <ShopTile
          v-for="(shop, index) in sorted"
          :key="shop.code"
          :shop="shop"
          :seed="index + seedBase"
          @open="go(shop.code)"
        />
      </div>

      <div
        v-else-if="isLoading"
        class="catalog-grid"
        aria-busy="true"
        aria-live="polite"
      >
        <div
          v-for="i in 8"
          :key="`catalog-skeleton-${i}`"
          class="catalog-shop-tile"
        >
          <div class="absolute inset-0 ui-skeleton" aria-hidden="true" />
        </div>
      </div>

      <div v-else-if="loadError" class="mt-6">
        <ErrorStatePanel
          message="Не удалось загрузить каталог. Проверьте соединение и попробуйте снова."
          @retry="loadCityShops"
        />
      </div>

      <div
        v-else
        class="mt-6 text-sm text-slate-500"
      >
        В этом городе пока нет магазинов.
      </div>

      <CatalogFeatureStickySelect v-if="!loadError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../api/HttpApiClient";
import { state } from "../state";
import { sortShopsByRules } from "../utils/sortShops";
import ShopTile from "../components/ShopTile.vue";
import CatalogFeatureStickySelect from "../components/CatalogFeatureStickySelect.vue";
import type { Shop } from "../types";
import { ApiError } from "../api/ApiClient";
import ErrorStatePanel from "../components/ErrorStatePanel.vue";

const router = useRouter();
const cityShops = ref<Shop[]>([]);
const isLoading = ref(false);
const loadError = ref(false);

async function loadCityShops() {
  isLoading.value = true;
  loadError.value = false;
  try {
    const response = await apiClient.getCityShops(state.cityCode);
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
    selectedCategoryIds: state.selectedCategoryIds,
    selectedFeatureId: state.selectedFeatureId,
  }),
);

const seedBase = computed(() => state.cityCode.length * 17);

function go(code: string) {
  router.push({ name: "shop", params: { code } });
}

watch(
  () => state.cityCode,
  () => {
    loadCityShops();
  },
);

onMounted(() => {
  loadCityShops();
});
</script>
