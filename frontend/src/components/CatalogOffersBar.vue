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
      Акции
    </button>
  </div>
</template>

<script setup lang="ts">
import { state } from "../state";

function openSheet() {
  state.offersOpen = true;
}
</script>
