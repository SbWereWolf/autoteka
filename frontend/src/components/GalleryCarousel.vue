<template>
  <section
    ref="sectionRef"
    class="shop-gallery-shell"
    aria-label="Фотографии и видео продавца"
    :data-testid="testId"
  >
    <div
      class="shop-gallery-frame"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    >
      <div v-if="items.length === 0" class="shop-gallery-empty">
        <div class="px-6 text-center text-sm text-slate-500">
          {{ emptyText }}
        </div>
      </div>

      <div v-else class="shop-gallery-track" :style="trackStyle">
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

          <div v-else class="shop-gallery-video-shell">
            <video
              :ref="(element) => bindVideoRef(itemIndex, element)"
              class="h-full w-full object-contain"
              :src="item.src"
              :poster="item.poster"
              :autoplay="itemIndex === index && !reducedMotion"
              :muted="isGalleryVideoMuted"
              :loop="true"
              playsinline
              preload="metadata"
            />
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

    <div v-if="items.length > 1" class="shop-gallery-footer">
      <div class="shop-gallery-dots-shell">
        <button
          v-if="activeItem?.type === 'video'"
          class="shop-gallery-audio-toggle"
          data-testid="gallery-audio-toggle"
          type="button"
          :aria-label="
            isGalleryVideoMuted ? 'Включить звук' : 'Выключить звук'
          "
          :aria-pressed="(!isGalleryVideoMuted).toString()"
          @click="toggleAudio"
        >
          {{ isGalleryVideoMuted ? "Вкл. звук" : "Выкл. звук" }}
        </button>

        <div class="shop-gallery-dots">
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
    </div>

    <button
      v-if="activeItem?.type === 'video'"
      class="shop-gallery-pause-toggle"
      data-testid="gallery-pause-toggle"
      type="button"
      :aria-label="userPaused ? 'Воспроизвести' : 'Пауза'"
      @click="togglePause"
    >
      <svg
        v-if="userPaused"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      <svg
        v-else
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    </button>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchPostEffect,
} from "vue";
import type { GalleryItem } from "../types";
import UiImage from "./UiImage.vue";
import { uiConfig } from "../config/ui";
import { useGalleryVideoAudioState } from "../composables/useGalleryVideoAudioState";
import { useAnnouncer } from "../composables/useAnnouncer";

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

const sectionRef = ref<HTMLElement | null>(null);
const index = ref(0);
const videoRefs = ref<Array<HTMLVideoElement | null>>([]);
const { isGalleryVideoMuted } = useGalleryVideoAudioState();
const { announce } = useAnnouncer();

const reducedMotion = ref(false);
let reducedMotionMq: MediaQueryList | null = null;
function syncReducedMotion(event?: MediaQueryListEvent) {
  if (event) {
    reducedMotion.value = event.matches;
  } else if (reducedMotionMq) {
    reducedMotion.value = reducedMotionMq.matches;
  }
}

if (
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function"
) {
  reducedMotionMq = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  reducedMotion.value = reducedMotionMq.matches;
  reducedMotionMq.addEventListener("change", syncReducedMotion);
}

const userPaused = ref(reducedMotion.value);
const ioPaused = ref(false);

watch(reducedMotion, (next) => {
  userPaused.value = next;
});

watch(index, (next) => {
  userPaused.value = reducedMotion.value;
  const item = props.items[next];
  if (!item) return;
  const kind = item.type === "video" ? "Видео" : "Фото";
  announce(`${kind} ${next + 1} из ${props.items.length}`);
});

function togglePause() {
  userPaused.value = !userPaused.value;
}

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

const activeItem = computed(() => props.items[index.value]);

const shouldPlay = computed(() => {
  if (activeItem.value?.type !== "video") return false;
  return !userPaused.value && !ioPaused.value;
});

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
      video.muted = isGalleryVideoMuted.value;
      if (shouldPlay.value) {
        const playPromise = video.play();
        if (playPromise instanceof Promise) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
      }
      return;
    }

    video.pause();
    video.currentTime = 0;
  });
}

function toggleAudio() {
  isGalleryVideoMuted.value = !isGalleryVideoMuted.value;

  const activeVideo = videoRefs.value[index.value];
  if (!activeVideo) {
    return;
  }

  activeVideo.muted = isGalleryVideoMuted.value;
  const playPromise = activeVideo.play();
  if (playPromise instanceof Promise) {
    playPromise.catch(() => {});
  }
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

let intersectionObserver: IntersectionObserver | null = null;
onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;
  if (!sectionRef.value) return;
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      ioPaused.value = entry.intersectionRatio < 0.5;
    },
    { threshold: [0, 0.5, 1] },
  );
  intersectionObserver.observe(sectionRef.value);
});

onBeforeUnmount(() => {
  videoRefs.value.forEach((video) => {
    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
  });
  reducedMotionMq?.removeEventListener("change", syncReducedMotion);
  intersectionObserver?.disconnect();
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
