<template>
  <div class="catalog-menu-chip-list">
    <button
      v-for="c in categories"
      :key="c.id"
      type="button"
      class="catalog-menu-chip"
      :aria-pressed="state.selectedCategoryIds.includes(c.id)"
      @click="toggleCategory(c.id)"
    >
      <span>{{ c.title }}</span>
      <svg
        v-if="state.selectedCategoryIds.includes(c.id)"
        class="catalog-menu-chip-check"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M19.2929 5.29302C19.6834 4.90249 20.3164 4.90249 20.707 5.29302C21.0975 5.68354 21.0975 6.31655 20.707 6.70708L9.70696 17.7071C9.31643 18.0976 8.68342 18.0976 8.29289 17.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6835 3.29289 11.293C3.68342 10.9025 4.31643 10.9025 4.70696 11.293L8.99992 15.586L19.2929 5.29302Z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, toggleCategory } from "../state";

const categories = computed(() => state.categories);
</script>
