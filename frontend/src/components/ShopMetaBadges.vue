<template>
  <div
    class="shop-feature-badges"
    data-testid="shop-feature-badges"
  >
    <span
      v-for="category in categories"
      :key="`category-${category}`"
      class="shop-feature-badge shop-feature-badge--category"
    >
      {{ category }}
    </span>
    <span
      v-for="feature in features"
      :key="`feature-${feature}`"
      class="shop-feature-badge shop-feature-badge--feature"
    >
      {{ feature }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  categories: string[];
  features: string[];
}>();
</script>
