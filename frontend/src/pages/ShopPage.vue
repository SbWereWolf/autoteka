<template>
  <div class="app-container pb-16 3xl:pb-24 7xl:pb-28">
    <div class="pt-4">
      <button
        class="ui-transition ui-interactive ui-bounce rounded-xl min-h-12 px-4 py-3 text-sm"
        @click="router.back()"
      >
        ← Назад
      </button>

      <div class="mt-3 text-panel">
        <div
          class="text-2xl font-bold"
          :style="{ fontFamily: 'var(--font-display)' }"
        >
          {{ titleText }}
        </div>
      </div>

      <div
        v-if="isLoading"
        class="mt-8 text-sm"
        :style="{ color: 'var(--muted)' }"
      >
        Загрузка магазина...
      </div>

      <div
        v-else-if="notFound"
        class="mt-8 text-sm"
        :style="{ color: 'var(--muted)' }"
      >
        Магазин не найден.
      </div>

      <div
        v-else-if="loadError"
        class="mt-8 text-sm"
        :style="{ color: 'var(--muted)' }"
      >
        Ошибка загрузки магазина.
      </div>

      <div v-else-if="shop" class="mt-3">
        <div class="text-panel">
          <ShopMetaBadges
            :categories="categoryNames"
            :features="featureNames"
          />
        </div>

        <div class="mt-4 space-y-4 3xl:space-y-6">
          <div class="relative">
            <GalleryCarousel
              :items="galleryImages"
              empty-title=""
              empty-text="Для этого магазина фото ещё не загружены"
            />
            <div
              class="absolute left-3 top-3 rounded-2xl px-3 py-2 text-xs ui-transition"
              :style="hoursStyle"
            >
              <div class="whitespace-pre-line">
                {{ shop.workHours }}
              </div>
            </div>
          </div>

          <section class="text-panel">
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Описание
            </div>
            <div
              class="mt-2 text-sm leading-relaxed"
              :style="{ color: 'var(--text)' }"
            >
              {{ shop.description }}
            </div>
          </section>

          <section class="text-panel">
            <div
              class="text-xs uppercase tracking-wide"
              :style="{ color: 'var(--muted)' }"
            >
              Контакты
            </div>
            <ul class="mt-2 space-y-2">
              <li v-for="item in contactRows" :key="item.key">
                <a
                  v-if="item.href"
                  class="ui-transition shop-contact-link text-sm underline"
                  :style="{ color: 'var(--text)' }"
                  :href="item.href"
                  :target="item.target"
                  rel="noreferrer"
                >
                  {{ item.label }}
                </a>
                <div
                  v-else
                  class="text-sm"
                  :style="{ color: 'var(--text)' }"
                >
                  {{ item.label }}
                </div>
              </li>
            </ul>
          </section>

          <section class="flex gap-3 3xl:gap-6">
            <a
              v-if="hasSiteUrl"
              class="ui-transition ui-primary ui-bounce inline-flex items-center justify-center rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
              :style="{ boxShadow: 'var(--shadow)' }"
              :href="siteUrl"
              target="_self"
            >
              Перейти на сайт ↗
            </a>

            <button
              v-else
              class="ui-transition ui-interactive rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold opacity-60 cursor-not-allowed"
              type="button"
              disabled
              aria-disabled="true"
              title="У магазина нет ссылки на сайт"
            >
              Сайт недоступен
            </button>

            <div
              class="flex-1 rounded-2xl px-4 py-3 text-xs ui-transition"
              :style="hintStyle"
            >
              <template v-if="hasSiteUrl"
                >Или дотяните вниз в конце страницы</template
              >
              <template v-else
                >Ссылка на сайт не указана в моках</template
              >
            </div>
          </section>

          <CssVarsEditor />

          <div class="h-24 3xl:h-56 7xl:h-64"></div>
        </div>
      </div>
    </div>

    <OverscrollOpenLink
      v-if="shop && hasSiteUrl"
      :url="siteUrl"
      :threshold-px="uiConfig.overscroll.thresholdPx"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import OverscrollOpenLink from "../components/OverscrollOpenLink.vue";
