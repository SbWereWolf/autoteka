<template>
  <div class="flex items-start gap-3">
    <div class="w-44 shrink-0 pt-2">
      <div class="flex items-center gap-2 min-w-0">
        <span
          v-if="isColor"
          class="h-4 w-4 rounded-sm border"
          :style="{ background: readEffectiveValue(), borderColor: 'var(--border)' }"
          :title="readEffectiveValue()"
        />
        <code class="text-xs truncate" :style="{ color: 'var(--muted)' }">{{ varName }}</code>
      </div>
      <div v-if="isOverridden" class="mt-1 text-[0.6875rem]" :style="{ color: 'var(--muted)' }">
        override
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <input
        class="ui-transition ui-interactive rounded-xl min-h-12 px-3 py-3 text-sm w-full"
        :value="draft"
        :data-testid="`css-var-input-${varName}`"
        @input="onInput(($event.target as HTMLInputElement).value)"
        :placeholder="placeholder"
        :data-invalid="invalid ? 'true' : 'false'"
        :aria-invalid="invalid"
      />
      <div v-if="invalid" class="mt-1 text-[0.6875rem]" :style="{ color: 'var(--muted)' }">
        Значение не похоже на валидное для {{ varName }}
      </div>
    </div>

    <button
      class="ui-transition ui-interactive ui-bounce rounded-xl h-12 w-12 grid place-items-center shrink-0"
      type="button"
      @click="$emit('reset', varName)"
      :disabled="!isOverridden"
      :aria-disabled="!isOverridden"
      :class="!isOverridden ? 'opacity-60 cursor-not-allowed' : ''"
      title="Убрать override (вернуться к значению темы)"
    >
      ↺
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { isColorVar, readComputedVar, validateVarValue } from "../utils/themeOverrides";
import type { ThemeId } from "../state";

const props = defineProps<{
  varName: string;
  theme: ThemeId;
  appEl: HTMLElement | null;
  overrides: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "set", varName: string, value: string): void;
  (e: "reset", varName: string): void;
}>();

const isColor = computed(() => isColorVar(props.varName));
const isOverridden = computed(() => props.varName in props.overrides);

function readEffectiveValue() {
  if (!props.appEl) return "";
  return readComputedVar(props.appEl, props.varName);
}

const placeholder = computed(() => readEffectiveValue());

const draft = ref("");
const invalid = ref(false);

function syncDraft() {
  draft.value = props.overrides[props.varName] ?? readEffectiveValue();
  invalid.value = false;
}

function onInput(v: string) {
  draft.value = v;
  const ok = validateVarValue(props.varName, v);
  invalid.value = !ok;
  if (!ok) return;
  emit("set", props.varName, v.trim());
}

watch(
  () => props.theme,
  () => syncDraft(),
);

watch(
  () => props.overrides,
  () => syncDraft(),
  { deep: true },
);

watch(
  () => props.appEl,
  () => syncDraft(),
);

// initial
syncDraft();
</script>

<style scoped>
input[data-invalid="true"] {
  border-color: color-mix(in oklch, var(--accent) 70%, oklch(0.55 0.2 25));
}
</style>
