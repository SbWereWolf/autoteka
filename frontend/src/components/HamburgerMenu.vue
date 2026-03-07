<template>
  <div>
    <div
      v-if="state.menuOpen"
      class="fixed inset-0 z-50"
      @keydown.esc.prevent.stop="closeMenu"
    >
      <!-- overlay closes the menu on click/tap -->
      <button
        class="absolute inset-0 w-full h-full"
        :style="overlayStyle"
        aria-label="Закрыть меню"
        type="button"
        @click="closeMenu"
      />

      <aside
        class="absolute top-0 left-0 h-full w-[86%] max-w-sm ui-transition ui-surface-strong"
        :style="{ boxShadow: 'var(--shadow)' }"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div
          class="h-14 flex items-center justify-between px-4 border-b"
          :style="{ borderColor: 'var(--border)' }"
        >
          <div
            class="text-sm font-semibold"
            :style="{ color: 'var(--text)' }"
          >
            Меню
          </div>
          <button
            ref="closeBtnEl"
            class="ui-transition ui-interactive ui-bounce rounded-xl h-12 w-12 inline-flex items-center justify-center"
            @click="closeMenu"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div
          class="p-4 space-y-5 overflow-y-auto h-[calc(100%-3.5rem)]"
        >
          <section class="space-y-2">
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Город
            </div>
            <CitySelect />
          </section>

          <section class="space-y-2">
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Категории
            </div>
            <CategoryChips />
          </section>

          <section class="space-y-2">
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Фишка
            </div>
            <FeatureSelect />
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { state } from "../state";
import CitySelect from "./CitySelect.vue";
import CategoryChips from "./CategoryChips.vue";
import FeatureSelect from "./FeatureSelect.vue";

const closeBtnEl = ref<HTMLButtonElement | null>(null);
let prevFocused: HTMLElement | null = null;

const overlayStyle = computed(() => ({
  background: "oklch(0 0 0 / 0.35)",
  border: "none",
}));

function closeMenu() {
  state.menuOpen = false;
}

function focusMenuButton() {
  const btn = document.querySelector<HTMLElement>(
    "[data-menu-button]",
  );
  btn?.focus();
}

watch(
  () => state.menuOpen,
  async (open) => {
    if (open) {
      prevFocused = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      await nextTick();
      closeBtnEl.value?.focus();
    } else {
      document.body.style.overflow = "";
      // Restore focus to the menu button (or previous focused element if available)
      if (prevFocused && prevFocused.isConnected) prevFocused.focus();
      else focusMenuButton();
    }
  },
);

function onKeydown(e: KeyboardEvent) {
  if (!state.menuOpen) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
  }
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() =>
  document.removeEventListener("keydown", onKeydown),
);
</script>
