<template>
  <div>
    <div
      v-if="state.menuOpen"
      class="fixed inset-0 z-50"
      @click.self="state.menuOpen = false"
    >
      <div class="absolute inset-0" :style="overlayStyle"></div>

      <aside
        class="absolute top-0 left-0 h-full w-[86%] max-w-sm ui-transition"
        :style="panelStyle"
      >
        <div class="h-14 flex items-center justify-between px-4 border-b"
             :style="{ borderColor: 'color-mix(in oklch, var(--text) 10%, transparent)' }">
          <div class="text-sm font-semibold" :style="{ color: 'var(--text)' }">Меню</div>
          <button
            class="ui-transition rounded-xl px-3 py-2"
            :style="btnStyle"
            @click="state.menuOpen = false"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div class="p-4 space-y-5 overflow-y-auto h-[calc(100%-56px)]">
          <section class="space-y-2">
            <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Город</div>
            <CitySelect />
          </section>

          <section class="space-y-2">
            <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Категории</div>
            <CategoryChips />
          </section>

          <section class="space-y-2">
            <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Фишка</div>
            <FeatureSelect />
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state } from "../state";
import CitySelect from "./CitySelect.vue";
import CategoryChips from "./CategoryChips.vue";
import FeatureSelect from "./FeatureSelect.vue";

const overlayStyle = computed(() => ({
  background: "oklch(0.0% 0.0 0.0 / 0.35)"
}));

const panelStyle = computed(() => ({
  background: "color-mix(in oklch, var(--bg) 88%, transparent)",
  backdropFilter: "blur(var(--blur))",
  boxShadow: "var(--shadow)"
}));

const btnStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)"
}));
</script>
