<template>
  <div
    class="shop-gallery-shell"
    :data-testid="testId"
  >
    <div
      class="shop-gallery-frame"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    >
      <div
        v-if="items.length === 0"
        class="shop-gallery-empty"
      >
        <div class="px-6 text-center text-sm text-slate-500">
          {{ emptyText }}
        </div>
      </div>

      <div
        v-else
        class="shop-gallery-track"
        :style="trackStyle"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          class="shop-gallery-slide"
        >
          <UiImage
            v-if="typeof item === 'string'"
            class="h-full w-full"
            :src="item"
            alt=""
            :loading="index === 0 ? 'eager' : 'lazy'"
            decoding="async"
            spinner
            img-class="h-full w-full object-contain"
          />

          <UiImage
            v-else-if="item.kind === 'image'"
            class="h-full w-full"
            :src="item.src"
            :alt="item.alt"
            :width="item.width"
            :height="item.height"
            :loading="index === 0 ? 'eager' : 'lazy'"
            decoding="async"
            spinner
            img-class="h-full w-full object-contain"
          />

          <div v-else class="shop-gallery-empty">
            <div class="px-6 text-center text-sm text-slate-500">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="items.length > 1"
      class="shop-gallery-nav shop-gallery-nav--left"
      data-testid="gallery-prev"
      type="button"
      aria-label="Предыдущий кадр"
      @click="prev"
    >
      ‹
    </button>
    <button
      v-if="items.length > 1"
      class="shop-gallery-nav shop-gallery-nav--right"
      data-testid="gallery-next"
      type="button"
      aria-label="Следующий кадр"
      @click="next"
    >
      ›
    </button>

    <div v-if="items.length > 1" class="shop-gallery-dots">
      <span
        v-for="(_, dotIndex) in items"
        :key="`gallery-dot-${dotIndex}`"
        class="shop-gallery-dot"
        :class="{
          'shop-gallery-dot--active': dotIndex === index,
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
    testId?: string;
  }>(),
  {
    emptyTitle: "",
    emptyText: "",
    testId: undefined,
  },
);

const index = ref(0);

function clamp() {
  if (index.value < 0) {
    index.value = 0;
  }
  if (index.value > props.items.length - 1) {
    index.value = props.items.length - 1;
  }
}

function prev() {
  index.value -= 1;
  clamp();
}

function next() {
  index.value += 1;
  clamp();
}

const trackStyle = computed(() => ({
  transform: `translateX(-${index.value * 100}%)`,
  transitionDuration: `${uiConfig.gallery.transitionMs}ms`,
}));

let startX = 0;
let startY = 0;
let dragging = false;

function onDown(event: PointerEvent) {
  if (props.items.length <= 1) return;
  if ((event.target as HTMLElement).closest("button")) return;
  dragging = true;
  startX = event.clientX;
  startY = event.clientY;
}

function onMove(event: PointerEvent) {
  if (!dragging) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (Math.abs(dy) > Math.abs(dx) * 1.3) {
    dragging = false;
  }
}

function onUp(event: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  const dx = event.clientX - startX;
  if (Math.abs(dx) < uiConfig.gallery.swipeThresholdPx) return;
  if (dx < 0) {
    next();
  } else {
    prev();
  }
}

function onCancel() {
  dragging = false;
}
</script>
