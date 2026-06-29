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
        class="catalog-menu-overlay absolute inset-0 h-full w-full"
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
            class="catalog-icon-button"
            aria-label="Закрыть фильтры"
            type="button"
            @click="closeMenu"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
        </div>

        <div class="catalog-menu-content">
          <section
            v-if="!isDesktop"
            class="catalog-menu-group catalog-menu-group--city"
          >
            <h3 class="catalog-menu-label">Город</h3>
            <CitySelect aria-label="Город" test-id="menu-city-select" />
          </section>

          <section class="catalog-menu-group catalog-menu-group--categories">
            <h3 class="catalog-menu-label">Категории</h3>
            <div class="catalog-menu-chips">
              <CategoryChips />
            </div>
          </section>

          <section
            v-if="isDesktop"
            class="catalog-menu-group"
          >
            <h3 class="catalog-menu-label">Акции</h3>
            <div class="catalog-menu-chips">
              <div class="catalog-menu-chip-list">
                <button
                  v-for="f in state.features"
                  :key="f.id"
                  type="button"
                  class="catalog-menu-chip"
                  :aria-pressed="state.selectedFeatureId === f.id"
                  @click="onPickFeature(f.id)"
                >
                  <span>{{ f.title }}</span>
                  <svg
                    v-if="state.selectedFeatureId === f.id"
                    class="catalog-menu-chip-check"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M19.2929 5.29302C19.6834 4.90249 20.3164 4.90249 20.707 5.29302C21.0975 5.68354 21.0975 6.31655 20.707 6.70708L9.70696 17.7071C9.31643 18.0976 8.68342 18.0976 8.29289 17.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6835 3.29289 11.293C3.68342 10.9025 4.31643 10.9025 4.70696 11.293L8.99992 15.586L19.2929 5.29302Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
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
import { state, setSelectedFeature } from "../state";
import CitySelect from "./CitySelect.vue";
import CategoryChips from "./CategoryChips.vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useIsDesktop } from "../composables/useIsDesktop";

const dialogRef = ref<HTMLElement | null>(null);
const { isDesktop } = useIsDesktop();

const wrapperClass = computed(() =>
  isDesktop.value
    ? "catalog-sidebar-host"
    : "fixed inset-0 z-[60]",
);

function closeMenu() {
  state.menuOpen = false;
}

function onPickFeature(id: string) {
  setSelectedFeature(state.selectedFeatureId === id ? null : id);
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
