<template>
  <button
    class="catalog-shop-tile ui-bounce"
    type="button"
    @click="$emit('open')"
  >
    <img
      v-if="shop.thumbUrl"
      class="catalog-shop-tile-media"
      :src="shop.thumbUrl"
      alt=""
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />

    <div
      v-else
      class="catalog-shop-tile-placeholder"
      aria-label="Изображение магазина отсутствует"
    >
      <span>Нет логотипа</span>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  shop: { thumbUrl?: string };
  seed: number;
}>();

defineEmits<{ open: [] }>();
</script>
