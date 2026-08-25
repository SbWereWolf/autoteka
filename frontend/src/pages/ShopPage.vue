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

              <hr class="shop-info-hr" />

              <section
                v-if="shop.scheduleNote"
                class="shop-info-block"
                data-testid="shop-schedule"
              >
                <h2 class="shop-info-label">Время работы</h2>
                <div class="shop-schedule-row">
                  <svg
                    class="shop-schedule-clock"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 5C11.4477 5 11 5.44772 11 6V12C11 12.3788 11.214 12.7251 11.5527 12.8945L15.5527 14.8945C16.0467 15.1415 16.6475 14.9412 16.8945 14.4473C17.1415 13.9533 16.9412 13.3525 16.4473 13.1055L13 11.3818V6C13 5.44772 12.5523 5 12 5Z"
                    />
                  </svg>
                  <span class="shop-schedule-text">{{
                    shop.scheduleNote
                  }}</span>
                </div>
              </section>

              <section
                v-if="mobileContactRows.length || contactsLoadError"
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
                <ul class="shop-contact-rows">
                  <li v-for="row in mobileContactRows" :key="row.key">
                    <span
                      class="shop-contact-row"
                      :data-testid="`shop-contact-${row.kind}`"
                    >
                      <svg
                        class="shop-contact-row-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path :d="contactIconPath(row.kind)" />
                      </svg>
                      <span class="shop-contact-row-text">{{
                        row.text
                      }}</span>
                    </span>
                  </li>
                </ul>
              </section>

              <div class="shop-ds-actions">
                <ShopContactActions
                  variant="panel"
                  :primary="primaryContactActions"
                  :site-url="siteUrl"
                  :has-site-url="hasSiteUrl"
                  @route="openYandexNavigatorMapSearch"
                  @share="shareShop"
                />
              </div>
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
              <div
                class="shop-gallery-scrim-bottom"
                aria-hidden="true"
              />
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
              <button
                class="shop-share-button"
                aria-label="Поделиться"
                type="button"
                @click="shareShop"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M3 20V12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12V20C5 20.2652 5.10543 20.5195 5.29297 20.707C5.48051 20.8946 5.73478 21 6 21H18C18.2652 21 18.5195 20.8946 18.707 20.707C18.8946 20.5195 19 20.2652 19 20V12C19 11.4477 19.4477 11 20 11C20.5523 11 21 11.4477 21 12V20C21 20.7957 20.6837 21.5585 20.1211 22.1211C19.5585 22.6837 18.7957 23 18 23H6C5.20435 23 4.44152 22.6837 3.87891 22.1211C3.3163 21.5585 3 20.7957 3 20ZM11 15V4.41407L8.70703 6.70704C8.31651 7.09757 7.68349 7.09757 7.29297 6.70704C6.90244 6.31652 6.90244 5.6835 7.29297 5.29298L11.293 1.29298L11.3691 1.22462C11.7619 0.904269 12.3409 0.926863 12.707 1.29298L16.707 5.29298C17.0976 5.6835 17.0976 6.31652 16.707 6.70704C16.3165 7.09757 15.6835 7.09757 15.293 6.70704L13 4.41407V15C13 15.5523 12.5523 16 12 16C11.4477 16 11 15.5523 11 15Z"
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
                    v-if="showSlogan"
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
                v-if="mobileContactRows.length || contactsLoadError"
                class="shop-content-card"
                data-testid="shop-contacts"
              >
                <h2 class="shop-section-label">Контакты</h2>
                <p
                  v-if="contactsLoadError"
                  class="mb-3 mt-0 text-xs text-secondary-text"
                >
                  Часть контактов сейчас недоступна.
                </p>

                <ul class="shop-contact-rows">
                  <li v-for="row in mobileContactRows" :key="row.key">
                    <span
                      class="shop-contact-row"
                      :data-testid="`shop-contact-${row.kind}`"
                    >
                      <svg
                        class="shop-contact-row-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path :d="contactIconPath(row.kind)" />
                      </svg>
                      <span class="shop-contact-row-text">{{
                        row.text
                      }}</span>
                    </span>
                  </li>
                </ul>
              </section>

              <section
                v-if="shop.scheduleNote"
                class="shop-content-card"
                data-testid="shop-schedule-note"
              >
                <h2 class="shop-section-label">Время работы</h2>
                <div class="shop-schedule-row">
                  <svg
                    class="shop-schedule-clock"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 5C11.4477 5 11 5.44772 11 6V12C11 12.3788 11.214 12.7251 11.5527 12.8945L15.5527 14.8945C16.0467 15.1415 16.6475 14.9412 16.8945 14.4473C17.1415 13.9533 16.9412 13.3525 16.4473 13.1055L13 11.3818V6C13 5.44772 12.5523 5 12 5Z"
                    />
                  </svg>
                  <span class="shop-schedule-text">{{
                    shop.scheduleNote
                  }}</span>
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

          <div
            v-if="shop"
            class="shop-actionbar-spacer"
            aria-hidden="true"
          />

          <footer
            v-if="shop"
            class="shop-actionbar"
            role="group"
            aria-label="Связаться с магазином"
          >
            <ShopContactActions
              variant="bar"
              :primary="primaryContactActions"
              :site-url="siteUrl"
              :has-site-url="hasSiteUrl"
              @route="openYandexNavigatorMapSearch"
              @share="shareShop"
            />
          </footer>
        </div>
      </template>
    </div>
    <OverscrollOpenLink
      v-if="shop && hasSiteUrl"
      :url="siteUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import OverscrollOpenLink from "../components/OverscrollOpenLink.vue";
