<template>
  <div class="relative">
    <slot />

    <!-- Indicator: появляется только в момент «доскролла» (когда пользователь тянет/скроллит в конце) -->
    <div
      class="pointer-events-none fixed left-0 right-0 bottom-4 z-40 flex justify-center"
    >
      <div
        class="ui-transition rounded-2xl px-4 py-3 text-sm flex items-center gap-3"
        :style="pillStyle"
      >
        <div
          class="h-2 w-24 rounded-full overflow-hidden"
          :style="barStyle"
        >
          <div class="h-full ui-transition" :style="fillStyle"></div>
        </div>
        <div class="whitespace-nowrap">
          <span v-if="!armed" :style="{ color: 'var(--text)' }"
            >Потяните, чтобы перейти</span
          >
          <span v-else :style="{ color: 'var(--text)' }"
            ><b>Отпустите для перехода</b></span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { uiConfig } from "../config/ui";

const props = withDefaults(
  defineProps<{
    url: string;
    thresholdPx?: number;
    holdMs?: number;
    cooldownMs?: number;
  }>(),
  {
    thresholdPx: uiConfig.overscroll.thresholdPx,
    holdMs: uiConfig.overscroll.holdMs,
    cooldownMs: uiConfig.overscroll.cooldownMs,
  },
);

const threshold = computed(() => props.thresholdPx);
const holdMs = computed(() => props.holdMs);
const cooldownMs = computed(() => props.cooldownMs);

const pull = ref(0);
const armed = ref(false);
const vibed = ref(false);
const triggered = ref(false);
const cooldownUntil = ref(0);

const isCoolingDown = computed(
  () => performance.now() < cooldownUntil.value,
);

function atBottom() {
  const el = (document.scrollingElement ||
    document.documentElement) as HTMLElement;
  return el.scrollTop + window.innerHeight >= el.scrollHeight - 2;
}

function reset() {
  pull.value = 0;
  armed.value = false;
  vibed.value = false;
  holdStartedAt = 0;
}

function startCooldown() {
  cooldownUntil.value = performance.now() + cooldownMs.value;
}

function openUrl() {
  if (triggered.value) return;
  if (isCoolingDown.value) return;
  triggered.value = true;
  startCooldown();
  history.pushState(null, "", window.location.href);
  window.location.href = props.url;
}

function maybeVibe() {
  if (vibed.value) return;
  // haptic: web vibration API (if supported)
  if (navigator.vibrate) navigator.vibrate(15);
  vibed.value = true;
}

let startY = 0;
let holdStartedAt = 0;

function updateArmedState(now: number) {
  if (pull.value < threshold.value) {
    holdStartedAt = 0;
    armed.value = false;
    vibed.value = false;
    return;
  }

  if (holdStartedAt === 0) holdStartedAt = now;
  const heldFor = now - holdStartedAt;
  const ok = heldFor >= holdMs.value;
  if (ok && !armed.value) {
    armed.value = true;
    maybeVibe();
  }
}

function onTouchStart(e: TouchEvent) {
  if (triggered.value || isCoolingDown.value) return;
  if (!atBottom()) return;
  startY = e.touches[0]?.clientY ?? 0;
}

function onTouchMove(e: TouchEvent) {
  if (triggered.value || isCoolingDown.value) return;
  if (!atBottom()) return;

  const y = e.touches[0]?.clientY ?? 0;
  const delta = startY - y; // upward finger move => positive delta (page scroll down)

  if (delta <= 0) {
    reset();
    return;
  }

  pull.value = Math.min(delta, threshold.value * 1.25);
  updateArmedState(performance.now());
}

function onTouchEnd() {
  if (armed.value) openUrl();
  reset();
}

let wheelReleaseTimer: number | null = null;

function onWheel(e: WheelEvent) {
  if (triggered.value || isCoolingDown.value) return;
  if (!atBottom()) return;
  if (e.deltaY <= 0) return;

  pull.value = Math.min(
    pull.value + e.deltaY * 0.15,
    threshold.value * 1.25,
  );
  updateArmedState(performance.now());

  if (wheelReleaseTimer) window.clearTimeout(wheelReleaseTimer);

  // "release" for wheel/trackpad = short pause after overscroll
  wheelReleaseTimer = window.setTimeout(() => {
    if (armed.value) openUrl();
    reset();
  }, 180);
}

onMounted(() => {
  window.addEventListener("touchstart", onTouchStart, {
    passive: true,
  });
  window.addEventListener("touchmove", onTouchMove, {
    passive: true,
  });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
  window.removeEventListener("wheel", onWheel);
  if (wheelReleaseTimer) window.clearTimeout(wheelReleaseTimer);
});

const progress = computed(() =>
  Math.max(0, Math.min(1, pull.value / threshold.value)),
);

const pillStyle = computed(() => {
  const visible = pull.value > 0 && !triggered.value;
  return {
    background: "var(--surface-strong)",
    border: "0.0625rem solid var(--border)",
    boxShadow: "var(--shadow)",
    transitionDuration: "200ms",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(0.75rem)",
  };
});

const barStyle = computed(() => ({
  background: "color-mix(in oklch, var(--text) 18%, transparent)",
}));

const fillStyle = computed(() => ({
  width: `${progress.value * 100}%`,
  background: armed.value
    ? "color-mix(in oklch, var(--accent) 80%, oklch(0.98 0 0))"
    : "var(--accent)",
  transitionDuration: "120ms",
}));
</script>
