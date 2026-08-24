<template>
  <section
    ref="sectionRef"
    class="shop-gallery-shell"
    :class="{ 'shop-gallery-shell--desktop': isDesktop }"
    aria-label="Фотографии и видео продавца"
    :data-testid="testId"
    @keydown.left.exact.prevent="prev"
    @keydown.right.exact.prevent="next"
  >
    <template v-if="!isDesktop">
      <div
        class="shop-gallery-frame"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onCancel"
      >
        <div v-if="items.length === 0" class="shop-gallery-empty">
          <div class="px-6 text-center text-sm text-secondary-text">
            {{ emptyText }}
          </div>
        </div>

        <div v-else class="shop-gallery-track" :style="trackStyle">
          <div
            v-for="(item, itemIndex) in items"
            :key="item.id"
            class="shop-gallery-slide"
          >
            <button
              v-if="item.type === 'image'"
              type="button"
              class="shop-gallery-photo-button"
              :tabindex="itemIndex === index ? 0 : -1"
              :aria-label="`Открыть фото ${itemIndex + 1} из ${items.length} на весь экран`"
              :data-testid="`gallery-photo-open-${itemIndex}`"
              @pointerdown="onPhotoPointerDown"
              @pointerup="
                (event: PointerEvent) =>
                  onPhotoPointerUp(event, itemIndex)
              "
              @pointercancel="onPhotoPointerCancel"
              @click="
                (event: MouseEvent) => onPhotoClick(event, itemIndex)
              "
            >
              <UiImage
                class="h-full w-full"
                :src="item.src"
                alt=""
                :loading="itemIndex === 0 ? 'eager' : 'lazy'"
                decoding="async"
                spinner
                img-class="h-full w-full object-cover"
              />
            </button>

            <div v-else class="shop-gallery-video-shell">
              <video
                :ref="(element) => bindVideoRef(itemIndex, element)"
                class="h-full w-full object-cover"
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
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M15 6 L9 12 L15 18" />
        </svg>
      </button>
      <button
        v-if="items.length > 1"
        class="shop-gallery-nav shop-gallery-nav--right"
        data-testid="gallery-next"
        type="button"
        aria-label="Следующий кадр"
        @click="next"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M9 6 L15 12 L9 18" />
        </svg>
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
    </template>

    <template v-else>
      <div v-if="items.length === 0" class="shop-gallery-stage">
        <div class="shop-gallery-empty px-6 text-center text-sm text-secondary-text">
          {{ emptyText }}
        </div>
      </div>

      <div v-else class="shop-gallery-stage">
        <button
          v-if="activeItem?.type === 'image'"
          type="button"
          class="shop-gallery-stage-media shop-gallery-photo-button"
          :aria-label="`Открыть фото ${index + 1} из ${items.length} на весь экран`"
          data-testid="gallery-photo-open-stage"
          @click="openLightboxAt(index)"
        >
          <UiImage
            class="h-full w-full"
            :src="activeItem.src"
            alt=""
            loading="eager"
            decoding="async"
            spinner
            img-class="h-full w-full object-cover"
          />
        </button>

        <video
          v-else-if="activeItem?.type === 'video'"
          :key="`stage-video-${activeItem.id}`"
          ref="stageVideoRef"
          class="shop-gallery-stage-media shop-gallery-stage-media--video"
          :src="activeItem.src"
          :poster="activeItem.poster"
          controls
          playsinline
          preload="none"
          :aria-label="`Видео ${index + 1} из ${items.length}`"
        />

        <span
          v-if="items.length > 1"
          class="shop-gallery-counter"
          data-testid="gallery-counter"
          aria-hidden="true"
        >
          {{ index + 1 }}/{{ items.length }}
        </span>

        <button
          v-if="items.length > 1"
          class="shop-gallery-stage-arrow shop-gallery-stage-arrow--left"
          data-testid="gallery-prev"
          type="button"
          aria-label="Предыдущий кадр"
          :disabled="index === 0"
          @click="prev"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M15 6 L9 12 L15 18" />
          </svg>
        </button>
        <button
          v-if="items.length > 1"
          class="shop-gallery-stage-arrow shop-gallery-stage-arrow--right"
          data-testid="gallery-next"
          type="button"
          aria-label="Следующий кадр"
          :disabled="index === items.length - 1"
          @click="next"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M9 6 L15 12 L9 18" />
          </svg>
        </button>
      </div>

      <ul
        v-if="items.length > 1"
        class="shop-gallery-thumbs"
        aria-label="Миниатюры"
        data-testid="gallery-thumbs"
      >
        <li
          v-for="(item, itemIndex) in items"
          :key="`thumb-${item.id}`"
        >
          <button
            type="button"
            class="shop-gallery-thumb"
            :aria-current="itemIndex === index ? 'true' : undefined"
            :aria-label="`${item.type === 'video' ? 'Видео' : 'Фото'} ${itemIndex + 1} из ${items.length}`"
            :data-testid="`gallery-thumb-${itemIndex}`"
            @click="goTo(itemIndex)"
          >
            <img
              :src="item.type === 'video' ? item.poster : item.src"
              alt=""
            />
            <span
              v-if="item.type === 'video'"
              class="shop-gallery-thumb-vbadge"
              aria-hidden="true"
            >
              <span class="shop-gallery-thumb-vchip">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </template>
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
import type { GalleryImageItem, GalleryItem } from "../types";
import UiImage from "./UiImage.vue";
import { uiConfig } from "../config/ui";
import { useGalleryVideoAudioState } from "../composables/useGalleryVideoAudioState";
import { useAnnouncer } from "../composables/useAnnouncer";
import { useIsDesktop } from "../composables/useIsDesktop";
import { useGalleryLightbox } from "../composables/useGalleryLightbox";
import "photoswipe/style.css";

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
const stageVideoRef = ref<HTMLVideoElement | null>(null);
const index = ref(0);
const videoRefs = ref<Array<HTMLVideoElement | null>>([]);
const { isGalleryVideoMuted } = useGalleryVideoAudioState();
const { announce } = useAnnouncer();
const { isDesktop } = useIsDesktop();

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
  if (props.items.length <= 1) return;
  index.value -= 1;
  clamp();
}

