import { ref, toValue, type MaybeRefOrGetter } from "vue";
import { apiClient } from "../api/HttpApiClient";
import { FEATURE } from "../constants/features";
import type { Shop } from "../types";

export type CatalogOffer = {
  shopCode: string;
  label: string;
};

// Источник шита «Акции»: при первом открытии — параллельные
// GET /shop/{code}/promotion для магазинов текущей выдачи с feature «Акции».
// Упавшие запросы молча пропускаем. Кэш на время жизни страницы.
export function useCatalogOffers(shops: MaybeRefOrGetter<Shop[]>) {
  const offers = ref<CatalogOffer[]>([]);
  const isLoading = ref(false);
  let loaded = false;

  async function loadOffers() {
    if (loaded) {
      return;
    }
    loaded = true;
    isLoading.value = true;

    const promoShops = toValue(shops).filter((shop) =>
      shop.featureIds.includes(String(FEATURE.PROMO)),
    );

    const results = await Promise.allSettled(
      promoShops.map((shop) => apiClient.getShopPromotions(shop.code)),
    );

    const collected: CatalogOffer[] = [];
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        return;
      }
      for (const promotion of result.value) {
        collected.push({
          shopCode: promoShops[index].code,
          label: promotion.title,
        });
      }
    });

    offers.value = collected;
    isLoading.value = false;
  }

  return { offers, isLoading, loadOffers };
}
