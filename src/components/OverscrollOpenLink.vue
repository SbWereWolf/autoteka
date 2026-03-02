<template>
  <div class="relative">
    <slot />

    <!-- Indicator -->
    <div class="pointer-events-none fixed left-0 right-0 bottom-4 z-40 flex justify-center">
      <div
        class="ui-transition rounded-2xl px-4 py-3 text-sm flex items-center gap-3"
        :style="pillStyle"
      >
        <div class="h-2 w-24 rounded-full overflow-hidden" :style="barStyle">
          <div class="h-full ui-transition" :style="fillStyle"></div>
        </div>
        <div class="whitespace-nowrap">
          <span v-if="progress < 1" :style="{ color: 'var(--text)' }">Потяните, чтобы перейти</span>
          <span v-else :style="{ color: 'var(--text)' }"><b>Отпустите для перехода</b></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{ url: string; thresholdPx?: number }>();

const threshold = computed(() => props.thresholdPx ?? 90);
const pull = ref(0);
const armed = ref(false);
const vibed = ref(false);
const isAtBottom = ref(false);

// Tolerance for rounding/zoom differences across browsers.
const BOTTOM_EPS = 48; // px

function scrollingEl() {
  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

function atBottom() {
  const el = scrollingEl();
  const top = el.scrollTop;
  const h = el.clientHeight || window.innerHeight;
  const sh = el.scrollHeight;

  // Some browsers report window scroll instead of element scroll in certain modes.
  const winTop = window.scrollY || 0;
  const winH = window.innerHeight || h;
  const docSh = document.documentElement.scrollHeight || sh;

  const a = top + h >= sh - BOTTOM_EPS;
  const b = winTop + winH >= docSh - BOTTOM_EPS;
  return a || b;
}

function syncBottom() {
  isAtBottom.value = atBottom();
}

function reset() {
  pull.value = 0;
  armed.value = false;
  vibed.value = false;
}

function openUrl() {
  window.location.href = props.url;
}

function maybeVibe() {
  if (vibed.value) return;
  if (navigator.vibrate) navigator.vibrate(15);
  vibed.value = true;
}

let startY = 0;

function onTouchStart(e: TouchEvent) {
  startY = e.touches[0]?.clientY ?? 0;
  syncBottom();
}

function onTouchMove(e: TouchEvent) {
  // allow the pull to continue once it has started, even if bottom toggles due to momentum
  if (!isAtBottom.value && pull.value === 0) return;
  const y = e.touches[0]?.clientY ?? 0;
  const delta = startY - y; // finger moves up => positive delta (trying to scroll further down)

  if (delta <= 0) {
    reset();
    return;
  }

  pull.value = Math.min(delta, threshold.value * 1.25);
  armed.value = pull.value >= threshold.value;
  if (armed.value) maybeVibe();
}

function onTouchEnd() {
  if (armed.value) openUrl();
  reset();
  syncBottom();
}

let wheelReleaseT: number | null = null;
function onWheel(e: WheelEvent) {
  syncBottom();

  // allow building pull once the user is at the bottom (or already pulling)
  if (!isAtBottom.value && pull.value === 0) return;

  if (e.deltaY <= 0) {
    if (pull.value > 0) reset();
    return;
  }

  pull.value = Math.min(pull.value + e.deltaY * 0.15, threshold.value * 1.25);
  armed.value = pull.value >= threshold.value;
  if (armed.value) maybeVibe();

  // "release" for wheel/trackpad: if the user stops scrolling briefly and we are armed -> open
  if (wheelReleaseT) window.clearTimeout(wheelReleaseT);
  wheelReleaseT = window.setTimeout(() => {
    if (armed.value) {
      openUrl();
      return;
    }
    reset();
  }, 180);
}

onMounted(() => {
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("scroll", syncBottom, { passive: true });
  window.addEventListener("resize", syncBottom);
  syncBottom();
});

onBeforeUnmount(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("scroll", syncBottom);
  window.removeEventListener("resize", syncBottom);
  if (wheelReleaseT) window.clearTimeout(wheelReleaseT);
});

const progress = computed(() => Math.max(0, Math.min(1, pull.value / threshold.value)));

const pillStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)",
  backdropFilter: "none",
  transitionDuration: "200ms",
  opacity: isAtBottom.value ? 1 : 0,
  transform: isAtBottom.value ? "translateY(0)" : "translateY(12px)"
}));

const barStyle = computed(() => ({
  background: "color-mix(in oklch, var(--text) 18%, transparent)"
}));

const fillStyle = computed(() => ({
  width: `${progress.value * 100}%`,
  background: progress.value < 1 ? "var(--accent)" : "color-mix(in oklch, var(--accent) 80%, oklch(100% 0 0))",
  transitionDuration: "120ms"
}));
</script>
