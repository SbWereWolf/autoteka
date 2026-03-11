<template>
  <div v-if="shouldShow" class="hidden 3xl:block mt-6">
    <div class="text-panel">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div
            class="text-xs uppercase tracking-wide"
            :style="{ color: 'var(--muted)' }"
          >
            CSS variables (runtime)
          </div>
          <div
            class="mt-1 text-sm font-semibold truncate"
            :style="{ color: 'var(--text)' }"
          >
            theme-{{ state.theme }}
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            class="ui-transition ui-interactive ui-bounce rounded-xl min-h-12 px-4 py-3 text-sm"
            type="button"
            @click="copyJson"
            :title="copyHint"
          >
            {{ copied ? "Скопировано ✓" : "Скопировать JSON" }}
          </button>

          <button
            class="ui-transition ui-interactive ui-bounce rounded-xl min-h-12 px-4 py-3 text-sm"
            type="button"
            @click="resetTheme"
            :disabled="Object.keys(overrides).length === 0"
            :aria-disabled="Object.keys(overrides).length === 0"
            :class="
              Object.keys(overrides).length === 0
                ? 'opacity-60 cursor-not-allowed'
                : ''
            "
            title="Удалить все overrides для текущей темы"
          >
            Сбросить тему
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-6 7xl:grid-cols-2">
        <section v-for="section in sections" :key="section.key">
          <div
            class="text-xs uppercase tracking-wide"
            :style="{ color: 'var(--muted)' }"
          >
            {{ section.title }}
          </div>
          <div class="mt-3 space-y-2">
            <VarRow
              v-for="v in section.vars"
              :key="`${state.theme}:${v}`"
              :var-name="v"
              :app-el="appEl"
              :theme="state.theme"
              :overrides="overrides"
              @set="setVar"
              @reset="resetVar"
            />
          </div>
        </section>
      </div>

      <div class="mt-4 text-xs" :style="{ color: 'var(--muted)' }">
        Изменения применяются мгновенно и сохраняются в localStorage.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { state } from "../state";
import {
  EDITOR_GROUPS,
  loadThemeOverrides,
  setThemeOverride,
  removeThemeOverride,
  clearThemeOverrides,
} from "../utils/themeOverrides";
import VarRow from "./CssVarsEditorVarRow.vue";

const appEl = ref<HTMLElement | null>(null);
const overrides = reactive<Record<string, string>>({});

const shouldShow = computed(
  () => state.themeEditorEnabled && state.themeEditorOpen,
);
const sections = [
  { key: "palette", title: "Палитра", vars: EDITOR_GROUPS.palette },
  {
    key: "interactive",
    title: "Интерактив",
    vars: EDITOR_GROUPS.interactive,
  },
  {
    key: "typography",
    title: "Типографика",
    vars: EDITOR_GROUPS.typography,
  },
  { key: "layout", title: "Разметка", vars: EDITOR_GROUPS.layout },
  { key: "catalog", title: "Каталог", vars: EDITOR_GROUPS.catalog },
  {
    key: "shop",
    title: "Карточка магазина",
    vars: EDITOR_GROUPS.shop,
  },
] as const;

function syncOverrides() {
  const next = loadThemeOverrides(state.theme);
  for (const k of Object.keys(overrides)) delete overrides[k];
  for (const [k, v] of Object.entries(next)) overrides[k] = v;
}

function setVar(varName: string, value: string) {
  if (!appEl.value) return;
  const next = setThemeOverride(state.theme, varName, value);
  appEl.value.style.setProperty(varName, value);
  for (const k of Object.keys(overrides)) delete overrides[k];
  for (const [k, v] of Object.entries(next)) overrides[k] = v;
}

function resetVar(varName: string) {
  if (!appEl.value) return;
  const next = removeThemeOverride(state.theme, varName);
  appEl.value.style.removeProperty(varName);
  for (const k of Object.keys(overrides)) delete overrides[k];
  for (const [k, v] of Object.entries(next)) overrides[k] = v;
}

function resetTheme() {
  if (!appEl.value) return;
  for (const k of Object.keys(overrides))
    appEl.value.style.removeProperty(k);
  clearThemeOverrides(state.theme);
  syncOverrides();
}

const copied = ref(false);
const copyHint = computed(
  () => "Скопировать overrides для активной темы",
);

async function copyJson() {
  const payload = JSON.stringify(
    { theme: state.theme, overrides: { ...overrides } },
    null,
    2,
  );
  try {
    await navigator.clipboard.writeText(payload);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 900);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = payload;
    ta.style.display = "none";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      copied.value = true;
      window.setTimeout(() => (copied.value = false), 900);
    } finally {
      ta.remove();
    }
  }
}

onMounted(() => {
  appEl.value = document.querySelector<HTMLElement>(".app");
  syncOverrides();
});

watch(
  () => state.theme,
  () => syncOverrides(),
);

watch(
  () => state.themeEditorOpen,
  (open) => {
    if (open) syncOverrides();
  },
);
</script>
