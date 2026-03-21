<template>
  <div class="catalog-select-shell">
    <select
      :id="id"
      v-model="featureId"
      class="catalog-feature-select ui-bounce"
      :aria-label="ariaLabel"
      :data-testid="testId"
    >
      <option v-for="f in features" :key="f.id" :value="f.id">
        {{ f.title }}
      </option>
    </select>
    <span class="catalog-select-icon" aria-hidden="true">⌄</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { setFeature, state } from "../state";

withDefaults(
  defineProps<{
    id?: string;
    ariaLabel?: string;
    testId?: string;
  }>(),
  {
    id: undefined,
    ariaLabel: "Фишка каталога",
    testId: undefined,
  },
);

const features = computed(() => state.features);

const featureId = computed({
  get: () => state.selectedFeatureId,
  set: (value: string) => setFeature(value),
});
</script>
