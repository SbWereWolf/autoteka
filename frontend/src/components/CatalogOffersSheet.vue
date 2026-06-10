<template>
  <Teleport to="body">
    <div v-if="state.offersOpen" class="fixed inset-0 z-[60]">
      <button
        class="catalog-offers-sheet-overlay-button"
        aria-label="Закрыть"
        type="button"
        @click="closeSheet"
      />

      <aside
        ref="dialogRef"
        class="catalog-offers-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offers-title"
        tabindex="-1"
        @click.stop
      >
        <div class="catalog-offers-sheet-handle" aria-hidden="true">
          <div class="catalog-offers-sheet-handle-bar" />
        </div>
        <header class="catalog-offers-sheet-header">
          <h2 id="offers-title" class="catalog-offers-sheet-title">
            Акции
          </h2>
          <button
            class="catalog-close-button ui-bounce"
            aria-label="Закрыть"
            type="button"
            @click="closeSheet"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
        </header>

        <ul
          v-if="isLoading"
          class="catalog-offers-list"
          aria-busy="true"
        >
          <li
            v-for="n in 4"
            :key="n"
            class="catalog-offer-skeleton catalog-skel"
            aria-hidden="true"
          />
        </ul>

        <ul
          v-else-if="offers.length > 0"
          class="catalog-offers-list"
          role="list"
        >
          <li v-for="(offer, i) in offers" :key="`${offer.shopCode}:${i}`">
            <RouterLink
              class="catalog-offer-row"
              :to="{ name: 'shop', params: { code: offer.shopCode } }"
              @click="closeSheet"
            >
              <span class="catalog-offer-label">{{ offer.label }}</span>
              <span class="catalog-offer-shop">{{ offer.shopTitle }}</span>
            </RouterLink>
          </li>
        </ul>

        <p v-else class="catalog-offers-empty">Пока нет акций</p>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { state } from "../state";
import type { Shop } from "../types";
import { useCatalogOffers } from "../composables/useCatalogOffers";
import { useFocusTrap } from "../composables/useFocusTrap";

const props = defineProps<{ shops: Shop[] }>();

const dialogRef = ref<HTMLElement | null>(null);
const open = computed(() => state.offersOpen);

const { offers, isLoading, loadOffers } = useCatalogOffers(
  () => props.shops,
);

function closeSheet() {
  state.offersOpen = false;
}

watch(open, (isOpen) => {
  if (isOpen) {
    void loadOffers();
  }
});

useFocusTrap({
  open,
  dialogRef,
  onClose: closeSheet,
  fallbackSelector: "[data-offers-trigger]",
});
</script>
