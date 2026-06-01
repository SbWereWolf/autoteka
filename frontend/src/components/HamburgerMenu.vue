<template>
  <div v-if="state.menuOpen" class="fixed inset-0 z-[60]">
    <button
      class="absolute inset-0 h-full w-full"
      :style="overlayStyle"
      aria-label="Закрыть меню"
      type="button"
      @click="closeMenu"
    />

    <aside
      ref="dialogRef"
      class="catalog-menu-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
      tabindex="-1"
      @click.stop
    >
      <div class="catalog-menu-header">
        <h2 id="filters-title" class="catalog-menu-title">Фильтры</h2>
        <button
          class="catalog-close-button ui-bounce"
          aria-label="Закрыть"
          type="button"
          @click="closeMenu"
        >
          <span class="text-2xl leading-none">×</span>
        </button>
      </div>

      <div class="catalog-menu-content">
        <section class="space-y-3">
          <h3 class="catalog-menu-label">Город</h3>
          <CitySelect aria-label="Город" test-id="menu-city-select" />
        </section>

        <section class="space-y-3">
          <h3 class="catalog-menu-label">Категории</h3>
          <CategoryChips />
        </section>
      </div>

      <div class="catalog-menu-footer">
        <button
          type="button"
          class="catalog-state-cta w-full"
          @click="closeMenu"
        >
          Найти
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { state } from "../state";
import CitySelect from "./CitySelect.vue";
import CategoryChips from "./CategoryChips.vue";
import { useFocusTrap } from "../composables/useFocusTrap";

const dialogRef = ref<HTMLElement | null>(null);

const overlayStyle = computed(() => ({
  background:
    "linear-gradient(180deg, oklch(1 0 0 / 0.82), oklch(1 0 0 / 0.72))",
  border: "none",
}));

function closeMenu() {
  state.menuOpen = false;
}

const open = computed(() => state.menuOpen);

useFocusTrap({
  open,
  dialogRef,
  onClose: closeMenu,
  fallbackSelector: "[data-menu-button]",
});

watch(open, (isOpen) => {
  document.body.style.overflow = isOpen ? "hidden" : "";
});
</script>
