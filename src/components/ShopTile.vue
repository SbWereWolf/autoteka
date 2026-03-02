<template>
  <button
    class="ui-transition w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    @click="$emit('open')"
  >
    <div class="absolute inset-0 opacity-70" :style="bgLayer"></div>
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
  // simple deterministic pseudo-random
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const hue = computed(() => Math.floor(seeded(props.seed) * 360));
const hue2 = computed(() => (hue.value + 40 + Math.floor(seeded(props.seed + 7) * 80)) % 360);

const tileStyle = computed(() => ({
  background: "var(--surface)",
  boxShadow: "var(--shadow)",
  border: "1px solid color-mix(in srgb, var(--text) 10%, transparent)"
}));

const bgLayer = computed(() => ({
  background: `linear-gradient(135deg, hsla(${hue.value}, 80%, 55%, 0.55), hsla(${hue2.value}, 80%, 55%, 0.25))`
}));

const patternLayer = computed(() => ({
  backgroundImage: "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.18) 2px, transparent 3px)",
  backgroundSize: "36px 36px",
  opacity: "0.35"
}));

const titleStyle = computed(() => ({
  fontFamily: "var(--font-display)",
  color: "var(--text)",
  fontSize: "clamp(14px, 3.6vw, 18px)"
}));
</script>
