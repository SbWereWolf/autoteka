<template>
  <button
    class="ui-transition w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    @click="$emit('open')"
  >
    <!-- Opaque tile background (no see-through of the page pattern) -->
    <div class="absolute inset-0" :style="bgLayer"></div>
    <div class="absolute inset-0" :style="patternLayer"></div>

    <div class="relative z-10 h-full flex items-end">
      <div
        class="stroke-title font-extrabold leading-tight"
        :style="titleStyle"
      >
        {{ name }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string; seed: number }>();
defineEmits<{ open: [] }>();

function seeded(n: number) {
  // deterministic pseudo-random in [0..1)
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
  // More monotone tiles: subtle tint derived from theme accent.
  // Percentage values are chosen to keep the grid calm but not flat.
  // Requested: make tiles more saturated overall.
  background: `linear-gradient(135deg,
    color-mix(in oklch, var(--accent) ${Math.round(26 + r1.value * 28)}%, var(--bg)),
    color-mix(in oklch, var(--accent) ${Math.round(18 + r2.value * 22)}%, var(--bg))
  )`
}));

const patternLayer = computed(() => ({
  backgroundImage: "var(--tile-pattern)",
  backgroundSize: "var(--tile-pattern-size)",
  opacity: "var(--tile-pattern-opacity)"
}));

const titleStyle = computed(() => ({
  fontFamily: "var(--font-display)",
  color: "var(--text)",
  fontSize: "clamp(14px, 3.6vw, 18px)",
  letterSpacing: "var(--tile-letter-spacing)",
  textTransform: "var(--tile-text-transform)",
  fontWeight: "var(--tile-font-weight)"
}));
</script>
