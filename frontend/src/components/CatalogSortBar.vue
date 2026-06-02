<template>
  <div class="catalog-sort-bar" data-testid="catalog-sort-bar">
    <button
      type="button"
      class="catalog-sort-bar-button"
      data-sort-trigger
      aria-haspopup="dialog"
      :aria-expanded="state.sortOpen"
      @click="openSheet"
    >
      Сортировка: {{ currentLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, SORT_MODE_LABELS } from "../state";

const currentLabel = computed(() => SORT_MODE_LABELS[state.sortMode]);

function openSheet() {
  state.sortOpen = true;
}
</script>
