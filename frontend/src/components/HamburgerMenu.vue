<template>
  <Teleport
    defer
    to="#catalog-sidebar-slot"
    :disabled="!isDesktop"
  >
    <div
      v-if="isDesktop || state.menuOpen"
      :class="wrapperClass"
    >
      <button
        v-if="!isDesktop && state.menuOpen"
        class="absolute inset-0 h-full w-full"
        :style="overlayStyle"
        aria-label="Закрыть меню"
        type="button"
        @click="closeMenu"
      />

      <aside
        ref="dialogRef"
        class="catalog-menu-panel"
        :class="{ 'catalog-menu-panel--sidebar': isDesktop }"
        :role="isDesktop ? undefined : 'dialog'"
        :aria-modal="isDesktop ? undefined : 'true'"
        :aria-labelledby="isDesktop ? undefined : 'filters-title'"
        :aria-label="isDesktop ? 'Фильтры' : undefined"
        :tabindex="isDesktop ? undefined : -1"
        @click.stop
      >
        <div class="catalog-menu-header">
          <h2
            id="filters-title"
            class="catalog-menu-title"
          >
            Фильтры
          </h2>
          <button
            v-if="!isDesktop"
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

        <div v-if="!isDesktop" class="catalog-menu-footer">
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
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { state } from "../state";
import CitySelect from "./CitySelect.vue";
import CategoryChips from "./CategoryChips.vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useIsDesktop } from "../composables/useIsDesktop";

const dialogRef = ref<HTMLElement | null>(null);
const { isDesktop } = useIsDesktop();

const overlayStyle = computed(() => ({
  background:
    "linear-gradient(180deg, oklch(1 0 0 / 0.82), oklch(1 0 0 / 0.72))",
  border: "none",
}));

const wrapperClass = computed(() =>
  isDesktop.value
    ? "catalog-sidebar-host"
    : "fixed inset-0 z-[60]",
);

function closeMenu() {
  state.menuOpen = false;
}

const drawerOpen = computed(
  () => !isDesktop.value && state.menuOpen,
);

useFocusTrap({
  open: drawerOpen,
  dialogRef,
  onClose: closeMenu,
  fallbackSelector: "[data-menu-button]",
});

watch([drawerOpen], ([isDrawer]) => {
  document.body.style.overflow = isDrawer ? "hidden" : "";
});
</script>
