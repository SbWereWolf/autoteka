<template>
  <div class="app app-pattern min-h-screen" :class="themeClass" :style="{ color: 'var(--text)' }">
    <TopBar />
    <HamburgerMenu />

    <main class="pt-14 xs:pt-14">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state } from "./state";
import TopBar from "./components/TopBar.vue";
import HamburgerMenu from "./components/HamburgerMenu.vue";

const themeClass = computed(() => `theme-${state.theme}`);
</script>

<style scoped>
/* Keep top bar height in sync with padding-top in App */
</style>
