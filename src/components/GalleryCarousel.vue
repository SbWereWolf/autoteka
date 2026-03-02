<template>
  <!-- Control gallery height via aspect-ratio on the wrapper.
       Mobile: 3/2 (looks good). Tablet/desktop: ~1.5× shorter (wider ratio). -->
  <div class="relative overflow-hidden rounded-[var(--radius)] aspect-[3/2] 3xl:aspect-[9/4] 7xl:aspect-[9/4]" :style="wrapStyle">
    <div class="flex ui-transition h-full" :style="trackStyle">
      <div
        v-for="(g, i) in items"
        :key="i"
        class="min-w-full h-full grid place-items-center text-sm"
        :style="slideStyle(i)"
      >
        {{ g.label }}
      </div>
    </div>

    <button class="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition ui-interactive"
            :style="navBtnStyle"
            @click="prev"
            aria-label="Предыдущий"
    >
      ‹
    </button>
    <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition ui-interactive"
            :style="navBtnStyle"
            @click="next"
            aria-label="Следующий"
    >
      ›
    </button>

    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
      <div v-for="(g,i) in items" :key="'dot'+i" class="h-1.5 w-1.5 rounded-full"
           :style="{ background: i===idx ? 'var(--accent)' : 'color-mix(in oklch, var(--text) 25%, transparent)' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{ items: { kind: string; label: string }[] }>();
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

function slideStyle(i: number) {
  return {
    // IMPORTANT: palette must use only OKLCH.
    // Gallery is mocked, keep it calm/monotone with a subtle accent tint.
    background: `linear-gradient(135deg,
      color-mix(in oklch, var(--accent) ${12 + (i % 5) * 4}%, var(--bg)),
      color-mix(in oklch, var(--accent) ${8 + (i % 5) * 3}%, var(--bg))
    )`,
    color: "var(--text)"
  };
}

const navBtnStyle = computed(() => ({
  background: "color-mix(in oklch, var(--bg) 65%, transparent)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  backdropFilter: "blur(var(--blur))"
}));
</script>
