<template>
  <div class="relative overflow-hidden rounded-[var(--radius)]" :style="wrapStyle">
    <div class="flex ui-transition" :style="trackStyle">
      <div
        v-for="(g, i) in items"
        :key="i"
        class="min-w-full aspect-[3/2] grid place-items-center text-sm"
        :style="slideStyle(i)"
      >
        {{ g.label }}
      </div>
    </div>

    <button class="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition"
            :style="navBtnStyle"
            @click="prev"
            aria-label="Предыдущий"
    >
      ‹
    </button>
    <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 ui-transition"
            :style="navBtnStyle"
            @click="next"
            aria-label="Следующий"
    >
      ›
    </button>

    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
      <div v-for="(g,i) in items" :key="'dot'+i" class="h-1.5 w-1.5 rounded-full"
           :style="{ background: i===idx ? 'var(--accent)' : 'color-mix(in srgb, var(--text) 25%, transparent)' }"></div>
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
  border: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
  boxShadow: "var(--shadow)"
}));

const trackStyle = computed(() => ({
  transform: `translateX(-${idx.value * 100}%)`,
  transitionDuration: "220ms"
}));

function slideStyle(i: number) {
  const h = (i * 42) % 360;
  return {
    background: `linear-gradient(135deg, hsla(${h}, 80%, 55%, 0.35), hsla(${(h+70)%360}, 80%, 55%, 0.20))`,
    color: "var(--text)"
  };
}

const navBtnStyle = computed(() => ({
  background: "color-mix(in srgb, var(--bg) 65%, transparent)",
  color: "var(--text)",
  border: "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
  backdropFilter: "blur(var(--blur))"
}));
</script>
