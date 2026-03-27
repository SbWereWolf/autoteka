<template>
  <div class="shop-page-root">
    <div class="app-container pt-2 pb-4 3xl:pb-6">
      <div
        v-if="showInitialLoading"
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
        </div>
        <div class="shop-hero-gallery" aria-hidden="true">
          <div class="h-full w-full ui-skeleton" />
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
          @retry="reloadShopPage"
        />
      </div>

      <div v-else-if="showShopScaffold" class="space-y-6">
        <section class="shop-hero-shell">
          <div class="shop-hero-head">
            <template v-if="shop">
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
            </template>

            <template v-else>
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
            </template>
          </div>

        </section>

        <section
          v-if="hasPromotions"
          class="shop-promo-stack"
          data-testid="shop-promo-section"
        >
          <ShopPromotionCard
            v-for="promotion in promotions"
            :key="promotion.code"
            :promotion="promotion"
          />
        </section>

        <div v-if="shop" class="shop-hero-gallery">
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

        <div
          v-else
          class="shop-hero-gallery"
          aria-busy="true"
          aria-live="polite"
        >
          <div class="h-full w-full ui-skeleton" />
        </div>

        <template v-if="shop">
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
        </template>

        <template v-else>
          <section class="shop-content-card space-y-3" aria-hidden="true">
            <div class="ui-skeleton h-8 w-2/3 rounded-full" />
            <div class="ui-skeleton h-4 w-full rounded-full" />
            <div class="ui-skeleton h-4 w-[85%] rounded-full" />
          </section>

          <section class="shop-content-card space-y-3" aria-hidden="true">
            <div class="ui-skeleton h-6 w-32 rounded-full" />
            <div class="ui-skeleton h-4 w-full rounded-full" />
            <div class="ui-skeleton h-4 w-[75%] rounded-full" />
          </section>

          <section class="shop-content-card space-y-3" aria-hidden="true">
            <div class="ui-skeleton h-6 w-40 rounded-full" />
            <div class="ui-skeleton h-4 w-full rounded-full" />
          </section>
        </template>
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import OverscrollOpenLink from "../components/OverscrollOpenLink.vue";
import ShopMetaBadges from "../components/ShopMetaBadges.vue";
import ShopPromotionCard from "../components/ShopPromotionCard.vue";
import { uiConfig } from "../config/ui";
import { state } from "../state";
import { mapIdsToTitles } from "../utils/mapCodesToNames";
import { openYandexNavigatorMapSearch } from "../utils/yandexAddressOpen";
import ErrorStatePanel from "../components/ErrorStatePanel.vue";
import { useShopContactRows } from "../composables/useShopContactRows";
import { useShopPageLoader } from "../composables/useShopPageLoader";

const route = useRoute();
const router = useRouter();

const shopCode = computed(() => String(route.params.code ?? ""));
const {
  shop,
  promotions,
  contacts,
  isLoading,
  loadError,
  notFound,
  contactsLoadError,
  loadShopPage,
} = useShopPageLoader({
  shopCode,
});

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

const hasPromotions = computed(() => promotions.value.length > 0);
const showInitialLoading = computed(
  () =>
    isLoading.value &&
    !hasPromotions.value &&
    shop.value === null,
);
const showShopScaffold = computed(
  () =>
    !showInitialLoading.value &&
    !notFound.value &&
    !loadError.value,
);
const siteUrl = computed(() =>
  String(shop.value?.siteUrl ?? "").trim(),
);
const hasSiteUrl = computed(() => siteUrl.value.length > 0);

function goToCatalog() {
  router.push({ name: "catalog" });
}

function reloadShopPage() {
  void loadShopPage();
}

const { contactRows } = useShopContactRows(contacts);
</script>
