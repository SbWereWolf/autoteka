<template>
  <div
    class="catalog-grid catalog-skeleton"
    aria-hidden="true"
    data-testid="catalog-skeleton"
  >
    <div
      v-for="i in tiles"
      :key="`catalog-skeleton-${i}`"
      class="catalog-shop-tile catalog-skeleton-tile"
    >
      <div class="catalog-skel catalog-skeleton-logo" />
      <div class="catalog-skel catalog-skeleton-label" />
    </div>
  </div>
</template>

<script setup lang="ts">
const tiles = 6;
</script>
