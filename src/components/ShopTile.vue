<template>
  <button
    class="ui-transition ui-interactive ui-bounce w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    @click="$emit('open')"
  >
    <!-- Background (monotone) -->
    <div class="absolute inset-0" :style="bgLayer"></div>
    <div class="absolute inset-0" :style="patternLayer"></div>

    <div class="relative z-10 h-full flex flex-col">
      <!-- Optional thumbnail (keeps tiles readable + calm) -->
      <div class="flex-1 rounded-2xl overflow-hidden" :style="thumbWrapStyle">
        <img
          v-if="image"
          class="h-full w-full object-cover"
          :src="image"
          :alt="name"
          loading="lazy"
        />
        <div v-else class="h-full w-full" :style="thumbPlaceholder"></div>
      </div>

      <!-- Name on opaque panel -->
      <div class="mt-3 rounded-2xl px-3 py-2 ui-transition" :style="namePanelStyle">
        <div class="stroke-title leading-tight" :style="titleStyle">
          {{ name }}
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string; seed: number; image?: string | null }>();
defineEmits<{ open: [] }>();

function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const r1 = computed(() => seeded(props.seed + 11));
const r2 = computed(() => seeded(props.seed + 97));

const tileStyle = computed(() => ({
  background: "var(--surface)",
  boxShadow: "var(--shadow)",
  border: "var(--tile-border)"
}));

const bgLayer = computed(() => ({
  // calm but more saturated tiles
  background: `linear-gradient(135deg,
    color-mix(in oklch, var(--accent) ${Math.round(24 + r1.value * 26)}%, var(--bg)),
    color-mix(in oklch, var(--accent) ${Math.round(16 + r2.value * 22)}%, var(--bg))
  )`
}));

const patternLayer = computed(() => ({
  backgroundImage: "var(--tile-pattern)",
  backgroundSize: "var(--tile-pattern-size)",
  opacity: "var(--tile-pattern-opacity)"
}));

const thumbWrapStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)",
  boxShadow: "var(--shadow)"
}));

const thumbPlaceholder = computed(() => ({
  background: `linear-gradient(135deg,
    color-mix(in oklch, var(--accent) ${Math.round(14 + r1.value * 18)}%, var(--surface-strong)),
    color-mix(in oklch, var(--accent) ${Math.round(10 + r2.value * 14)}%, var(--surface-strong))
  )`
}));

const namePanelStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)",
  boxShadow: "var(--shadow)"
}));

const titleStyle = computed(() => ({
  fontFamily: "var(--font-display)",
  color: "var(--text)",
  fontSize: "clamp(14px, 3.2vw, 18px)",
  letterSpacing: "var(--tile-letter-spacing)",
  textTransform: "var(--tile-text-transform)",
  fontWeight: "var(--tile-font-weight)"
}));
</script>
