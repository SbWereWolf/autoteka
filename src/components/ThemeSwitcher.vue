<template>
  <div class="flex items-center gap-1">
    <button
      v-for="t in themes"
      :key="t.id"
      class="ui-transition h-9 w-9 rounded-xl grid place-items-center"
      :style="themeBtnStyle(t.id)"
      @click="setTheme(t.id)"
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
    border: active ? "1px solid color-mix(in srgb, var(--accent) 65%, transparent)" : "1px solid transparent",
    boxShadow: active ? "var(--shadow)" : "none",
    filter: active ? "saturate(1.05)" : "none"
  };
}

function dotColor(id: string) {
  // palette hint: neutral = muted dot, accent = accent dot
  return id.includes("accent") ? "var(--accent)" : "color-mix(in srgb, var(--text) 55%, transparent)";
}
</script>
