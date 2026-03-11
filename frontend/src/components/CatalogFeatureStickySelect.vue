<template>
  <div
    class="catalog-feature-sticky-shell"
    data-testid="catalog-feature-sticky"
  >
    <div class="catalog-feature-sticky-control">
      <label class="sr-only" for="catalog-feature-select"
        >Фишка каталога</label
      >
      <FeatureSelect
        id="catalog-feature-select"
        aria-label="Фишка каталога"
        test-id="catalog-feature-select"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FeatureSelect from "./FeatureSelect.vue";
</script>
