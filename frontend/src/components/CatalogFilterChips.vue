<template>
  <div
    v-if="chips.length > 0"
    class="catalog-filter-row"
    data-testid="catalog-filter-row"
  >
    <ul class="catalog-filter-chips" aria-label="Активные фильтры">
      <li
        v-for="chip in chips"
        :key="chip.id"
        class="catalog-filter-chip"
        :class="{ 'catalog-filter-chip--out': leaving.has(chip.id) }"
      >
        <button
          type="button"
          class="catalog-filter-chip-btn"
          :aria-label="`Удалить фильтр: ${chip.title}`"
          @click="removeChip(chip)"
        >
          <span>{{ chip.title }}</span>
          <span class="catalog-filter-chip-x" aria-hidden="true"
            >×</span
          >
        </button>
      </li>
    </ul>

    <button
      v-if="chips.length >= 2"
      type="button"
      class="catalog-filter-clear"
      aria-label="Очистить все фильтры"
      @click="clearAll"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M6 6 L18 18 M18 6 L6 18" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { state, toggleCategory, clearCategories } from "../state";
import { useAnnouncer } from "../composables/useAnnouncer";

type Chip = { id: string; title: string };

const { announce } = useAnnouncer();
const leaving = reactive(new Set<string>());

const chips = computed<Chip[]>(() => {
  const titles = new Map(state.categories.map((c) => [c.id, c.title]));
  const result: Chip[] = [];
  for (const id of state.selectedCategoryIds) {
    const title = titles.get(id);
    if (title !== undefined) result.push({ id, title });
  }
  return result;
});

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function removeChip(chip: Chip) {
  announce(`Фильтр снят: ${chip.title}`);
  if (prefersReducedMotion()) {
    toggleCategory(chip.id);
    return;
  }
  leaving.add(chip.id);
  window.setTimeout(() => {
    toggleCategory(chip.id);
    leaving.delete(chip.id);
  }, 240);
}

function clearAll() {
  announce("Фильтры очищены");
  if (prefersReducedMotion()) {
    clearCategories();
    return;
  }
  for (const id of state.selectedCategoryIds) leaving.add(id);
  window.setTimeout(() => {
    clearCategories();
    leaving.clear();
  }, 240);
}
</script>
