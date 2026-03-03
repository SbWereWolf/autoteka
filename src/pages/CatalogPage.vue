<template>
  <div class="app-container pb-10 3xl:pb-16">
    <div class="pt-4">
      <div class="text-panel">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Каталог магазинов</div>
            <div class="mt-2">
              <CitySelect class="max-w-[14rem]" />
            </div>
          </div>
          <div class="text-xs" :style="{ color: 'var(--muted)' }">
            {{ sorted.length }} шт.
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 sm:gap-3 3xl:grid-cols-3 3xl:gap-8 7xl:grid-cols-4 7xl:gap-10">
        <ShopTile
          v-for="(s, i) in sorted"
          :key="s.id"
          :shop="s"
          :seed="i + seedBase"
          @open="go(s.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CitySelect from "../components/CitySelect.vue";
import { computed } from "vue";
import { useRouter } from "vue-router";
import shops from "../mocks/shops";
import dicts from "../mocks/dicts.json";
import { state } from "../state";
import { sortShopsByRules } from "../utils/sortShops";
import ShopTile from "../components/ShopTile.vue";

const router = useRouter();

const cityName = computed(() => dicts.cities.find(c => c.id === state.cityId)?.name ?? "—");

const visible = computed(() => (shops as any[]).filter(s => s.city === state.cityId));

const sorted = computed(() => sortShopsByRules({
  shops: visible.value as any,
  selectedCategories: state.selectedCategories,
  selectedFeature: state.selectedFeature
}));

const seedBase = computed(() => state.cityId.length * 17);

function go(id: string) {
  router.push({ name: "shop", params: { id } });
}
</script>
