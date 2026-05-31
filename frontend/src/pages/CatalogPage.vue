<template>
  <div class="catalog-grid-shell" data-testid="catalog-grid-shell">
    <div class="catalog-head">
      <h1 class="catalog-title">Каталог</h1>
      <span v-if="currentCityTitle" class="catalog-city">
        · {{ currentCityTitle }}
      </span>
    </div>

    <CatalogFilterChips />

    <div
      v-if="!isLoading && !loadError && sorted.length > 0"
      class="catalog-grid"
    >
      <ShopTile
        v-for="(shop, index) in sorted"
        :key="shop.code"
        :shop="shop"
        :seed="index + seedBase"
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

    <div v-else class="mt-6 text-sm text-slate-500">
      В этом городе пока нет магазинов.
    </div>

    <CatalogFeatureStickySelect v-if="!loadError" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ShopTile from "../components/ShopTile.vue";
import CatalogFeatureStickySelect from "../components/CatalogFeatureStickySelect.vue";
import CatalogFilterChips from "../components/CatalogFilterChips.vue";
import ErrorStatePanel from "../components/ErrorStatePanel.vue";
import { useCatalogCityShops } from "../composables/useCatalogCityShops";
import { state } from "../state";

const { sorted, seedBase, isLoading, loadError, loadCityShops } =
  useCatalogCityShops({
    cityCode: () => state.cityCode,
    selectedCategoryIds: () => state.selectedCategoryIds,
    selectedFeatureId: () => state.selectedFeatureId,
  });

const currentCityTitle = computed(
  () =>
    state.cities.find((c) => c.code === state.cityCode)?.title ?? "",
);
</script>
