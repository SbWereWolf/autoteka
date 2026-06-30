<template>
  <div class="catalog-offers-bar" data-testid="catalog-offers-bar">
    <button
      type="button"
      class="catalog-offers-bar-button"
      data-offers-trigger
      aria-haspopup="dialog"
      :aria-expanded="state.offersOpen"
      @click="openSheet"
    >
      {{ buttonLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state } from "../state";

const buttonLabel = computed(() =>
  state.selectedFeatureId
    ? (state.features.find((f) => f.id === state.selectedFeatureId)?.title ??
      "Акции")
    : "Акции",
);

function openSheet() {
  state.offersOpen = true;
}
</script>
