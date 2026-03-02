<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div class="ui-transition" :style="headerStyle">
      <!-- Keep gutters aligned with pages across breakpoints -->
      <div class="mx-auto max-w-6xl px-3 xs:px-3 sm:px-4 3xl:px-10 7xl:px-12">
        <div class="h-14 flex items-center justify-between gap-3">
          <button
            class="ui-transition ui-interactive ui-bounce inline-flex items-center justify-center rounded-xl px-3 py-2"
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

// Requirement: background should NOT show through UI blocks.
// Use fully opaque surfaces for the top bar.
const headerStyle = computed(() => ({
  background: "var(--surface-strong)",
  borderBottom: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)"
}));

const btnStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)",
  boxShadow: "none"
}));
</script>
