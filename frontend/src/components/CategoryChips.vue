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
      {{ c.title }}
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
      ? "linear-gradient(180deg, #c7cfef 0%, #b8c2ea 100%)"
      : "linear-gradient(180deg, #e8eef8 0%, #dde6f4 100%)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    boxShadow: "none",
    color: "#475569",
    fontWeight: 600,
  };
}
</script>
