<template>
  <div ref="rootRef" class="catalog-sort-dropdown">
    <button
      ref="triggerRef"
      type="button"
      class="catalog-sort-dropdown-trigger"
      data-sort-dropdown-trigger
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="catalog-sort-dropdown-trigger-muted">
        Сортировка:
      </span>
      <span>{{ currentLabel }}</span>
      <svg
        class="catalog-sort-dropdown-chevron"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M6 9 L12 15 L18 9" />
      </svg>
    </button>

    <div
      v-if="open"
      ref="panelRef"
      class="catalog-sort-dropdown-panel"
      role="menu"
      aria-label="Сортировка"
    >
      <button
        v-for="mode in modes"
        :key="mode"
        type="button"
        class="catalog-sort-dropdown-option"
        role="menuitemradio"
        :aria-checked="mode === state.sortMode"
        :aria-current="mode === state.sortMode ? 'true' : undefined"
        @click="selectMode(mode)"
      >
        <span>{{ labels[mode] }}</span>
        <svg
          v-if="mode === state.sortMode"
          class="catalog-sort-dropdown-check"
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
import {
  setSortMode,
  state,
  SORT_MODES,
  SORT_MODE_LABELS,
  type SortMode,
} from "../state";
import { useAnnouncer } from "../composables/useAnnouncer";

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const open = ref(false);

const modes = SORT_MODES;
const labels = SORT_MODE_LABELS;
const currentLabel = computed(() => labels[state.sortMode]);

const { announce } = useAnnouncer();

function close() {
  if (!open.value) return;
  open.value = false;
  triggerRef.value?.focus();
}

function toggle() {
  open.value = !open.value;
}

function selectMode(mode: SortMode) {
  setSortMode(mode);
  announce(`Сортировка: ${labels[mode]}`);
  close();
}

function onPointerDown(event: PointerEvent) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    open.value = false;
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
}

watch(open, (next) => {
  if (next) {
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
  } else {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKey);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown, true);
  document.removeEventListener("keydown", onKey);
});
</script>
