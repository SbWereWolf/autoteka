<template>
  <div class="flex items-center">
    <!-- Smartphones: dropdown (icons don't fit) -->
    <div class="3xl:hidden w-full">
      <select
        class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-sm outline-none"
        :value="state.theme"
        @change="
          setTheme(
            ($event.target as HTMLSelectElement)
              .value as typeof state.theme,
          )
        "
        aria-label="Тема оформления"
      >
        <option v-for="t in themes" :key="t.id" :value="t.id">
          {{ t.label }}
        </option>
      </select>
    </div>

    <!-- Tablet/Desktop: 6 icon buttons -->
    <div class="hidden 3xl:flex items-center gap-2">
      <button
        v-for="t in themes"
        :key="t.id"
        class="ui-transition ui-interactive ui-bounce h-12 w-12 rounded-xl grid place-items-center shrink-0"
        :class="state.theme === t.id ? 'theme-btn-active' : ''"
        :aria-pressed="state.theme === t.id"
        @click="setTheme(t.id)"
        :aria-label="`Тема ${t.label}`"
        :title="t.label"
      >
        <span class="text-lg">{{ t.icon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import dicts from "../mocks/dicts.json";
import { state, setTheme } from "../state";

const themes = dicts.themes;
</script>
