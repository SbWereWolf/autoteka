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
      Сначала: {{ currentTitle }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state } from "../state";

const currentTitle = computed(
  () =>
    state.features.find((f) => f.id === state.selectedFeatureId)
      ?.title ?? "",
);

function openSheet() {
  state.sortOpen = true;
}
</script>
