<template>
  <div class="shop-page-root">
    <div class="app-container pt-2 pb-4 3xl:pb-6">
      <div
        v-if="isLoading"
        class="space-y-4"
        aria-busy="true"
        aria-live="polite"
      >
        <div class="shop-hero-shell">
          <div class="shop-hero-head">
            <div
              class="shop-loading-back-skeleton ui-skeleton"
              data-testid="shop-loading-back-skeleton"
            />
            <div class="shop-loading-logo-skeleton-shell">
              <div
                class="shop-loading-logo-skeleton ui-skeleton"
                data-testid="shop-loading-logo-skeleton"
              />
            </div>
          </div>
          <div class="shop-hero-gallery">
            <div class="h-full w-full ui-skeleton" />
          </div>
        </div>
        <div class="space-y-3">
          <div class="ui-skeleton h-6 w-48 rounded-full" />
          <div class="ui-skeleton h-4 w-full rounded-full" />
          <div class="ui-skeleton h-4 w-[80%] rounded-full" />
        </div>
      </div>

      <div v-else-if="notFound" class="mt-8">
        <ErrorStatePanel
          message="Магазин не найден. Возможно, ссылка устарела или код магазина неверный."
          retry-label=""
        />
      </div>

      <div v-else-if="loadError" class="mt-8">
        <ErrorStatePanel
          message="Не удалось загрузить магазин. Попробуйте ещё раз."
          @retry="loadShop"
        />
      </div>

      <div v-else-if="shop" class="space-y-6">
        <section class="shop-hero-shell">
          <div class="shop-hero-head">
            <button
              class="shop-back-button"
              aria-label="Назад"
              type="button"
              @click="goToCatalog"
            >
              <img
                class="shop-back-raster"
                src="/brand/shop-back-arrow.png"
                alt=""
                aria-hidden="true"
              />
            </button>

            <div class="shop-logo-shell">
              <img
                v-if="shop.thumbUrl"
                class="shop-logo-image"
                :src="shop.thumbUrl"
                :alt="`Логотип ${shop.title}`"
              />
              <div
                v-else
                class="shop-logo-placeholder"
                aria-label="Логотип магазина отсутствует"
              >
                Нет логотипа
              </div>
            </div>
          </div>

          <div class="shop-hero-gallery">
            <GalleryCarousel
              :items="galleryImages"
              empty-title=""
              empty-text="Для этого магазина изображения ещё не загружены"
              test-id="shop-gallery"
            />

            <div
              v-if="shop.scheduleNote"
              class="shop-schedule-note"
              data-testid="shop-schedule-note"
            >
              {{ shop.scheduleNote }}
            </div>
          </div>
        </section>

        <section
          class="shop-content-card"
          data-testid="shop-text-section"
        >
          <h1
            v-if="shop.slogan"
            class="shop-slogan"
            data-testid="shop-slogan"
          >
            {{ shop.slogan }}
          </h1>
          <p
            class="shop-description"
            data-testid="shop-description"
          >
            {{ shop.description }}
          </p>
        </section>

        <section
          class="shop-content-card"
          data-testid="shop-contacts"
        >
          <h2 class="shop-contacts-title">
            Контакты:
          </h2>
          <p
            v-if="contactsLoadError"
            class="mb-3 mt-0 text-xs text-slate-400"
          >
            Часть контактов сейчас недоступна.
          </p>

          <ul class="shop-contact-list">
            <li v-for="item in contactRows" :key="item.key">
              <div
                v-if="item.kind === 'address'"
                class="shop-contact-address-row"
              >
                <button
                  type="button"
                  class="shop-contact-navi-button ui-transition ui-interactive ui-bounce rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  :aria-describedby="item.addressTextId"
                  data-testid="shop-contact-open-navi"
                  @click="openYandexNavigatorMapSearch(item.addressText)"
                >
                  Открыть в Навигаторе
                </button>
                <a
                  :id="item.addressTextId"
                  class="shop-contact-link"
                  :href="item.mapsHref"
                  target="_blank"
                  rel="noreferrer"
                >{{ item.addressText }}</a>
              </div>
              <a
                v-else-if="item.href"
                class="shop-contact-link"
                :href="item.href"
                :target="item.target"
                rel="noreferrer"
              >
                {{ item.label }}
              </a>
              <span v-else class="shop-contact-text">
                {{ item.label }}
              </span>
            </li>

            <li v-if="hasSiteUrl">
              <a
                class="shop-contact-link"
                :href="siteUrl"
                target="_self"
              >
                {{ siteUrl }}
              </a>
            </li>
          </ul>
        </section>

        <section
          class="shop-content-card"
          data-testid="shop-features"
        >
          <ShopMetaBadges
            :categories="categoryNames"
            :features="featureNames"
          />
        </section>

        <div class="shop-overscroll-spacer" aria-hidden="true" />
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
import { uiConfig } from "../config/ui";
import type { ContactsResponse, Shop } from "../types";
import { apiClient } from "../api/HttpApiClient";
import { ApiError } from "../api/ApiClient";
import { state } from "../state";
import { mapIdsToTitles } from "../utils/mapCodesToNames";
import {
  buildYandexMapsWebUrl,
  openYandexNavigatorMapSearch,
} from "../utils/yandexAddressOpen";
import ErrorStatePanel from "../components/ErrorStatePanel.vue";

