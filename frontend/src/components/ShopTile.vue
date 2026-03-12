<template>
  <button
    class="ui-transition ui-bounce ui-tile w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    type="button"
    @click="$emit('open')"
  >
    <div
      class="absolute inset-0 overflow-hidden rounded-[var(--radius)]"
    >
      <div
        v-if="!shop.thumbUrl"
        class="absolute inset-0"
        :style="bgLayer"
      ></div>
      <div
        v-if="!shop.thumbUrl"
        class="absolute inset-0"
        :style="patternLayer"
      ></div>

      <div
        v-if="shop.thumbUrl"
        class="absolute inset-0"
        :style="thumbBgStyle"
      ></div>
      <img
        v-if="shop.thumbUrl"
        class="absolute left-1/2 top-1/2 h-auto w-auto max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 object-contain"
        :src="shop.thumbUrl"
        :alt="`${shop.title} — изображение`"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="tile-title-overlay">
      <div class="tile-title-text" :style="titleStyle">
        {{ shop.title }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  shop: { title: string; thumbUrl?: string };
  seed: number;
}>();
defineEmits<{ open: [] }>();

function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

const r1 = computed(() => seeded(props.seed + 11));
const r2 = computed(() => seeded(props.seed + 97));

const tileStyle = computed(() => ({
  background: "var(--surface)",
  border: "0.0625rem solid var(--border)",
  boxShadow: "var(--shadow)",
  containerType: "size",
}));

const bgLayer = computed(() => {
  const a = Math.round(18 + r1.value * 14);
  const b = Math.round(14 + r2.value * 12);
  return {
    background: `linear-gradient(135deg,
      color-mix(in oklch, var(--accent) ${a}%, var(--surface)),
      color-mix(in oklch, var(--accent) ${b}%, var(--surface))
    )`,
  };
});

const patternLayer = computed(() => ({
  backgroundImage: "var(--tile-pattern)",
  backgroundSize: "var(--tile-pattern-size)",
  opacity: "var(--tile-pattern-opacity)",
}));

const titleStyle = computed(() => ({
  fontFamily: "var(--font-display)",
}));

const thumbBgStyle = computed(() => ({
  background: "var(--surface)",
}));
</script>
