<template>
  <Teleport to="body">
    <div v-if="state.offersOpen" class="fixed inset-0 z-[60]">
      <button
        class="catalog-offers-sheet-overlay-button"
        aria-label="Закрыть"
        type="button"
        @click="closeSheet"
      />

      <aside
        ref="dialogRef"
        class="catalog-offers-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Акции"
        tabindex="-1"
        @click.stop
      >
        <div class="catalog-offers-sheet-handle" aria-hidden="true">
          <div class="catalog-offers-sheet-handle-bar" />
        </div>

        <div ref="chipListRef" class="catalog-menu-chip-list">
          <button
            v-for="f in features"
            :key="f.id"
            type="button"
            class="catalog-menu-chip"
            :aria-pressed="state.selectedFeatureId === f.id"
            @click="onPick(f.id)"
          >
            <span>{{ f.title }}</span>
            <svg
              v-if="state.selectedFeatureId === f.id"
              class="catalog-menu-chip-check"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M19.2929 5.29302C19.6834 4.90249 20.3164 4.90249 20.707 5.29302C21.0975 5.68354 21.0975 6.31655 20.707 6.70708L9.70696 17.7071C9.31643 18.0976 8.68342 18.0976 8.29289 17.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6835 3.29289 11.293C3.68342 10.9025 4.31643 10.9025 4.70696 11.293L8.99992 15.586L19.2929 5.29302Z"
              />
            </svg>
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { state, setSelectedFeature } from "../state";
import { useFocusTrap } from "../composables/useFocusTrap";

const dialogRef = ref<HTMLElement | null>(null);
const chipListRef = ref<HTMLElement | null>(null);
const open = computed(() => state.offersOpen);
const features = computed(() => state.features);

function closeSheet() {
  state.offersOpen = false;
}

function onPick(id: string) {
  setSelectedFeature(state.selectedFeatureId === id ? null : id);
  closeSheet();
}

useFocusTrap({
  open,
  dialogRef,
  onClose: closeSheet,
  fallbackSelector: "[data-offers-trigger]",
});

/*
 * Список ограничен по высоте и прокручивается, поэтому при открытии
 * подводим его к выбранной фишке — мгновенно, скроллом контейнера
 * (не scrollIntoView: тот тянет за собой и предков). Выбранной нет —
 * оставляем как есть, список открывается с начала.
 *
 * Watch объявлен ПОСЛЕ useFocusTrap умышленно: тот на том же nextTick
 * ставит фокус на первую фишку, а focus() сам прокручивает контейнер
 * к цели. Наш обработчик должен отработать последним — и он же уводит
 * фокус с первой фишки на выбранную, иначе фокус остаётся на строке,
 * которую скролл увёл из вида. preventScroll — чтобы перевод фокуса не
 * перебил только что выставленный scrollTop.
 */
watch(open, async (next, prev) => {
  if (next === prev || !next) return;
  await nextTick();

  const list = chipListRef.value;
  const selected =
    list?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if (!list || !selected) return;

  list.scrollTop = selected.offsetTop - list.offsetTop;
  selected.focus({ preventScroll: true });
});
</script>
