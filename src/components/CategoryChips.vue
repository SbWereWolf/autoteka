<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="c in categories"
      :key="c"
      class="ui-transition ui-interactive ui-surface rounded-2xl px-3 py-2 text-sm"
      :class="{ 'ui-chip-active': state.selectedCategories.includes(c) }"
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

</script>
