<template>
  <header class="fixed inset-x-0 top-0 z-50 pointer-events-none">
    <div class="app-container pt-2">
      <div class="catalog-topbar pointer-events-auto">
        <button
          data-menu-button
          class="catalog-icon-button ui-bounce"
          aria-label="Открыть меню"
          type="button"
          @click="state.menuOpen = true"
        >
          <span class="catalog-hamburger-line" />
          <span class="catalog-hamburger-line" />
          <span class="catalog-hamburger-line" />
          <span class="catalog-hamburger-line" />
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
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { state } from "../state";
</script>
