<template>
  <div class="catalog-select-shell">
    <select
      :id="id"
      v-model="city"
      class="catalog-select-control ui-bounce"
      :aria-label="ariaLabel"
      :data-testid="testId"
    >
      <option v-for="c in cities" :key="c.code" :value="c.code">
        {{ c.title }}
      </option>
    </select>
    <span class="catalog-select-icon" aria-hidden="true">⌄</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, setCity } from "../state";

const emit = defineEmits<{
  changed: [cityCode: string];
}>();

withDefaults(
  defineProps<{
    id?: string;
    ariaLabel?: string;
    testId?: string;
  }>(),
  {
    id: undefined,
    ariaLabel: "Город",
    testId: undefined,
  },
);

const cities = computed(() => state.cities);

const city = computed({
  get: () => state.cityCode,
  set: (value: string) => {
    const previous = state.cityCode;
    setCity(value);
    if (state.cityCode !== previous) {
      emit("changed", state.cityCode);
    }
  },
});
</script>
