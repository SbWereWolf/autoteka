<template>
  <RouterLink
    class="catalog-shop-tile ui-bounce"
    :to="{ name: 'shop', params: { code: shop.code } }"
    :aria-label="shop.thumbUrl ? undefined : shop.title"
  >
    <img
      v-if="shop.thumbUrl"
      class="catalog-shop-tile-media"
      :src="shop.thumbUrl"
      :alt="shop.title"
      loading="lazy"
      decoding="async"
    />

    <div
      v-else
      class="catalog-shop-tile-placeholder"
      aria-hidden="true"
    >
      <span>Нет логотипа</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{
  shop: {
    code: string;
    title: string;
    thumbUrl?: string;
  };
  seed: number;
}>();
</script>
