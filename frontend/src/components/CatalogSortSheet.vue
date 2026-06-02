<template>
  <div v-if="state.offersOpen" class="fixed inset-0 z-[60]">
    <button
      class="catalog-sort-sheet-overlay-button"
      aria-label="Закрыть"
      type="button"
      @click="closeSheet"
    />

    <aside
      ref="dialogRef"
      class="catalog-sort-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sort-title"
      tabindex="-1"
      @click.stop
    >
      <div class="catalog-sort-sheet-handle" aria-hidden="true">
        <div class="catalog-sort-sheet-handle-bar" />
      </div>
      <header class="catalog-sort-sheet-header">
        <h2 id="sort-title" class="catalog-sort-sheet-title">
          Сортировка
        </h2>
        <button
          class="catalog-close-button ui-bounce"
          aria-label="Закрыть"
          type="button"
          @click="closeSheet"
        >
          <span class="text-2xl leading-none">×</span>
        </button>
      </header>
      <ul class="catalog-sort-options" role="list">
        <li v-for="feature in features" :key="feature.id">
          <button
            type="button"
            class="catalog-sort-option"
            :aria-current="
              feature.id === state.selectedFeatureId
                ? 'true'
                : undefined
            "
            @click="selectFeature(feature.id, feature.title)"
          >
            <span>{{ feature.title }}</span>
            <svg
              v-if="feature.id === state.selectedFeatureId"
              class="catalog-sort-option-check"
              width="18"
              height="18"
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
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { setFeature, state } from "../state";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useAnnouncer } from "../composables/useAnnouncer";

const dialogRef = ref<HTMLElement | null>(null);
const features = computed(() => state.features);
const open = computed(() => state.offersOpen);

const { announce } = useAnnouncer();

function closeSheet() {
  state.offersOpen = false;
}

function selectFeature(id: string, title: string) {
  setFeature(id);
  announce(`Сортировка: ${title}`);
  closeSheet();
}

useFocusTrap({
  open,
  dialogRef,
  onClose: closeSheet,
  fallbackSelector: "[data-sort-trigger]",
});
</script>
