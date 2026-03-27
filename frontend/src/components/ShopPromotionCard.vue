<template>
  <article
    class="shop-content-card shop-promo-card"
    data-testid="shop-promo-card"
  >
    <GalleryCarousel
      v-if="promotion.galleryImages.length > 0"
      :items="promotion.galleryImages"
      empty-title=""
      empty-text=""
      test-id="shop-promo-gallery"
    />

    <div class="shop-promo-copy">
      <p class="shop-promo-date">
        Акция до {{ formatPromoDate(promotion.endDate) }}
      </p>
      <h2 class="shop-promo-title">
        {{ promotion.title }}
      </h2>
      <p class="shop-description">
        {{ promotion.description }}
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PromotionPublic } from "../types";
import GalleryCarousel from "./GalleryCarousel.vue";

defineProps<{
  promotion: PromotionPublic;
}>();

function formatPromoDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}
</script>
