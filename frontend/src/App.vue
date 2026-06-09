<template>
  <div
    class="app min-h-screen"
    :class="shellClass"
    :style="{ color: 'var(--text)' }"
  >
    <div :inert="(state.menuOpen && !isDesktop) || state.sortOpen">
      <TopBar v-if="isCatalog" />

      <main>
        <router-view />
      </main>
    </div>

    <HamburgerMenu v-if="isCatalog" />
    <CatalogSortSheet v-if="isCatalog && !isDesktop" />

    <span class="sr-only" role="status" aria-live="polite">
      {{ announcerMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import TopBar from "./components/TopBar.vue";
import HamburgerMenu from "./components/HamburgerMenu.vue";
import CatalogSortSheet from "./components/CatalogSortSheet.vue";
import { useAnnouncer } from "./composables/useAnnouncer";
import { useIsDesktop } from "./composables/useIsDesktop";
import { state } from "./state";

const { isDesktop } = useIsDesktop();

const route = useRoute();
const { message: announcerMessage } = useAnnouncer();

const isCatalog = computed(() => route.name === "catalog");
const isShop = computed(() => route.name === "shop");
const shellClass = computed(() => {
  let result = "";
  switch (true) {
    case isCatalog.value:
      result = "app-catalog-shell";
      break;
    case isShop.value:
      result = "app-shop-shell";
      break;
  }

  return result;
});
</script>
