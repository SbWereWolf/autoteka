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
                v-if="mobileContactRows.length || contactsLoadError"
                class="shop-content-card"
                data-testid="shop-contacts"
              >
                <h2 class="shop-section-label">Контакты</h2>
                <p
                  v-if="contactsLoadError"
                  class="mb-3 mt-0 text-xs text-slate-400"
                >
                  Часть контактов сейчас недоступна.
                </p>

                <ul class="shop-contact-rows">
                  <li v-for="row in mobileContactRows" :key="row.key">
                    <a
                      class="shop-contact-row"
                      :href="row.href"
                      :target="row.external ? '_blank' : undefined"
                      :rel="row.external ? 'noreferrer' : undefined"
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
                    </a>
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
                  <span
                    class="shop-schedule-dot"
                    aria-hidden="true"
                  />
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
            <button
              v-if="primaryContactActions.addressText"
              type="button"
              class="shop-actionbar-route"
              data-testid="shop-actionbar-route"
              @click="
                openYandexNavigatorMapSearch(
                  primaryContactActions.addressText,
                )
              "
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
                  d="M20.5723 2.09671C20.9542 1.91588 21.4082 1.9942 21.707 2.293C22.0058 2.5918 22.0842 3.04586 21.9033 3.42777L12.9033 22.4278C12.7225 22.8095 12.3217 23.0368 11.9014 22.9952C11.4811 22.9535 11.1327 22.652 11.0303 22.2422L9.17578 14.8243L1.75782 12.9698C1.34808 12.8673 1.04654 12.5189 1.00489 12.0987C0.963266 11.6783 1.19055 11.2775 1.57227 11.0967L20.5723 2.09671Z"
                />
              </svg>
              <span>Маршрут</span>
            </button>

            <div class="shop-actionbar-icons">
              <a
                v-if="primaryContactActions.phoneHref"
                class="shop-actionbar-icon"
                :href="primaryContactActions.phoneHref"
                aria-label="Позвонить"
                data-testid="shop-actionbar-phone"
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
                    d="M21.9999 16.92V19.92C22.0011 20.1985 21.944 20.4741 21.8324 20.7293C21.7209 20.9845 21.5572 21.2136 21.352 21.4018C21.1468 21.5901 20.9045 21.7335 20.6407 21.8227C20.3769 21.9119 20.0973 21.945 19.8199 21.92C16.7428 21.5856 13.7869 20.5341 11.1899 18.85C8.77376 17.3146 6.72527 15.2661 5.18993 12.85C3.49991 10.2412 2.44818 7.27097 2.11993 4.17997C2.09494 3.90344 2.12781 3.62474 2.21643 3.3616C2.30506 3.09846 2.4475 2.85666 2.6347 2.6516C2.82189 2.44653 3.04974 2.28268 3.30372 2.1705C3.55771 2.05831 3.83227 2.00024 4.10993 1.99997H7.10993C7.59524 1.9952 8.06572 2.16705 8.43369 2.48351C8.80166 2.79996 9.04201 3.23942 9.10993 3.71997C9.23656 4.68004 9.47138 5.6227 9.80993 6.52997C9.94448 6.8879 9.9736 7.27689 9.89384 7.65086C9.81408 8.02482 9.6288 8.36809 9.35993 8.63998L8.08993 9.90997C9.51349 12.4135 11.5864 14.4864 14.0899 15.91L15.3599 14.64C15.6318 14.3711 15.9751 14.1858 16.3491 14.1061C16.723 14.0263 17.112 14.0554 17.4699 14.19C18.3772 14.5285 19.3199 14.7634 20.2799 14.89C20.7657 14.9585 21.2093 15.2032 21.5265 15.5775C21.8436 15.9518 22.0121 16.4296 21.9999 16.92Z"
                  />
                </svg>
              </a>
              <a
                v-if="primaryContactActions.telegramHref"
                class="shop-actionbar-icon"
                :href="primaryContactActions.telegramHref"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                data-testid="shop-actionbar-telegram"
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
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12 2C17.5228 2 21.9999 6.47721 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2.00007 6.47721 6.47719 2 12 2ZM16.0801 8C15.7054 8.00833 15.1223 8.20787 12.3496 9.36523C11.3754 9.77322 9.43555 10.6143 6.52148 11.8799C6.0556 12.0712 5.80561 12.2545 5.78027 12.4375C5.73865 12.7871 6.23799 12.8959 6.8623 13.0957C7.37854 13.2622 8.06189 13.4536 8.41992 13.4619C8.74456 13.4702 9.10243 13.3371 9.50195 13.0625C12.2197 11.2257 13.6186 10.2934 13.7148 10.2734C13.7815 10.2568 13.8655 10.2401 13.9238 10.29C13.9818 10.3401 13.9819 10.4399 13.9736 10.4648C13.9223 10.6741 11.3682 13.0039 11.2178 13.1543C10.6516 13.7371 10.0102 14.0947 11.001 14.7441C11.8586 15.3103 12.3498 15.6686 13.2324 16.2432C13.7903 16.6095 14.2316 17.0421 14.8145 16.9922C15.0808 16.9672 15.3555 16.7177 15.4971 15.9688C15.8301 14.2036 16.48 10.3642 16.6299 8.78223C16.6464 8.64924 16.6299 8.47489 16.6133 8.3916C16.5966 8.30834 16.5716 8.19947 16.4717 8.11621C16.3468 8.01632 16.1634 8.00001 16.0801 8Z"
                  />
                </svg>
              </a>
              <a
                v-if="primaryContactActions.whatsappHref"
                class="shop-actionbar-icon"
                :href="primaryContactActions.whatsappHref"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                data-testid="shop-actionbar-whatsapp"
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
                    d="M12.042 2C14.7057 2.0012 17.2057 3.03313 19.0859 4.90625C20.9659 6.77941 22.0009 9.26968 22 11.918C21.9975 17.3818 17.5299 21.828 12.042 21.8281H12.0371C10.3709 21.8274 8.7336 21.4115 7.2793 20.6221L2 22L3.41309 16.8643C2.54172 15.3615 2.08244 13.6566 2.08301 11.9102C2.0853 6.44583 6.55277 2 12.042 2ZM8.5166 7.33301C8.35063 7.33301 8.08048 7.3947 7.85254 7.64258C7.62426 7.89056 6.98254 8.48986 6.98242 9.70801C6.98242 10.9268 7.87381 12.1051 7.99805 12.2705C8.12385 12.4379 9.7205 15.0164 12.248 16.0088C14.35 16.8339 14.7782 16.6703 15.2344 16.6289C15.6907 16.5875 16.7058 16.0295 16.9131 15.4512C17.1205 14.8728 17.1208 14.377 17.0586 14.2734C16.9963 14.1704 16.8306 14.108 16.582 13.9844C16.3332 13.8605 15.1103 13.2616 14.8818 13.1787C14.6537 13.0962 14.4873 13.0548 14.3213 13.3027C14.1555 13.5503 13.6797 14.1079 13.5342 14.2734C13.3891 14.4389 13.2438 14.4597 12.9951 14.3359C12.7462 14.2116 11.9448 13.9502 10.9941 13.1064C10.2546 12.45 9.75473 11.6398 9.60938 11.3916C9.46426 11.1439 9.59399 11.0092 9.71875 10.8857C9.83048 10.7748 9.9674 10.5967 10.0918 10.4521C10.2159 10.3075 10.2579 10.2043 10.3408 10.0391C10.4238 9.87393 10.3824 9.72928 10.3203 9.60547C10.258 9.48157 9.77399 8.25642 9.55273 7.7666C9.36631 7.3541 9.17047 7.34613 8.99316 7.33887C8.84813 7.33273 8.68228 7.33301 8.5166 7.33301Z"
                  />
                </svg>
              </a>
              <a
                v-if="hasSiteUrl"
                class="shop-actionbar-icon"
                :href="siteUrl"
                aria-label="Сайт магазина"
                data-testid="shop-actionbar-site"
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
                    d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12ZM23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12Z"
                  />
                  <path
                    d="M22 11C22.5523 11 23 11.4477 23 12C23 12.5523 22.5523 13 22 13H2C1.44772 13 1 12.5523 1 12C1 11.4477 1.44772 11 2 11H22Z"
                  />
                  <path
                    d="M12 1C12.2808 1 12.5488 1.11793 12.7383 1.3252C15.403 4.24253 16.9177 8.02918 17 11.9795C17.0003 11.9932 17.0003 12.0068 17 12.0205C16.9177 15.9708 15.403 19.7575 12.7383 22.6748C12.5488 22.8821 12.2808 23 12 23C11.7192 23 11.4512 22.8821 11.2617 22.6748C8.59696 19.7575 7.0823 15.9708 7 12.0205C6.99972 12.0068 6.99972 11.9932 7 11.9795C7.0823 8.02918 8.59696 4.24253 11.2617 1.3252L11.3359 1.25195C11.518 1.09031 11.7541 1 12 1ZM12 3.55469C10.1274 5.96829 9.06851 8.92619 9 12C9.06851 15.0736 10.1277 18.0308 12 20.4443C13.8723 18.0308 14.9305 15.0735 14.999 12C14.9305 8.9262 13.8726 5.96829 12 3.55469Z"
                  />
                </svg>
              </a>
              <button
                type="button"
                class="shop-actionbar-icon"
                aria-label="Поделиться"
                data-testid="shop-actionbar-share"
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
            </div>
          </footer>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import ShopMetaBadges from "../components/ShopMetaBadges.vue";
