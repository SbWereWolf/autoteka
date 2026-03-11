<template>
  <div class="shop-meta-badges" data-testid="shop-meta-badges">
    <span
      v-for="category in categories"
      :key="`category-${category}`"
      class="shop-meta-badge shop-meta-badge--category"
    >
      {{ category }}
    </span>

    <span
      v-for="feature in features"
      :key="`feature-${feature}`"
      class="shop-meta-badge shop-meta-badge--feature"
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

<style scoped>
.shop-meta-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  border: 0.0625rem solid var(--shop-badge-border);
  background: var(--shop-badge-bg);
  color: var(--shop-badge-text);
  font-size: 0.75rem;
  line-height: 1.1;
  font-weight: 600;
}

.shop-meta-badge--feature {
  border-color: var(--shop-feature-badge-border);
  background: var(--shop-feature-badge-bg);
  color: var(--shop-feature-badge-text);
}
</style>
