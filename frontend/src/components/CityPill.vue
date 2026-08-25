<template>
  <div ref="rootRef" class="catalog-city-pill-root">
    <button
      ref="triggerRef"
      type="button"
      class="catalog-city-pill"
      data-testid="topbar-city-pill"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="`Город: ${currentTitle}`"
      @click="toggle"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="catalog-city-pill-pin"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 1C14.3869 1 16.6764 1.94791 18.3643 3.63574C20.0521 5.32357 21 7.61305 21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94791 5.32357 5.63574 3.63574C7.32357 1.94791 9.61305 1 12 1ZM12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7Z"
        />
      </svg>
      <span>{{ currentTitle }}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="catalog-city-pill-chevron"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M6 9 L12 15 L18 9" />
      </svg>
    </button>

    <div
      v-if="open"
      ref="panelRef"
      class="catalog-city-pill-panel"
      role="menu"
      aria-label="Выбор города"
    >
      <button
        v-for="c in cities"
        :key="c.code"
        type="button"
        role="menuitemradio"
        :aria-checked="c.code === cityCode"
        class="catalog-city-pill-option"
        @click="select(c.code)"
      >
        <span>{{ c.title }}</span>
        <svg
          v-if="c.code === cityCode"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 12.5 L10 17.5 L19 6.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { state, setCity } from "../state";
import { useFocusTrap } from "../composables/useFocusTrap";

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const cities = computed(() => state.cities);
const cityCode = computed(() => state.cityCode);
const currentTitle = computed(
  () =>
    state.cities.find((c) => c.code === state.cityCode)?.title ?? "",
);

function toggle() {
  open.value = !open.value;
}
function close() {
  open.value = false;
}
function select(code: string) {
  setCity(code);
  close();
}

useFocusTrap({
  open,
  dialogRef: panelRef,
  onClose: close,
  fallbackSelector: "[data-testid='topbar-city-pill']",
});

function onPointerDown(event: PointerEvent) {
  if (!open.value) return;
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close();
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener("pointerdown", onPointerDown, true);
  } else {
    document.removeEventListener("pointerdown", onPointerDown, true);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown, true);
});
</script>
