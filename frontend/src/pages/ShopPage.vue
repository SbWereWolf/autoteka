<template>
  <div class="shop-page-root">
    <div
      :class="
        isDesktop
          ? 'shop-desktop-shell'
          : 'app-container pt-2 pb-4 3xl:pb-6'
      "
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

        <div
          v-else
          class="space-y-4"
          aria-busy="true"
          aria-live="polite"
        >
          <div class="shop-hero-shell">
            <div class="shop-hero-head">
              <div
                class="shop-loading-back-skeleton catalog-skel"
                data-testid="shop-loading-back-skeleton"
              />
              <div class="shop-loading-logo-skeleton-shell">
                <div
                  class="shop-loading-logo-skeleton catalog-skel"
                  data-testid="shop-loading-logo-skeleton"
                />
              </div>
            </div>
          </div>
          <div class="shop-hero-gallery" aria-hidden="true">
            <div class="h-full w-full catalog-skel" />
          </div>
          <div class="space-y-3">
            <div class="catalog-skel h-6 w-48 rounded-full" />
            <div class="catalog-skel h-4 w-full rounded-full" />
            <div class="catalog-skel h-4 w-[80%] rounded-full" />
          </div>
        </div>
      </template>

      <div
        v-else-if="notFound"
        :class="isDesktop ? 'shop-desktop-state' : 'mt-8'"
      >
        <CatalogState
          icon="globe"
          title="Магазин не найден"
          text="Возможно, ссылка устарела или код магазина неверный."
        />
      </div>

      <div
        v-else-if="loadError"
        :class="isDesktop ? 'shop-desktop-state' : 'mt-8'"
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

        <div v-else class="space-y-6">
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
                  class="shop-loading-back-skeleton catalog-skel"
                  data-testid="shop-loading-back-skeleton"
                />
                <div class="shop-loading-logo-skeleton-shell">
                  <div
                    class="shop-loading-logo-skeleton catalog-skel"
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
              :items="galleryItems"
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
            <div class="h-full w-full catalog-skel" />
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
              <div class="catalog-skel h-8 w-2/3 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
              <div class="catalog-skel h-4 w-[85%] rounded-full" />
            </section>

            <section class="shop-content-card space-y-3" aria-hidden="true">
              <div class="catalog-skel h-6 w-32 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
              <div class="catalog-skel h-4 w-[75%] rounded-full" />
            </section>

            <section class="shop-content-card space-y-3" aria-hidden="true">
              <div class="catalog-skel h-6 w-40 rounded-full" />
              <div class="catalog-skel h-4 w-full rounded-full" />
            </section>
          </template>
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
