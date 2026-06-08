<template>
  <RouterLink
    class="catalog-shop-tile ui-bounce"
    :to="{ name: 'shop', params: { code: shop.code } }"
    :aria-label="shop.thumbUrl ? undefined : shop.title"
  >
    <UiImage
      v-if="shop.thumbUrl"
      class="h-full w-full"
      img-class="catalog-shop-tile-media"
      :src="shop.thumbUrl"
      :alt="shop.title"
      loading="lazy"
      decoding="async"
      error-text="Нет логотипа"
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
import UiImage from "./UiImage.vue";

defineProps<{
  shop: {
    code: string;
    title: string;
    thumbUrl?: string;
  };
  seed: number;
}>();
</script>
