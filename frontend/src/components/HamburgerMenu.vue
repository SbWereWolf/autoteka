<template>
  <div v-if="state.menuOpen" class="fixed inset-0 z-[60]">
    <button
      class="absolute inset-0 h-full w-full"
      :style="overlayStyle"
      aria-label="Закрыть меню"
      type="button"
      @click="closeMenu"
    />

    <aside
      class="catalog-menu-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Меню и фильтры"
      @click.stop
    >
      <div class="catalog-menu-header">
        <button
          ref="closeBtnEl"
          class="catalog-close-button ui-bounce"
          aria-label="Закрыть"
          type="button"
          @click="closeMenu"
        >
          <span class="text-2xl leading-none">×</span>
        </button>
      </div>

      <div class="catalog-menu-content">
        <section class="space-y-3">
          <h2 class="catalog-menu-label">Город</h2>
          <CitySelect
            aria-label="Город"
            test-id="menu-city-select"
            @changed="closeMenu"
          />
        </section>

        <section class="space-y-3">
          <h2 class="catalog-menu-label">Категории</h2>
          <CategoryChips />
        </section>
      </div>
    </aside>
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

const closeBtnEl = ref<HTMLButtonElement | null>(null);
let prevFocused: HTMLElement | null = null;

const overlayStyle = computed(() => ({
  background:
    "linear-gradient(180deg, oklch(1 0 0 / 0.82), oklch(1 0 0 / 0.72))",
  border: "none",
}));

function closeMenu() {
  state.menuOpen = false;
}

function focusMenuButton() {
  document
    .querySelector<HTMLElement>("[data-menu-button]")
    ?.focus();
}

watch(
  () => state.menuOpen,
  async (open) => {
    if (open) {
      prevFocused = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      await nextTick();
      closeBtnEl.value?.focus();
      return;
    }

    document.body.style.overflow = "";
    if (prevFocused && prevFocused.isConnected) {
      prevFocused.focus();
      return;
    }
    focusMenuButton();
  },
);

function onKeydown(event: KeyboardEvent) {
  if (!state.menuOpen) return;
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeMenu();
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>
