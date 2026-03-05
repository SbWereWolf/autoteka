<template>
  <div class="relative">
    <select
      class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-sm outline-none"
      v-model="city"
    >
      <option v-for="c in cities" :key="c.id" :value="c.id">
        {{ c.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { state, setCity } from "../state";

const cities = computed(() => state.cities);

const city = computed({
  get: () => state.cityId,
  set: (v: string) => setCity(v),
});
</script>
