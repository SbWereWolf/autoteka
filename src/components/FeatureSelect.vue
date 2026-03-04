<template>
  <div class="relative">
    <select
      v-model="feature"
      class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-sm outline-none"
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
import { setFeature, state } from "../state";

const features = dicts.features;

const feature = computed({
  get: () => state.selectedFeature,
  set: (v: string) => setFeature(v),
});
</script>