import ShopMetaBadges from "../components/ShopMetaBadges.vue";
import CssVarsEditor from "../components/CssVarsEditor.vue";
import { uiConfig } from "../config/ui";
import type { ContactsResponse, Shop } from "../types";
import { apiClient } from "../api/MockApiClient";
import { ApiError } from "../api/ApiClient";
import { state } from "../state";
import { mapIdsToNames } from "../utils/mapIdsToNames";

const route = useRoute();
const router = useRouter();

const ACCEPTABLE_TYPES = [
  "phone",
  "email",
  "telegram",
  "whatsapp",
  "address",
];

const shopId = computed(() => String(route.params.id ?? ""));
const shop = ref<Shop | null>(null);
const contacts = ref<ContactsResponse>({});
const isLoading = ref(false);
const loadError = ref(false);
const notFound = ref(false);

const titleText = computed(() => {
  if (isLoading.value) return "Загрузка...";
  if (notFound.value) return "Магазин не найден";
  return shop.value?.name ?? "Магазин";
});

const categoryMap = computed(
  () => new Map(state.categories.map((item) => [item.id, item.name])),
);
const featureMap = computed(
  () => new Map(state.features.map((item) => [item.id, item.name])),
);

const categoryNames = computed(() =>
  mapIdsToNames(shop.value?.categoryIds ?? [], categoryMap.value),
);
const featureNames = computed(() =>
  mapIdsToNames(shop.value?.featureIds ?? [], featureMap.value),
);

const galleryImages = computed<string[]>(() => {
  const s = shop.value;
  if (!s) return [];
  return Array.isArray(s.galleryImages)
    ? s.galleryImages.filter(Boolean)
    : [];
});

const siteUrl = computed(() =>
  String(shop.value?.siteUrl ?? "").trim(),
);
const hasSiteUrl = computed(() => siteUrl.value.length > 0);

const hoursStyle = computed(() => ({
  background:
    "color-mix(in oklch, var(--surface-strong) 88%, transparent)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
}));

const hintStyle = computed(() => ({
  background: "var(--surface-strong)",
  color: "var(--muted)",
  border: "1px solid var(--border)",
}));

const contactRows = computed(() => {
  const rows: Array<{
    key: string;
    label: string;
    href: string | null;
    target?: string;
  }> = [];
  for (const type of ACCEPTABLE_TYPES) {
    for (const value of contacts.value[type] ?? []) {
      const href = hrefFor(type, value);
      rows.push({
        key: `${type}:${value}`,
        label: labelFor(type, value),
        href,
        target: href?.startsWith("http") ? "_blank" : "_self",
      });
    }
  }
  return rows;
});

function hrefFor(type: string, value: string) {
  if (type === "phone")
    return `tel:${value.replace(/\s|\(|\)|-/g, "")}`;
  if (type === "email") return `mailto:${value}`;
  if (type === "telegram" || type === "whatsapp") return value;
  return null;
}

function labelFor(type: string, value: string) {
  const map: Record<string, string> = {
    phone: "Телефон",
    email: "Email",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    address: "Адрес",
    text: "Контакт",
  };
  return `${map[type] ?? type}: ${value}`;
}

async function loadShop() {
  isLoading.value = true;
  loadError.value = false;
  notFound.value = false;
  shop.value = null;
  contacts.value = {};
  try {
    const loadedShop = await apiClient.getShop(shopId.value);
    const loadedContacts = await apiClient.postAcceptableContactTypes(
      shopId.value,
      ACCEPTABLE_TYPES,
    );
    shop.value = loadedShop;
    contacts.value = loadedContacts;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound.value = true;
    } else {
      loadError.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

watch(shopId, () => {
  loadShop();
});

onMounted(() => {
  loadShop();
});
</script>
