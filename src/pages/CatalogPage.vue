<template>
  <div class="mx-auto max-w-6xl px-3 xs:px-3 sm:px-4 3xl:px-6 7xl:px-8 pb-10">
    <div class="pt-4">
      <!-- Header block with its own background for readability -->
      <div class="text-panel p-3 ui-transition">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Каталог магазинов</div>
            <div class="text-lg font-semibold" :style="{ color: 'var(--text)' }">{{ cityName }}</div>
          </div>
          <div class="text-xs" :style="{ color: 'var(--muted)' }">
            {{ sorted.length }} шт.
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 3xl:grid-cols-3 7xl:grid-cols-4">
        <ShopTile
          v-for="(s, i) in sorted"
          :key="s.id"
          :name="s.name"
          :seed="i + seedBase"
          @open="go(s.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import shops from "../mocks/shops.json";
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