import ShopPromotionCard from "../components/ShopPromotionCard.vue";
import ShopContactActions from "../components/ShopContactActions.vue";
import { state } from "../state";
import type { GalleryItem } from "../types";
import { mapIdsToTitles } from "../utils/mapCodesToNames";
import { openYandexNavigatorMapSearch } from "../utils/yandexAddressOpen";
import CatalogState from "../components/CatalogState.vue";
import { useShopContactRows } from "../composables/useShopContactRows";
import { useShopPageLoader } from "../composables/useShopPageLoader";
import { useIsDesktop } from "../composables/useIsDesktop";
import { useShareLink } from "../composables/useShareLink";

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

// Слоган скрываем, если он дублирует название магазина.
const showSlogan = computed(() => {
  const slogan = (shop.value?.slogan ?? "").trim();
  const title = (shop.value?.title ?? "").trim();
  return (
    slogan.length > 0 &&
    slogan.toLowerCase() !== title.toLowerCase()
  );
});

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

const { primaryContactActions, mobileContactRows } =
  useShopContactRows(contacts);

const CONTACT_ICON_PATHS: Record<string, string> = {
  phone:
    "M21.9999 16.92V19.92C22.0011 20.1985 21.944 20.4741 21.8324 20.7293C21.7209 20.9845 21.5572 21.2136 21.352 21.4018C21.1468 21.5901 20.9045 21.7335 20.6407 21.8227C20.3769 21.9119 20.0973 21.945 19.8199 21.92C16.7428 21.5856 13.7869 20.5341 11.1899 18.85C8.77376 17.3146 6.72527 15.2661 5.18993 12.85C3.49991 10.2412 2.44818 7.27097 2.11993 4.17997C2.09494 3.90344 2.12781 3.62474 2.21643 3.3616C2.30506 3.09846 2.4475 2.85666 2.6347 2.6516C2.82189 2.44653 3.04974 2.28268 3.30372 2.1705C3.55771 2.05831 3.83227 2.00024 4.10993 1.99997H7.10993C7.59524 1.9952 8.06572 2.16705 8.43369 2.48351C8.80166 2.79996 9.04201 3.23942 9.10993 3.71997C9.23656 4.68004 9.47138 5.6227 9.80993 6.52997C9.94448 6.8879 9.9736 7.27689 9.89384 7.65086C9.81408 8.02482 9.6288 8.36809 9.35993 8.63998L8.08993 9.90997C9.51349 12.4135 11.5864 14.4864 14.0899 15.91L15.3599 14.64C15.6318 14.3711 15.9751 14.1858 16.3491 14.1061C16.723 14.0263 17.112 14.0554 17.4699 14.19C18.3772 14.5285 19.3199 14.7634 20.2799 14.89C20.7657 14.9585 21.2093 15.2032 21.5265 15.5775C21.8436 15.9518 22.0121 16.4296 21.9999 16.92Z",
  address:
    "M12 1C14.3869 1 16.6764 1.94791 18.3643 3.63574C20.0521 5.32357 21 7.61305 21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94791 5.32357 5.63574 3.63574C7.32357 1.94791 9.61305 1 12 1ZM12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7Z",
  // Канон-глиф mail из Claude Design (сплошной конверт с вырубленным
  // флэпом, один path, корректен при nonzero); синк MailIcon в
  // shared.jsx — в батче.
  email:
    "M20 4C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20ZM19.0693 8.05176C18.7527 7.59937 18.1292 7.48912 17.6768 7.80566L12 11.7793L6.32324 7.80566C5.87081 7.48912 5.24733 7.59937 4.93066 8.05176C4.61412 8.50419 4.72437 9.12767 5.17676 9.44434L11.4268 13.8193C11.771 14.0602 12.229 14.0602 12.5732 13.8193L18.8232 9.44434C19.2756 9.12767 19.3859 8.50419 19.0693 8.05176Z",
};

function contactIconPath(kind: string): string {
  return CONTACT_ICON_PATHS[kind] ?? "";
}

const { share } = useShareLink();

function shareShop() {
  const current = shop.value;
  if (!current) {
    return;
  }
  void share({
    title: current.title,
    url: window.location.href,
  });
}
</script>
