<template>
  <div class="relative">
    <select
      :id="id"
      v-model="city"
      class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-sm outline-none"
      :aria-label="ariaLabel"
      :data-testid="testId"
    >
      <option v-for="c in cities" :key="c.code" :value="c.code">
        {{ c.title }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, setCity } from "../state";

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
  set: (v: string) => setCity(v),
});
</script>
