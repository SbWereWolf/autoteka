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

function atBottom() {
  const doc = document.documentElement;
  return doc.scrollTop + window.innerHeight >= doc.scrollHeight - 2;
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
  // haptic: web vibration API (if supported)
  if (navigator.vibrate) navigator.vibrate(15);
  vibed.value = true;
}

let startY = 0;

function onTouchStart(e: TouchEvent) {
  if (!atBottom()) return;
  startY = e.touches[0]?.clientY ?? 0;
}
function onTouchMove(e: TouchEvent) {
  if (!atBottom()) return;
  const y = e.touches[0]?.clientY ?? 0;
  const delta = startY - y; // upward finger move => positive delta
  if (delta <= 0) {
    pull.value = 0;
    armed.value = false;
    vibed.value = false;
    return;
  }
  pull.value = Math.min(delta, threshold.value * 1.25);
  armed.value = pull.value >= threshold.value;
  if (armed.value) maybeVibe();
}
function onTouchEnd() {
  if (armed.value) openUrl();
  reset();
}

function onWheel(e: WheelEvent) {
  if (!atBottom()) return;
  if (e.deltaY <= 0) return;
  pull.value = Math.min(pull.value + e.deltaY * 0.15, threshold.value * 1.25);
  armed.value = pull.value >= threshold.value;
  if (armed.value) maybeVibe();
  window.clearTimeout((onWheel as any)._t);
  (onWheel as any)._t = window.setTimeout(() => {
    if (!armed.value) reset();
  }, 160);
}

onMounted(() => {
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
  window.removeEventListener("wheel", onWheel);
});

const progress = computed(() => Math.max(0, Math.min(1, pull.value / threshold.value)));

const pillStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)",
  transitionDuration: "200ms",
  opacity: atBottom() ? 1 : 0,
  transform: atBottom() ? "translateY(0)" : "translateY(12px)"
}));

const barStyle = computed(() => ({
  background: "color-mix(in oklch, var(--text) 18%, var(--surface))"
}));

const fillStyle = computed(() => ({
  width: `${progress.value * 100}%`,
  background: progress.value < 1 ? "var(--accent)" : "color-mix(in oklch, var(--accent) 80%, oklch(100% 0 0))",
  transitionDuration: "120ms"
}));
</script>
