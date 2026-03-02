<template>
  <div class="relative">
    <select
      class="ui-transition w-full rounded-2xl px-3 py-3 text-sm outline-none"
      :style="selectStyle"
      v-model="state.cityId"
    >
      <option v-for="c in cities" :key="c.id" :value="c.id">
        {{ c.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dicts from "../mocks/dicts.json";
import { state } from "../state";

const cities = dicts.cities;

const selectStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)"
}));
</script>
