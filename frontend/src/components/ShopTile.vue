<template>
  <button
    class="ui-transition ui-bounce ui-tile w-full aspect-square rounded-[var(--radius)] p-3 text-left relative overflow-hidden"
    :style="tileStyle"
    @click="$emit('open')"
    type="button"
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
      <UiImage
        v-if="shop.thumbUrl"
        class="absolute inset-0"
        :src="shop.thumbUrl"
        :alt="`${shop.title} — изображение`"
        loading="lazy"
        decoding="async"
        spinner
        img-class="w-full h-full object-contain"
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
import UiImage from "./UiImage.vue";

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
