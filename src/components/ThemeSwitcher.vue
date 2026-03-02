<template>
  <div class="flex items-center gap-1">
    <button
      v-for="t in themes"
      :key="t.id"
      class="ui-transition ui-interactive ui-bounce h-9 w-9 rounded-xl grid place-items-center"
      :class="state.theme === t.id ? 'theme-btn-active' : ''"
      :style="themeBtnStyle(t.id)"
      @click="setTheme(t.id)"
      :aria-pressed="state.theme === t.id"
      :aria-label="`Тема ${t.label}`"
      :title="t.label"
    >
      <!-- lightweight icons: letter + dot -->
      <div class="text-[11px] leading-none font-semibold" :style="{ fontFamily: 'var(--font-display)' }">
        {{ t.style }}
      </div>
      <div class="-mt-0.5 h-1.5 w-1.5 rounded-full" :style="{ background: dotColor(t.id) }"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
import dicts from "../mocks/dicts.json";
import { state, setTheme } from "../state";

const themes = dicts.themes;

function themeBtnStyle(id: string) {
  const active = state.theme === id;
  return {
    background: active ? "var(--surface-strong)" : "var(--surface)",
    color: "var(--text)",
    border: active
      ? "1px solid color-mix(in oklch, var(--accent) 55%, var(--border))"
      : "1px solid var(--border)",
    boxShadow: active ? "var(--shadow)" : "none"
  };
}

function dotColor(id: string) {
  // palette hint: neutral = muted dot, accent = accent dot
  return id.includes("accent") ? "var(--accent)" : "color-mix(in oklch, var(--text) 55%, transparent)";
}
</script>
