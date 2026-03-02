<template>
  <div ref="root" class="relative">
    <button
      class="ui-transition w-full rounded-2xl px-3 py-3 text-left text-sm flex items-center justify-between gap-3"
      :style="btnStyle"
      @click="toggle"
    >
      <span class="truncate">{{ state.selectedFeature }}</span>
      <span :style="{ color: 'var(--muted)' }">▾</span>
    </button>

    <div
      v-if="open"
      class="absolute z-10 mt-2 w-full rounded-2xl overflow-hidden ui-transition"
      :style="panelStyle"
    >
      <button
        v-for="f in features"
        :key="f"
        class="ui-transition w-full px-3 py-3 text-left text-sm"
        :style="rowStyle(f)"
        @click="pick(f)"
      >
        {{ f }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import dicts from "../mocks/dicts.json";
import { state, setFeature } from "../state";

const features = dicts.features;
const open = ref(false);
const root = ref<HTMLElement | null>(null);

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

onMounted(() => document.addEventListener("mousedown", onDocDown));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocDown));

const btnStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in srgb, var(--text) 12%, transparent)"
}));

const panelStyle = computed(() => ({
  background: "color-mix(in srgb, var(--bg) 92%, transparent)",
  border: "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)"
}));

function rowStyle(f: string) {
  const active = f === state.selectedFeature;
  return {
    background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent",
    color: "var(--text)",
    borderBottom: "1px solid color-mix(in srgb, var(--text) 8%, transparent)"
  };
}
</script>
