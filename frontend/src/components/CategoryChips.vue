<template>
  <div
    class="flex flex-col"
    :style="{ gap: 'var(--menu-category-chip-gap, 0.5rem)' }"
  >
    <button
      v-for="c in categories"
      :key="c.id"
      class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 text-sm"
      :style="chipStyle(c)"
      @click="toggleCategory(c.id)"
    >
      {{ c.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, toggleCategory } from "../state";

const categories = computed(() => state.categories);

function chipStyle(c: { id: string }) {
  const active = state.selectedCategoryIds.includes(c.id);
  return {
    width: "var(--menu-category-chip-width, 100%)",
    textAlign: "var(--menu-category-chip-text-align, left)",
    paddingInline: "var(--menu-category-chip-padding-x, 0.75rem)",
    paddingBlock: "var(--menu-category-chip-padding-y, 0.75rem)",
    background: active
      ? "color-mix(in oklch, var(--accent) 22%, var(--surface))"
      : "var(--surface)",
    borderColor: active
      ? "color-mix(in oklch, var(--accent) 55%, var(--border))"
      : "var(--border)",
    boxShadow: active ? "var(--shadow)" : "none",
  };
}
</script>
