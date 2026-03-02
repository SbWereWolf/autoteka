<template>
  <div class="relative">
    <select
      class="ui-transition ui-interactive ui-surface w-full rounded-2xl px-3 py-3 text-sm outline-none"
      v-model="state.cityId"
    >
      <option v-for="c in cities" :key="c.id" :value="c.id">
        {{ c.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import dicts from "../mocks/dicts.json";
import { state } from "../state";

const cities = dicts.cities;

</script>