import ShopPromotionCard from "../components/ShopPromotionCard.vue";
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

const { contactRows, primaryContactActions, mobileContactRows } =
  useShopContactRows(contacts);

const CONTACT_ICON_PATHS: Record<string, string> = {
  phone:
    "M21.9999 16.92V19.92C22.0011 20.1985 21.944 20.4741 21.8324 20.7293C21.7209 20.9845 21.5572 21.2136 21.352 21.4018C21.1468 21.5901 20.9045 21.7335 20.6407 21.8227C20.3769 21.9119 20.0973 21.945 19.8199 21.92C16.7428 21.5856 13.7869 20.5341 11.1899 18.85C8.77376 17.3146 6.72527 15.2661 5.18993 12.85C3.49991 10.2412 2.44818 7.27097 2.11993 4.17997C2.09494 3.90344 2.12781 3.62474 2.21643 3.3616C2.30506 3.09846 2.4475 2.85666 2.6347 2.6516C2.82189 2.44653 3.04974 2.28268 3.30372 2.1705C3.55771 2.05831 3.83227 2.00024 4.10993 1.99997H7.10993C7.59524 1.9952 8.06572 2.16705 8.43369 2.48351C8.80166 2.79996 9.04201 3.23942 9.10993 3.71997C9.23656 4.68004 9.47138 5.6227 9.80993 6.52997C9.94448 6.8879 9.9736 7.27689 9.89384 7.65086C9.81408 8.02482 9.6288 8.36809 9.35993 8.63998L8.08993 9.90997C9.51349 12.4135 11.5864 14.4864 14.0899 15.91L15.3599 14.64C15.6318 14.3711 15.9751 14.1858 16.3491 14.1061C16.723 14.0263 17.112 14.0554 17.4699 14.19C18.3772 14.5285 19.3199 14.7634 20.2799 14.89C20.7657 14.9585 21.2093 15.2032 21.5265 15.5775C21.8436 15.9518 22.0121 16.4296 21.9999 16.92Z",
  address:
    "M12 1C14.3869 1 16.6764 1.94791 18.3643 3.63574C20.0521 5.32357 21 7.61305 21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94791 5.32357 5.63574 3.63574C7.32357 1.94791 9.61305 1 12 1ZM12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7Z",
  // В каноне нет mail-глифа (контакт-секция канона = только phone + map-pin);
  // конверт того же визуального веса для decision-mandated email-строки.
  email:
    "M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z",
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
