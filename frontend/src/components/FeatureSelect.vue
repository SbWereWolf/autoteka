<template>
  <div class="relative">
    <select
      v-model="featureId"
      class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-sm outline-none"
    >
      <option v-for="f in features" :key="f.id" :value="f.id">
        {{ f.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { setFeature, state } from "../state";

const features = computed(() => state.features);

const featureId = computed({
  get: () => state.selectedFeatureId,
  set: (v: string) => setFeature(v),
});
</script>
