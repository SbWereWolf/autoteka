<template>
  <div class="relative" v-bind="rootAttrs">
    <img
      ref="imgEl"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :decoding="decoding"
      :class="['ui-transition', imgClass, loaded ? 'opacity-100' : 'opacity-0']"
      @load="onLoad"
      @error="onError"
    />

    <!-- Skeleton/placeholder while the image is loading (no layout shift; parent should reserve space) -->
    <div
      v-if="!loaded && !errored"
      class="absolute inset-0 ui-skeleton pointer-events-none"
      aria-hidden="true"
    />

    <!-- Spinner (optional) -->
    <div
      v-if="spinner && !loaded && !errored"
      class="absolute inset-0 grid place-items-center pointer-events-none"
      aria-hidden="true"
    >
      <div
        class="ui-spin h-7 w-7 rounded-full border-2"
        :style="spinnerStyle"
      />
    </div>

    <!-- Fallback if the image failed to load -->
    <div
      v-if="errored"
      class="absolute inset-0 grid place-items-center text-xs pointer-events-none"
      :style="errorStyle"
      aria-hidden="true"
    >
      Нет изображения
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    loading?: "lazy" | "eager";
    decoding?: "async" | "auto" | "sync";
    imgClass?: string;
    spinner?: boolean;
  }>(),
  {
    alt: "",
    loading: "lazy",
    decoding: "async",
    imgClass: "w-full h-full object-contain",
    spinner: false
  }
);

const attrs = useAttrs();
const rootAttrs = computed(() => attrs);

const imgEl = ref<HTMLImageElement | null>(null);
const loaded = ref(false);
const errored = ref(false);

function markIfAlreadyLoaded() {
  const el = imgEl.value;
  if (!el) return;
  if (el.complete && el.naturalWidth > 0) {
    loaded.value = true;
    errored.value = false;
  }
}

function onLoad() {
  loaded.value = true;
  errored.value = false;
}

function onError() {
  loaded.value = false;
  errored.value = true;
}

watch(
  () => props.src,
  async () => {
    loaded.value = false;
    errored.value = false;
    await nextTick();
    markIfAlreadyLoaded();
  }
);

onMounted(() => {
  markIfAlreadyLoaded();
});

const spinnerStyle = computed(() => ({
  borderColor: "color-mix(in oklch, var(--text) 22%, transparent)",
  borderTopColor: "var(--accent)"
}));

const errorStyle = computed(() => ({
  background: "color-mix(in oklch, var(--text) 6%, var(--surface-strong))",
  color: "var(--muted)"
}));
</script>