function next() {
  if (props.items.length <= 1) return;
  index.value += 1;
  clamp();
}

function goTo(target: number) {
  index.value = target;
  clamp();
}

const trackStyle = computed(() => ({
  transform: `translateX(-${index.value * 100}%)`,
  transitionDuration: `${uiConfig.gallery.transitionMs}ms`,
}));

const activeItem = computed(() => props.items[index.value]);

const shouldPlay = computed(() => {
  if (isDesktop.value) return false;
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
  // Кадр-фото теперь тоже <button> — он не контрол, тянуть по нему можно.
  if (
    (event.target as HTMLElement).closest(
      "button:not(.shop-gallery-photo-button)",
    )
  )
    return;
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

// --- Лайтбокс -----------------------------------------------------------
// natural-размеры берём с уже отрисованных <img> карусели: у GalleryItem
// полей ширины/высоты нет, бэкенд их не отдаёт. На десктопе подходит и
// миниатюра — naturalWidth не зависит от отображаемого размера.
function resolveImageElement(
  item: GalleryImageItem,
): HTMLImageElement | null {
  const root = sectionRef.value;
  if (!root) {
    return null;
  }

  for (const image of root.querySelectorAll("img")) {
    if (image.getAttribute("src") === item.src) {
      return image;
    }
  }

  return null;
}

const { openAt } = useGalleryLightbox({
  items: () => props.items,
  resolveImageElement,
});

function openLightboxAt(frameIndex: number) {
  // Пауза играющему видео — тем же механизмом, что и кнопка паузы.
  userPaused.value = true;
  void openAt(frameIndex);
}

// Тап по фотографии открывает лайтбокс, протягивание — нет.
// Порог тот же, по которому карусель отличает свайп от «ничего».
let photoPointerId: number | null = null;
let photoStartX = 0;
let photoStartY = 0;

function onPhotoPointerDown(event: PointerEvent) {
  photoPointerId = event.pointerId;
  photoStartX = event.clientX;
  photoStartY = event.clientY;
}

function onPhotoPointerCancel() {
  photoPointerId = null;
}

// Enter/Space (и активация из скринридера) приходят click'ом с detail === 0.
// Указательный тап уже обработан в pointerup — его click пропускаем.
function onPhotoClick(event: MouseEvent, frameIndex: number) {
  if (event.detail !== 0) {
    return;
  }

  openLightboxAt(frameIndex);
}

function onPhotoPointerUp(event: PointerEvent, frameIndex: number) {
  if (photoPointerId !== event.pointerId) {
    return;
  }
  photoPointerId = null;

  const dx = event.clientX - photoStartX;
  const dy = event.clientY - photoStartY;
  if (Math.hypot(dx, dy) >= uiConfig.gallery.swipeThresholdPx) {
    return;
  }

  openLightboxAt(frameIndex);
}
</script>
