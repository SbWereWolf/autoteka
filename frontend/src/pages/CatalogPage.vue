<template>
  <div class="app-container pb-10 3xl:pb-16">
    <div class="pt-4">
      <div class="text-panel">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Каталог магазинов
            </div>
            <div class="mt-2">
              <CitySelect class="max-w-[14rem]" />
            </div>
          </div>
          <div class="text-xs" :style="{ color: 'var(--muted)' }">
            {{ countText }}
          </div>
        </div>
      </div>

      <div
        class="mt-4 grid grid-cols-2 gap-2 sm:gap-3 3xl:grid-cols-3 3xl:gap-8 7xl:grid-cols-4 7xl:gap-10"
        v-if="!isLoading && !loadError && sorted.length > 0"
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
        class="mt-4 grid grid-cols-2 gap-2 sm:gap-3 3xl:grid-cols-3 3xl:gap-8 7xl:grid-cols-4 7xl:gap-10"
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
          <div
            class="relative z-10 h-full flex items-end p-3"
            aria-hidden="true"
          >
            <div
              class="ui-skeleton w-3/4 h-6 rounded-2xl"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div v-else-if="loadError" class="mt-4 text-panel space-y-4">
        <p class="text-sm" :style="{ color: 'var(--muted)' }">
          Не удалось загрузить каталог.
        </p>
        <button
          type="button"
          class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
          @click="loadCityShops"
        >
          Повторить
        </button>
      </div>
      <div
        v-else
        class="mt-4 text-sm"
        :style="{ color: 'var(--muted)' }"
      >
        В этом городе пока нет магазинов.
      </div>

      <CssVarsEditor />
    </div>
  </div>
</template>

<script setup lang="ts">
import CitySelect from "../components/CitySelect.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../api/HttpApiClient";
import { state } from "../state";
import { sortShopsByRules } from "../utils/sortShops";
import ShopTile from "../components/ShopTile.vue";
import CssVarsEditor from "../components/CssVarsEditor.vue";
import type { Shop } from "../types";
import { ApiError } from "../api/ApiClient";

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

const countText = computed(() => {
  if (isLoading.value) return "—";
  return `${sorted.value.length} шт.`;
});

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
