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
          v-for="(item, itemIndex) in items"
          :key="item.id"
          class="shop-gallery-slide"
        >
          <UiImage
            v-if="item.type === 'image'"
            class="h-full w-full"
            :src="item.src"
            alt=""
            :loading="itemIndex === 0 ? 'eager' : 'lazy'"
            decoding="async"
            spinner
            img-class="h-full w-full object-contain"
          />

          <video
            v-else
            :ref="(element) => bindVideoRef(itemIndex, element)"
            class="h-full w-full object-contain"
            :src="item.src"
            :poster="item.poster"
            :autoplay="itemIndex === index"
            :muted="true"
            :loop="true"
            playsinline
            preload="metadata"
          />
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
import { computed, onBeforeUnmount, ref, watch, watchPostEffect } from "vue";
import type { GalleryItem } from "../types";
import UiImage from "./UiImage.vue";
import { uiConfig } from "../config/ui";

const props = withDefaults(
  defineProps<{
    items: GalleryItem[];
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
const videoRefs = ref<Array<HTMLVideoElement | null>>([]);

function clamp() {
  if (props.items.length === 0) {
    index.value = 0;
    return;
  }

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

function bindVideoRef(index: number, element: Element | null) {
  videoRefs.value[index] =
    element instanceof HTMLVideoElement ? element : null;
}

function syncActiveVideo() {
  videoRefs.value.forEach((video, slideIndex) => {
    if (!video) {
      return;
    }

    if (slideIndex === index.value) {
      const playPromise = video.play();
      if (playPromise instanceof Promise) {
        playPromise.catch(() => {});
      }
      return;
    }

    video.pause();
    video.currentTime = 0;
  });
}

watch(
  () => props.items.length,
  () => {
    clamp();
    videoRefs.value = videoRefs.value.slice(0, props.items.length);
  },
  { immediate: true },
);

watchPostEffect(() => {
  syncActiveVideo();
});

onBeforeUnmount(() => {
  videoRefs.value.forEach((video) => {
    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
  });
});

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
