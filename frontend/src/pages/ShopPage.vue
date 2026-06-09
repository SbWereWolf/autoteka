<template>
  <div class="shop-page-root">
    <div
      :class="isDesktop ? 'shop-desktop-shell' : 'shop-mobile-shell'"
    >
      <template v-if="showInitialLoading">
        <div
          v-if="isDesktop"
          class="shop-layout shop-layout--skeleton"
          aria-busy="true"
          aria-live="polite"
          data-testid="shop-desktop-skeleton"
        >
          <div class="shop-layout-left">
            <div class="shop-desktop-gallery-skel catalog-skel" />
            <div class="space-y-3">
              <div class="catalog-skel h-4 w-32 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
              <div class="catalog-skel h-4 w-[80%] rounded-full" />
            </div>
            <div class="space-y-3">
              <div class="catalog-skel h-4 w-24 rounded-full" />
              <div class="catalog-skel h-20 w-full rounded-2xl" />
            </div>
          </div>
          <aside class="shop-layout-right">
            <div class="shop-info-card" aria-hidden="true">
              <div class="catalog-skel h-7 w-48 rounded-full" />
              <div class="catalog-skel h-4 w-40 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
              <div class="catalog-skel h-4 w-[85%] rounded-full" />
              <div class="catalog-skel h-12 w-full rounded-2xl" />
            </div>
          </aside>
        </div>

        <div v-else aria-busy="true" aria-live="polite">
          <div class="shop-hero">
            <div class="h-full w-full catalog-skel" aria-hidden="true" />
            <div
              class="shop-loading-back-skeleton catalog-skel"
              data-testid="shop-loading-back-skeleton"
            />
          </div>
          <div class="shop-sheet">
            <div class="space-y-3">
              <div class="catalog-skel h-6 w-48 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
              <div class="catalog-skel h-4 w-[80%] rounded-full" />
            </div>
          </div>
        </div>
      </template>

      <div
        v-else-if="notFound"
        :class="isDesktop ? 'shop-desktop-state' : 'mt-8 px-4'"
      >
        <CatalogState
          icon="globe"
          title="Магазин не найден"
          text="Возможно, ссылка устарела или код магазина неверный."
        />
      </div>

      <div
        v-else-if="loadError"
        :class="isDesktop ? 'shop-desktop-state' : 'mt-8 px-4'"
      >
        <CatalogState
          icon="globe"
          title="Не удалось загрузить магазин"
          text="Что-то пошло не так. Попробуйте ещё раз."
        >
          <button
            type="button"
            class="catalog-state-cta"
            data-testid="shop-load-error-retry"
            @click="reloadShopPage"
          >
            Повторить
          </button>
        </CatalogState>
      </div>

      <template v-else-if="showShopScaffold">
        <div
          v-if="isDesktop && shop"
          class="shop-layout"
          data-testid="shop-desktop-layout"
        >
          <nav
            class="shop-breadcrumb"
            aria-label="Хлебные крошки"
            data-testid="shop-breadcrumb"
          >
            <RouterLink
              class="shop-breadcrumb-link"
              :to="{ name: 'catalog' }"
            >
              Каталог
            </RouterLink>
            <span
              class="shop-breadcrumb-sep"
              aria-hidden="true"
            >→</span>
            <span
              class="shop-breadcrumb-current"
              aria-current="page"
            >{{ shop.title }}</span>
          </nav>

          <div class="shop-layout-left">
            <GalleryCarousel
              :items="galleryItems"
              empty-title=""
              empty-text="Для этого магазина изображения ещё не загружены"
              test-id="shop-gallery"
            />

            <section
              v-if="shop.description"
              class="shop-info-block"
              data-testid="shop-text-section"
            >
              <h2 class="shop-info-label">О магазине</h2>
              <p
                class="shop-info-desc"
                data-testid="shop-description"
              >
                {{ shop.description }}
              </p>
            </section>

            <section
              v-if="hasPromotions"
              class="shop-info-block"
              data-testid="shop-promo-section"
            >
              <h2 class="shop-info-label">Акции</h2>
              <div class="shop-promo-stack">
                <ShopPromotionCard
                  v-for="promotion in promotions"
                  :key="promotion.code"
                  :promotion="promotion"
                />
              </div>
            </section>
          </div>

          <aside
            class="shop-layout-right"
            data-testid="shop-info-aside"
          >
            <div class="shop-info-card">
              <h1
                class="shop-info-name"
                data-testid="shop-info-name"
              >
                {{ shop.title }}
              </h1>

              <ShopMetaBadges
                v-if="featureNames.length || categoryNames.length"
                :categories="categoryNames"
                :features="featureNames"
              />

              <section
                v-if="shop.scheduleNote"
                class="shop-info-block"
                data-testid="shop-schedule"
              >
                <h2 class="shop-info-label">Время работы</h2>
                <p class="shop-info-line">
                  {{ shop.scheduleNote }}
                </p>
              </section>

              <section
                class="shop-info-block"
                data-testid="shop-contacts"
              >
                <h2 class="shop-info-label">Контакты</h2>
                <p
                  v-if="contactsLoadError"
                  class="shop-info-line shop-info-line--muted"
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
            </div>
          </aside>
        </div>

        <div v-else>
          <div class="shop-hero">
            <template v-if="shop">
              <GalleryCarousel
                :items="galleryItems"
                empty-title=""
                empty-text="Для этого магазина изображения ещё не загружены"
                test-id="shop-gallery"
              />
              <div class="shop-hero-scrim" aria-hidden="true" />
              <button
                class="shop-back-button"
                aria-label="Назад"
                type="button"
                @click="goToCatalog"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M11.2929 4.29302C11.6834 3.90249 12.3164 3.90249 12.707 4.29302C13.0975 4.68354 13.0975 5.31655 12.707 5.70708L7.41399 11H18.9999C19.5522 11 19.9999 11.4478 19.9999 12C19.9999 12.5523 19.5522 13 18.9999 13H7.41399L12.707 18.293C13.0975 18.6835 13.0975 19.3166 12.707 19.7071C12.3164 20.0976 11.6834 20.0976 11.2929 19.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6835 4.29289 11.293L11.2929 4.29302Z"
                  />
                </svg>
              </button>
            </template>

            <template v-else>
              <div
                class="h-full w-full catalog-skel"
                aria-hidden="true"
              />
              <div
                class="shop-loading-back-skeleton catalog-skel"
                data-testid="shop-loading-back-skeleton"
              />
            </template>
          </div>

          <div class="shop-sheet">
            <template v-if="shop">
              <section
                class="shop-content-card"
                data-testid="shop-text-section"
              >
                <div class="flex flex-col gap-3">
                  <h1 class="shop-name" data-testid="shop-name">
                    {{ shop.title }}
                  </h1>

                  <ul
                    v-if="shopBadges.length"
                    class="shop-meta-list"
                    aria-label="Категории и особенности магазина"
                    data-testid="shop-features"
                  >
                    <li
                      v-for="badge in shopBadges"
                      :key="badge"
                      class="shop-meta-item"
                    >
                      {{ badge }}
                    </li>
                  </ul>

                  <p
                    v-if="shop.slogan"
                    class="shop-body-line"
                    data-testid="shop-slogan"
                  >
                    {{ shop.slogan }}
                  </p>
                  <p
                    class="shop-body-line"
                    data-testid="shop-description"
                  >
                    {{ shop.description }}
                  </p>
                </div>
              </section>

              <section
                class="shop-content-card"
                data-testid="shop-contacts"
              >
                <h2 class="shop-contacts-title">Контакты:</h2>
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
                v-if="shop.scheduleNote"
                class="shop-content-card"
                data-testid="shop-schedule-note"
              >
                <div class="shop-schedule-row">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 5C11.4477 5 11 5.44772 11 6V12C11 12.3788 11.214 12.7251 11.5527 12.8945L15.5527 14.8945C16.0467 15.1415 16.6475 14.9412 16.8945 14.4473C17.1415 13.9533 16.9412 13.3525 16.4473 13.1055L13 11.3818V6C13 5.44772 12.5523 5 12 5Z"
                    />
                  </svg>
                  <span>{{ shop.scheduleNote }}</span>
                </div>
              </section>
            </template>

            <template v-else>
              <div class="space-y-3" aria-hidden="true">
                <div class="catalog-skel h-8 w-2/3 rounded-full" />
                <div class="catalog-skel h-4 w-full rounded-full" />
                <div class="catalog-skel h-4 w-[85%] rounded-full" />
              </div>
              <div class="space-y-3" aria-hidden="true">
                <div class="catalog-skel h-6 w-32 rounded-full" />
                <div class="catalog-skel h-4 w-full rounded-full" />
                <div class="catalog-skel h-4 w-[75%] rounded-full" />
              </div>
            </template>
          </div>

          <div v-if="hasPromotions" class="px-4">
            <section
              class="shop-promo-stack"
              data-testid="shop-promo-section"
            >
              <ShopPromotionCard
                v-for="promotion in promotions"
                :key="promotion.code"
                :promotion="promotion"
              />
            </section>
          </div>

          <div class="shop-overscroll-spacer" aria-hidden="true" />
        </div>
      </template>
    </div>

    <OverscrollOpenLink
      v-if="!isDesktop && shop && hasSiteUrl"
      :url="siteUrl"
      :threshold-px="uiConfig.overscroll.thresholdPx"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import OverscrollOpenLink from "../components/OverscrollOpenLink.vue";
import ShopMetaBadges from "../components/ShopMetaBadges.vue";
import ShopPromotionCard from "../components/ShopPromotionCard.vue";
import { uiConfig } from "../config/ui";
import { state } from "../state";
import type { GalleryItem } from "../types";
import { mapIdsToTitles } from "../utils/mapCodesToNames";
import { openYandexNavigatorMapSearch } from "../utils/yandexAddressOpen";
import CatalogState from "../components/CatalogState.vue";
import { useShopContactRows } from "../composables/useShopContactRows";
import { useShopPageLoader } from "../composables/useShopPageLoader";
import { useIsDesktop } from "../composables/useIsDesktop";

const route = useRoute();
const router = useRouter();
const { isDesktop } = useIsDesktop();

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
const shopBadges = computed(() => [
  ...categoryNames.value,
  ...featureNames.value,
]);

const galleryItems = computed<GalleryItem[]>(() => {
  const current = shop.value;
  if (!current) return [];
  return Array.isArray(current.galleryItems)
    ? current.galleryItems.filter((item) => item.src.trim() !== "")
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
