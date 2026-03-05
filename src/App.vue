<template>
  <div
    ref="appEl"
    class="app app-pattern min-h-screen"
    :class="themeClass"
    :style="{ color: 'var(--text)' }"
  >
    <TopBar />
    <HamburgerMenu />

    <main class="pt-14 xs:pt-14">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { state } from "./state";
import TopBar from "./components/TopBar.vue";
import HamburgerMenu from "./components/HamburgerMenu.vue";
import { applyThemeOverrides, removeThemeOverridesFromApp } from "./utils/themeOverrides";

const themeClass = computed(() => `theme-${state.theme}`);
const appEl = ref<HTMLElement | null>(null);

function applyFor(theme: typeof state.theme) {
  if (!appEl.value) return;
  applyThemeOverrides(appEl.value, theme);
}

function clearFor(theme: typeof state.theme) {
  if (!appEl.value) return;
  removeThemeOverridesFromApp(appEl.value, theme);
}

onMounted(() => {
  applyFor(state.theme);
});

watch(
  () => state.theme,
  (next, prev) => {
    if (prev) clearFor(prev);
    applyFor(next);
  },
  { flush: "post" },
);
</script>

<style scoped>
/* Keep top bar height in sync with padding-top in App */
</style>
