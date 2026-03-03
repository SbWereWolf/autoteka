<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div class="ui-transition ui-surface-strong border-b" :style="{ borderColor: 'var(--border)' }">
      <div class="app-container">
        <div class="h-14 flex items-center justify-between gap-3">
          <button
            data-menu-button
            class="ui-transition ui-interactive ui-bounce inline-flex items-center justify-center rounded-xl h-12 w-12"
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
import { state } from "../state";
import ThemeSwitcher from "./ThemeSwitcher.vue";
</script>
