<template>
  <div class="relative overflow-hidden rounded-[var(--radius)] ui-transition" :style="wrapStyle">
    <div class="flex ui-transition" :style="trackStyle">
      <div
        v-for="(g, i) in items"
        :key="i"
        class="min-w-full aspect-[3/2] 3xl:aspect-[9/4] 7xl:aspect-[9/4] relative"
      >
        <img
          v-if="g.src"
          class="absolute inset-0 h-full w-full object-cover"
          :src="g.src"
          :alt="g.alt ?? g.label ?? `Слайд ${i+1}`"
          loading="lazy"
        />
        <div
          v-else
          class="absolute inset-0 grid place-items-center text-sm"
          :style="placeholderStyle(i)"
        >
          {{ g.label ?? `Слайд ${i+1}` }}
        </div>
      </div>
    </div>

    <button
      class="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition ui-interactive ui-bounce"
      :style="navBtnStyle"
      @click="prev"
      aria-label="Предыдущий"
    >
      ‹
    </button>
    <button
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition ui-interactive ui-bounce"
      :style="navBtnStyle"
      @click="next"
      aria-label="Следующий"
    >
      ›
    </button>

    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
      <div
        v-for="(g,i) in items"
        :key="'dot'+i"
        class="h-1.5 w-1.5 rounded-full"
        :style="{ background: i===idx ? 'var(--accent)' : 'color-mix(in oklch, var(--text) 25%, transparent)' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type GalleryItem = { src?: string; alt?: string; label?: string };
const props = defineProps<{ items: GalleryItem[] }>();

const idx = ref(0);

function clamp() {
  if (idx.value < 0) idx.value = 0;
  if (idx.value > props.items.length - 1) idx.value = props.items.length - 1;
}
function prev(){ idx.value--; clamp(); }
function next(){ idx.value++; clamp(); }

const wrapStyle = computed(() => ({
  background: "var(--surface)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)",
  boxShadow: "var(--shadow)"
}));

const trackStyle = computed(() => ({
  transform: `translateX(-${idx.value * 100}%)`,
  transitionDuration: "220ms"
}));

function placeholderStyle(i: number) {
  // calm/monotone placeholder with subtle accent tint (OKLCH only)
  return {
    background: `linear-gradient(135deg,
      color-mix(in oklch, var(--accent) ${12 + (i % 5) * 4}%, var(--bg)),
      color-mix(in oklch, var(--accent) ${8 + (i % 5) * 3}%, var(--bg))
    )`,
    color: "var(--text)"
  };
}

const navBtnStyle = computed(() => ({
  background: "var(--surface-strong)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)",
  backdropFilter: "none"
}));
</script>
