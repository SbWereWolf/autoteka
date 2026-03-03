<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="c in categories"
      :key="c"
      class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-3 py-3 text-sm"
      :style="chipStyle(c)"
      @click="toggleCategory(c)"
    >
      {{ c }}
    </button>
  </div>
</template>

<script setup lang="ts">
import dicts from "../mocks/dicts.json";
import { state, toggleCategory } from "../state";

const categories = dicts.categories;

function chipStyle(c: string) {
  const active = state.selectedCategories.includes(c);
  return {
    background: active
      ? "color-mix(in oklch, var(--accent) 22%, var(--surface))"
      : "var(--surface)",
    borderColor: active ? "color-mix(in oklch, var(--accent) 55%, var(--border))" : "var(--border)",
    boxShadow: active ? "var(--shadow)" : "none"
  };
}
</script>
