<template>
  <div class="relative">
    <select
      class="ui-transition ui-interactive ui-bounce w-full rounded-2xl px-3 py-3 text-sm outline-none"
      :style="selectStyle"
      v-model="state.selectedFeature"
      @change="onChange"
    >
      <option v-for="f in features" :key="f" :value="f">
        {{ f }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dicts from "../mocks/dicts.json";
import { state, setFeature } from "../state";

const features = dicts.features;

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value;
  setFeature(v);
}

const selectStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)"
}));
</script>
