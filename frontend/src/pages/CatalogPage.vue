<template>
  <div class="app-container pb-10 3xl:pb-16">
    <div class="pt-4">
      <div
        class="catalog-grid-shell"
        data-testid="catalog-grid-shell"
      >
        <div
          v-if="!isLoading && !loadError && sorted.length > 0"
          class="catalog-grid"
        >
          <ShopTile
            v-for="(s, i) in sorted"
            :key="s.code"
            :shop="s"
            :seed="i + seedBase"
            @open="go(s.code)"
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
            :key="'skeleton-' + i"
            class="relative w-full aspect-square rounded-[var(--radius)] overflow-hidden"
            :style="{
              background: 'var(--surface)',
              border: '0.0625rem solid var(--border)',
              boxShadow: 'var(--shadow)',
            }"
          >
            <div
              class="absolute inset-0 ui-skeleton"
              aria-hidden="true"
            />
            <div class="tile-title-overlay" aria-hidden="true">
              <div class="ui-skeleton h-8 w-3/4 rounded-2xl" />
            </div>
          </div>
        </div>

        <div v-else-if="loadError" class="mt-4">
          <ErrorStatePanel
            message="Не удалось загрузить каталог. Проверьте соединение и попробуйте снова."
            @retry="loadCityShops"
          />
        </div>

        <div
          v-else
          class="text-sm"
          :style="{ color: 'var(--muted)' }"
        >
          В этом городе пока нет магазинов.
        </div>

        <CatalogFeatureStickySelect v-if="!loadError" />
      </div>

      <CssVarsEditor />
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
import CssVarsEditor from "../components/CssVarsEditor.vue";
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
  } catch (err) {
    cityShops.value = [];
    if (err instanceof ApiError && err.status === 404) {
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