const route = useRoute();
const router = useRouter();

const ACCEPTABLE_TYPES = [
  "phone",
  "email",
  "telegram",
  "whatsapp",
  "address",
];

const shopCode = computed(() => String(route.params.code ?? ""));
const shop = ref<Shop | null>(null);
const contacts = ref<ContactsResponse>({});
const isLoading = ref(false);
const loadError = ref(false);
const notFound = ref(false);
const contactsLoadError = ref(false);

const featureMap = computed(
  () => new Map(state.features.map((item) => [item.id, item.title])),
);
const categoryMap = computed(
  () => new Map(state.categories.map((item) => [item.id, item.title])),
);

const featureNames = computed(() =>
  mapIdsToTitles(shop.value?.featureIds ?? [], featureMap.value),
);
const categoryNames = computed(() =>
  mapIdsToTitles(shop.value?.categoryIds ?? [], categoryMap.value),
);

const galleryImages = computed<string[]>(() => {
  const current = shop.value;
  if (!current) return [];
  return Array.isArray(current.galleryImages)
    ? current.galleryImages.filter(Boolean)
    : [];
});

const siteUrl = computed(() =>
  String(shop.value?.siteUrl ?? "").trim(),
);
const hasSiteUrl = computed(() => siteUrl.value.length > 0);

function goToCatalog() {
  router.push({ name: "catalog" });
}

type ContactRow =
  | {
      key: string;
      kind: "address";
      addressText: string;
      addressTextId: string;
      mapsHref: string;
    }
  | {
      key: string;
      kind: "link";
      label: string;
      href: string;
      target: string;
    }
  | {
      key: string;
      kind: "plain";
      label: string;
    };

const contactRows = computed((): ContactRow[] => {
  const rows: ContactRow[] = [];

  for (const type of ACCEPTABLE_TYPES) {
    for (const value of contacts.value[type] ?? []) {
      if (type === "address") {
        const addressText = String(value ?? "");
        if (!addressText.trim()) {
          continue;
        }
        const addressTextId = `shop-address-text-${rows.length}`;
        rows.push({
          key: `address:${rows.length}:${addressText}`,
          kind: "address",
          addressText,
          addressTextId,
          mapsHref: buildYandexMapsWebUrl(addressText),
        });
        continue;
      }

      const href = hrefFor(type, value);
      if (href) {
        rows.push({
          key: `${type}:${value}`,
          kind: "link",
          label: labelFor(type, value),
          href,
          target: href.startsWith("http") ? "_blank" : "_self",
        });
      } else {
        rows.push({
          key: `${type}:${value}`,
          kind: "plain",
          label: labelFor(type, value),
        });
      }
    }
  }

  return rows;
});

function hrefFor(type: string, value: string) {
  if (type === "phone") {
    return `tel:${value.replace(/\s|\(|\)|-/g, "")}`;
  }

  if (type === "email") {
    return `mailto:${value}`;
  }

  if (type === "telegram" || type === "whatsapp") {
    return value;
  }

  return null;
}

function labelFor(type: string, value: string) {
  return value;
}

async function loadShop() {
  isLoading.value = true;
  loadError.value = false;
  notFound.value = false;
  shop.value = null;
  contacts.value = {};
  contactsLoadError.value = false;

  try {
    const loadedShop = await apiClient.getShop(shopCode.value);
    shop.value = loadedShop;

    try {
      contacts.value = await apiClient.postAcceptableContactTypes(
        shopCode.value,
        ACCEPTABLE_TYPES,
      );
    } catch {
      contacts.value = {};
      contactsLoadError.value = true;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound.value = true;
    } else {
      loadError.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

watch(shopCode, () => {
  loadShop();
});

onMounted(() => {
  loadShop();
});
</script>
