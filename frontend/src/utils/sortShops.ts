import type { Shop } from "../types";
import type { SortMode } from "../state";

export function sortShopsByRules(params: {
  shops: Shop[];
  selectedCategoryIds: string[];
  sortMode: SortMode;
}): Shop[] {
  const { shops, selectedCategoryIds, sortMode } = params;

  const hasAnySelectedCategory = (shop: Shop) => {
    if (selectedCategoryIds.length === 0) return false;
    return shop.categoryIds.some((id) =>
      selectedCategoryIds.includes(id),
    );
  };

  const categoryBucket = (shop: Shop) =>
    hasAnySelectedCategory(shop) ? 0 : 1;

  const modeBucket = (shop: Shop): number => {
    if (sortMode === "promo-first") return shop.hasPromo ? 0 : 1;
    if (sortMode === "fast-delivery-first")
      return shop.fastDelivery ? 0 : 1;
    return 0;
  };

  const indexed = shops.map((shop, index) => ({ shop, index }));

  indexed.sort((a, b) => {
    const aCat = categoryBucket(a.shop);
    const bCat = categoryBucket(b.shop);
    if (aCat !== bCat) return aCat - bCat;

    const aMode = modeBucket(a.shop);
    const bMode = modeBucket(b.shop);
    if (aMode !== bMode) return aMode - bMode;

    if (sortMode === "name-asc") {
      const cmp = a.shop.title.localeCompare(b.shop.title, "ru");
      if (cmp !== 0) return cmp;
    }

    return a.index - b.index;
  });

  return indexed.map((entry) => entry.shop);
}
