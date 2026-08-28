<template>
  <dialog
    ref="dialogRef"
    class="city-selection-error-dialog m-auto w-[min(92vw,32rem)] rounded-2xl border-0 p-0 shadow-2xl"
    aria-labelledby="city-selection-error-title"
    aria-describedby="city-selection-error-message"
  >
    <section class="p-6">
      <h2 id="city-selection-error-title" class="text-xl font-semibold">
        Ошибка выбора города
      </h2>
      <p id="city-selection-error-message" class="mt-3 text-sm">
        Определить город для загрузки списка магазинов не удалось
      </p>
      <button
        type="button"
        class="mt-6 min-h-11 rounded-xl border px-4 py-2 font-medium"
        autofocus
        @click="closeDialog"
      >
        Закрыть
      </button>
    </section>
  </dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { state } from "../state";

const dialogRef = ref<HTMLDialogElement | null>(null);

function syncDialog() {
  const dialog = dialogRef.value;
  if (!dialog) {
    return;
  }

  if (state.citySelectionError) {
    if (!dialog.open) {
      dialog.showModal();
    }
    return;
  }

  if (dialog.open) {
    dialog.close();
  }
}

function closeDialog() {
  dialogRef.value?.close();
}

onMounted(syncDialog);
watch(() => state.citySelectionError, syncDialog);
</script>

<style scoped>
.city-selection-error-dialog {
  background: var(--surface, white);
  color: var(--text, #0f172a);
}

.city-selection-error-dialog::backdrop {
  background: rgb(15 23 42 / 65%);
}
</style>
