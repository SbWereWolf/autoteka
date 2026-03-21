<template>
  <div class="shop-content-card space-y-4">
    <h2 class="m-0 text-xl font-semibold text-slate-900">
      {{ message }}
    </h2>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
        @click="goBack"
        aria-label="Назад"
      >
        ←
      </button>

      <button
        v-if="retryLabel"
        type="button"
        class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
        @click="$emit('retry')"
      >
        {{ retryLabel }}
      </button>

      <button
        type="button"
        class="ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
        @click="goCatalog"
      >
        В каталог
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineEmits<{
  retry: [];
}>();

withDefaults(
  defineProps<{
    message: string;
    retryLabel?: string;
  }>(),
  {
    retryLabel: "Повторить",
  },
);

const router = useRouter();

function goBack() {
  router.back();
}

function goCatalog() {
  router.push({ name: "catalog" });
}
</script>
