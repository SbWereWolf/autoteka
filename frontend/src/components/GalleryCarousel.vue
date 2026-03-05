<template>
  <div
    class="relative overflow-hidden rounded-[var(--radius)] ui-transition ui-surface-strong"
    :style="{ boxShadow: 'var(--shadow)' }"
  >
    <div
      class="aspect-[3/2] 3xl:aspect-[9/4] 7xl:aspect-[9/4]"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    >
      <!-- Empty state (no images yet) -->
      <div
        v-if="items.length === 0"
        class="h-full w-full grid place-items-center"
        :style="{ backgroundColor: 'var(--surface-strong)' }"
      >
        <div class="px-6 text-center">
          <div class="text-xs" :style="{ color: 'var(--muted)' }">
            {{ emptyText }}
          </div>
        </div>
      </div>

      <!-- Slides -->
      <div
        v-else
        class="h-full flex ui-transition"
        :style="trackStyle"
      >
        <div
          v-for="(g, i) in items"
          :key="i"
          class="min-w-full h-full"
        >
          <!-- string URL support (mocks may provide galleryImages as string[]) -->
          <UiImage
            v-if="typeof g === 'string'"
            class="w-full h-full"
            :src="g"
            alt=""
            :loading="i === 0 ? 'eager' : 'lazy'"
            decoding="async"
            spinner
            img-class="w-full h-full object-contain"
          />

          <UiImage
            v-else-if="g.kind === 'image'"
            class="w-full h-full"
            :src="g.src"
            :alt="g.alt"
            :width="g.width"
            :height="g.height"
            :loading="i === 0 ? 'eager' : 'lazy'"
            decoding="async"
            spinner
            img-class="w-full h-full object-contain"
          />

          <div
            v-else
            class="w-full h-full grid place-items-center text-sm"
            :style="{
              color: 'var(--text)',
              background:
                'color-mix(in oklch, var(--accent) 10%, var(--surface-strong))',
            }"
          >
            {{ g.label }}
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="items.length > 1"
      class="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl h-12 w-12 grid place-items-center ui-transition ui-interactive ui-bounce"
      @click="prev"
      aria-label="Предыдущий"
    >
      ‹
    </button>
    <button
      v-if="items.length > 1"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-12 w-12 grid place-items-center ui-transition ui-interactive ui-bounce"
      @click="next"
      aria-label="Следующий"
    >
      ›
    </button>

    <div
      v-if="items.length > 1"
      class="absolute bottom-2 left-0 right-0 flex justify-center gap-1"
    >
      <div
        v-for="(_g, i) in items"
        :key="'dot' + i"
        class="h-1.5 w-1.5 rounded-full"
        :style="{
          background:
            i === idx
              ? 'var(--accent)'
              : 'color-mix(in oklch, var(--text) 28%, transparent)',
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import UiImage from "./UiImage.vue";
import { uiConfig } from "../config/ui";

type GalleryItem =
  | {
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  | { kind: "placeholder"; label: string };

const props = withDefaults(
  defineProps<{
    items: Array<GalleryItem | string>;
    emptyTitle?: string;
    emptyText?: string;
  }>(),
  {
    emptyTitle: "",
    emptyText: "",
  },
);

const idx = ref(0);

function clamp() {
  if (idx.value < 0) idx.value = 0;
  if (idx.value > props.items.length - 1)
    idx.value = props.items.length - 1;
}
function prev() {
  idx.value--;
  clamp();
}
function next() {
  idx.value++;
  clamp();
}

const trackStyle = computed(() => ({
  transform: `translateX(-${idx.value * 100}%)`,
  transitionDuration: `${uiConfig.gallery.transitionMs}ms`,
}));

// Swipe support (touch/mouse). Keep it simple and avoid fighting the page scroll.
let startX = 0;
let startY = 0;
let dragging = false;

function onDown(e: PointerEvent) {
  if (props.items.length <= 1) return;
  if ((e.target as HTMLElement).closest("button")) return;
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
}

function onMove(e: PointerEvent) {
  if (!dragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  // If vertical gesture dominates, let the page scroll.
  if (Math.abs(dy) > Math.abs(dx) * 1.3) {
    dragging = false;
  }
}

function onUp(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  const dx = e.clientX - startX;
  if (Math.abs(dx) < uiConfig.gallery.swipeThresholdPx) return;
  if (dx < 0) next();
  else prev();
}

function onCancel() {
  dragging = false;
}
</script>
