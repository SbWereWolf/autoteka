<template>
  <header class="catalog-topbar">
    <button
      data-menu-button
      class="catalog-icon-button"
      aria-label="Открыть фильтры"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="state.menuOpen"
      @click="state.menuOpen = true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M21 17C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18C2 17.4477 2.44772 17 3 17H21ZM21 11C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12C2 11.4477 2.44772 11 3 11H21ZM21 5C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6C2 5.44772 2.44772 5 3 5H21Z"
        />
      </svg>
    </button>

    <RouterLink
      class="catalog-brand-link"
      :to="{ name: 'catalog' }"
      aria-label="TOauto.ru"
    >
      <img
        class="catalog-brand-logo"
        src="/brand/toauto-logo.png"
        alt="TOauto.ru"
      />
    </RouterLink>

    <CityPill v-if="isDesktop" class="catalog-topbar-city" />
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { state } from "../state";
import CityPill from "./CityPill.vue";
import { useIsDesktop } from "../composables/useIsDesktop";

const { isDesktop } = useIsDesktop();
</script>
