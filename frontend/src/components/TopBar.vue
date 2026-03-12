<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div
      class="ui-transition ui-surface-strong border-b"
      :style="{ borderColor: 'var(--border)' }"
    >
      <div class="app-container">
        <div class="topbar-grid">
          <button
            data-menu-button
            class="ui-transition ui-interactive ui-bounce inline-flex items-center justify-center rounded-xl h-12 w-12"
            aria-label="Открыть меню"
            type="button"
            @click="state.menuOpen = true"
          >
            <span class="text-lg leading-none">≡</span>
          </button>

          <div class="min-w-0">
            <RouterLink
              data-testid="topbar-title"
              class="topbar-title block w-full truncate text-center"
              :style="{ color: 'var(--text)' }"
              :to="{ name: 'catalog' }"
            >
              Автотека
            </RouterLink>
          </div>

          <div
            class="flex items-center justify-self-end gap-2 shrink-0"
          >
            <ThemeSwitcher />

            <button
              v-if="showThemeEditorButton"
              class="ui-transition ui-interactive ui-bounce hidden 3xl:inline-flex items-center justify-center rounded-xl h-12 w-12"
              type="button"
              :aria-pressed="state.themeEditorOpen"
              aria-label="CSS переменные"
              title="CSS переменные"
              @click="state.themeEditorOpen = !state.themeEditorOpen"
            >
              <span class="text-lg leading-none">≡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { state } from "../state";
import ThemeSwitcher from "./ThemeSwitcher.vue";

const route = useRoute();

const showThemeEditorButton = computed(() => {
  if (!state.themeEditorEnabled) return false;
  return route.name === "catalog" || route.name === "shop";
});

watch(
  () => route.name,
  (name) => {
    if (name !== "catalog" && name !== "shop")
      state.themeEditorOpen = false;
  },
);
</script>
