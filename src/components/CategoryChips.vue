<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="c in categories"
      :key="c"
      class="ui-transition rounded-2xl px-3 py-2 text-sm"
      :style="chipStyle(c)"
      @click="toggleCategory(c)"
    >
      {{ c }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dicts from "../mocks/dicts.json";
import { state, toggleCategory } from "../state";

const categories = dicts.categories;

function chipStyle(c: string) {
  const active = state.selectedCategories.includes(c);
  return {
    background: active ? "color-mix(in srgb, var(--accent) 22%, var(--surface))" : "var(--surface)",
    color: "var(--text)",
    border: active
      ? "1px solid color-mix(in srgb, var(--accent) 55%, transparent)"
      : "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
    boxShadow: active ? "var(--shadow)" : "none"
  };
}
</script>
