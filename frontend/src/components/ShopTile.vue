<template>
  <RouterLink
    class="catalog-shop-tile ui-bounce"
    :to="{ name: 'shop', params: { code: shop.code } }"
  >
    <div class="catalog-shop-tile-logo">
      <UiImage
        v-if="shop.thumbUrl"
        class="h-full w-full"
        img-class="catalog-shop-tile-media"
        :src="shop.thumbUrl"
        alt=""
        loading="lazy"
        decoding="async"
        error-text="Нет логотипа"
      />

      <span
        v-else
        class="catalog-shop-tile-placeholder"
        aria-hidden="true"
      >
        Нет логотипа
      </span>
    </div>

    <span class="catalog-shop-tile-title">{{ shop.title }}</span>
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
