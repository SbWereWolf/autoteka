<template>
  <div
    class="catalog-feature-sticky-shell"
    data-testid="catalog-feature-sticky"
  >
    <div class="catalog-feature-sticky-control">
      <label class="sr-only" for="catalog-feature-select">
        Фишка каталога
      </label>
      <div class="catalog-feature-sticky-affordance">
        <FeatureSelect
          id="catalog-feature-select"
          aria-label="Фишка каталога"
          test-id="catalog-feature-select"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FeatureSelect from "./FeatureSelect.vue";
</script>
