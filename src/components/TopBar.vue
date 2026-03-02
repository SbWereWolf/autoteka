<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div
      class="ui-transition backdrop-blur-md"
      :style="headerStyle"
    >
      <div class="mx-auto max-w-6xl px-3 xs:px-3 sm:px-4 3xl:px-6 7xl:px-8">
        <div class="h-14 flex items-center justify-between gap-3">
          <button
            class="ui-transition inline-flex items-center justify-center rounded-xl px-3 py-2"
            :style="btnStyle"
            @click="state.menuOpen = true"
            aria-label="Открыть меню"
          >
            <span class="text-lg leading-none">≡</span>
          </button>

          <div class="flex-1 min-w-0">
            <div class="truncate text-sm" :style="{ color: 'var(--muted)' }">Автотека</div>
          </div>

          <ThemeSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state } from "../state";
import ThemeSwitcher from "./ThemeSwitcher.vue";

const headerStyle = computed(() => ({
  background: "color-mix(in srgb, var(--bg) 86%, transparent)",
  borderBottom: "1px solid color-mix(in srgb, var(--text) 10%, transparent)"
}));

const btnStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  boxShadow: "var(--shadow)"
}));
</script>
