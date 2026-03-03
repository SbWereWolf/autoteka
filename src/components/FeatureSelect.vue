<template>
  <div ref="root" class="relative">
    <button
      class="ui-transition ui-interactive ui-bounce w-full min-h-12 rounded-2xl px-3 py-3 text-left text-sm flex items-center justify-between gap-3"
      @click="toggle"
      :aria-expanded="open"
      :aria-controls="panelId"
    >
      <span class="truncate">{{ state.selectedFeature }}</span>
      <span :style="{ color: 'var(--muted)' }">▾</span>
    </button>

    <div
      v-if="open"
      :id="panelId"
      class="absolute z-10 mt-2 w-full rounded-2xl overflow-hidden ui-transition ui-surface-strong"
      :style="{ boxShadow: 'var(--shadow)' }"
    >
      <button
        v-for="f in features"
        :key="f"
        class="ui-transition ui-interactive w-full min-h-12 px-3 py-3 text-left text-sm"
        :style="rowStyle(f)"
        @click="pick(f)"
      >
        {{ f }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import dicts from "../mocks/dicts.json";
import { state, setFeature } from "../state";

const features = dicts.features;
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const panelId = `feature-panel-${Math.random().toString(36).slice(2)}`;

function toggle() {
  open.value = !open.value;
}

function pick(f: string) {
  setFeature(f);
  open.value = false;
}

function onDocDown(e: MouseEvent) {
  const el = root.value;
  if (!el) return;
  if (!el.contains(e.target as Node)) open.value = false;
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === "Escape") {
    e.preventDefault();
    open.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onDocDown));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocDown));

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

function rowStyle(f: string) {
  const active = f === state.selectedFeature;
  const base: Record<string, string> = {
    color: "var(--text)",
    borderBottom: "1px solid var(--border)"
  };
  if (active) {
    base.background = "color-mix(in oklch, var(--accent) 18%, var(--surface-strong))";
  }
  return base;
}
</script>
