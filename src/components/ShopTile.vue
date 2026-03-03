<template>
  <button
    class="ui-transition ui-bounce ui-tile w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    @click="$emit('open')"
  >
    <!-- monotone tinted background (opaque) -->
    <div class="absolute inset-0" :style="bgLayer"></div>
    <div class="absolute inset-0" :style="patternLayer"></div>

    <!-- optional thumbnail (reserved space to avoid CLS) -->
    <div v-if="shop.thumbUrl" class="absolute right-3 top-3 w-14 h-14 rounded-2xl overflow-hidden"
         :style="thumbWrapStyle">
      <img
        :src="shop.thumbUrl"
        :alt="`${shop.name} — миниатюра`"
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="relative z-10 h-full flex items-end">
      <div class="rounded-2xl px-3 py-2" :style="titlePlateStyle">
        <div class="stroke-title leading-tight" :style="titleStyle">
          {{ shop.name }}
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ shop: { name: string; thumbUrl?: string }; seed: number }>();
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
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)"
}));

const bgLayer = computed(() => {
  // More saturated but still calm (no rainbow): accent tint into surface.
  const a = Math.round(18 + r1.value * 14); // 18..32
  const b = Math.round(14 + r2.value * 12); // 14..26
  return {
    background: `linear-gradient(135deg,
      color-mix(in oklch, var(--accent) ${a}%, var(--surface)),
      color-mix(in oklch, var(--accent) ${b}%, var(--surface))
    )`
  };
});

const patternLayer = computed(() => ({
  backgroundImage: "var(--tile-pattern)",
  backgroundSize: "var(--tile-pattern-size)",
  opacity: "var(--tile-pattern-opacity)"
}));

const titlePlateStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  boxShadow: "0 10px 18px oklch(0 0 0 / 0.10)"
}));

const titleStyle = computed(() => ({
  fontFamily: "var(--font-display)",
  color: "var(--text)",
  fontSize: "clamp(14px, 3.6vw, 18px)",
  fontWeight: 800
}));

const thumbWrapStyle = computed(() => ({
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  boxShadow: "0 10px 18px oklch(0 0 0 / 0.10)"
}));
</script>
