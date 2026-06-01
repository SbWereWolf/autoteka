<template>
  <div class="catalog-grid-shell" data-testid="catalog-grid-shell">
    <div class="catalog-head">
      <h1 class="catalog-title">Каталог</h1>
      <span v-if="currentCityTitle" class="catalog-city">
        · {{ currentCityTitle }}
      </span>
    </div>

    <CatalogFilterChips
      v-if="viewState === 'results' || viewState === 'loading'"
    />

    <div v-if="viewState === 'results'" class="catalog-grid">
      <ShopTile
        v-for="(shop, index) in sorted"
        :key="shop.code"
        :shop="shop"
        :seed="index + seedBase"
      />
    </div>

    <CatalogSkeleton v-else-if="viewState === 'loading'" />

    <CatalogState
      v-else-if="viewState === 'error'"
      icon="globe"
      title="Не удалось загрузить"
      text="Что-то пошло не так. Попробуйте ещё раз."
    >
      <button
        type="button"
        class="catalog-state-cta"
        @click="loadCityShops"
      >
        Повторить
      </button>
    </CatalogState>

    <CatalogState
      v-else-if="hasActiveFilters"
      icon="sliders"
      title="Ничего не найдено"
      text="Снимите фильтр или измените параметры поиска."
    >
      <CatalogFilterChips />
    </CatalogState>

    <CatalogState
      v-else
      icon="sliders"
      title="Ничего не найдено"
      text="В этом городе пока нет магазинов."
    />

    <CatalogFeatureStickySelect v-if="!loadError" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import ShopTile from "../components/ShopTile.vue";
import CatalogFeatureStickySelect from "../components/CatalogFeatureStickySelect.vue";
import CatalogFilterChips from "../components/CatalogFilterChips.vue";
import CatalogSkeleton from "../components/CatalogSkeleton.vue";
import CatalogState from "../components/CatalogState.vue";
import { useCatalogCityShops } from "../composables/useCatalogCityShops";
import { state } from "../state";
import { useAnnouncer } from "../composables/useAnnouncer";

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

const hasActiveFilters = computed(
  () => state.selectedCategoryIds.length > 0,
);

type ViewState = "loading" | "results" | "empty" | "error";

const viewState = computed<ViewState>(() => {
  if (isLoading.value) return "loading";
  if (loadError.value) return "error";
  if (sorted.value.length === 0) return "empty";
  return "results";
});

const { announce } = useAnnouncer();

watch(viewState, (next, prev) => {
  if (next === prev) return;
  if (next === "loading") announce("Загрузка каталога");
  else if (next === "error") announce("Не удалось загрузить");
  else if (next === "empty") announce("Ничего не найдено");
  else if (next === "results") announce("Каталог загружен");
});
</script>
