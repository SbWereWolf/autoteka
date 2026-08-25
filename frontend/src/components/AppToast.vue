<template>
  <!-- Плашка сообщения: геометрия/оформление скопированы с пилла доскролла
       (OverscrollOpenLink). Озвучивание делает sr-only-блок в App.vue,
       поэтому здесь role="status" не дублируем и прячем от скринридера. -->
  <div
    class="app-toast-anchor pointer-events-none fixed left-0 right-0 z-50 flex justify-center px-4"
    aria-hidden="true"
  >
    <div
      class="app-toast-pill ui-transition rounded-2xl px-4 py-3 text-sm flex items-center gap-3"
      :style="toastStyle"
    >
      <div class="text-center">
        <span :style="{ color: 'var(--text)' }">{{ text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  message: string;
}>();

const VISIBLE_MS = 3000;

// text держим отдельно от props.message: во время затухания плашка
// должна показывать последний непустой текст (announce сначала чистит ref).
const text = ref("");
const visible = ref(false);

let hideTimer: number | null = null;

function clearHideTimer() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

watch(
  () => props.message,
  (next: string) => {
    if (next === "") {
      return;
    }

    text.value = next;
    visible.value = true;

    clearHideTimer();
    hideTimer = window.setTimeout(() => {
      visible.value = false;
      hideTimer = null;
    }, VISIBLE_MS);
  },
);

onBeforeUnmount(clearHideTimer);

const toastStyle = computed(() => ({
  background: "var(--surface-strong)",
  border: "0.0625rem solid var(--border)",
  boxShadow: "var(--shadow)",
  transitionDuration: "200ms",
  opacity: visible.value ? 1 : 0,
  transform: visible.value ? "translateY(0)" : "translateY(0.75rem)",
}));
</script>

<style scoped>
.app-toast-anchor {
  bottom: calc(var(--shop-actionbar-h) + 1rem);
}

@media (prefers-reduced-motion: reduce) {
  .app-toast-pill {
    transition: none !important;
  }
}
</style>
