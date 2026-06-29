import type { Shop } from "../types";
import type { SortMode } from "../state";
import { FEATURE } from "../constants/features";

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
    if (sortMode === "promo-first")
      return shop.featureIds.includes(String(FEATURE.PROMO)) ? 0 : 1;
    if (sortMode === "fast-delivery-first")
      return shop.featureIds.includes(String(FEATURE.FAST_DELIVERY))
        ? 0
        : 1;
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

export function sortShopsBySelectedFeature(params: {
  shops: Shop[];
  selectedCategoryIds: string[];
  selectedFeatureId: string | null;
}): Shop[] {
  const { shops, selectedCategoryIds, selectedFeatureId } =
    params;

  const hasAnySelectedCategory = (shop: Shop) => {
    if (selectedCategoryIds.length === 0) return false;
    return shop.categoryIds.some((id) =>
      selectedCategoryIds.includes(id),
    );
  };

  const hasSelectedFeature = (shop: Shop) => {
    if (!selectedFeatureId) return false;
    return shop.featureIds.includes(selectedFeatureId);
  };

  const A: Shop[] = [];
  const B: Shop[] = [];

  for (const s of shops) {
    (hasAnySelectedCategory(s) ? A : B).push(s);
  }

  const splitByFeature = (arr: Shop[]) => {
    const withF: Shop[] = [];
    const withoutF: Shop[] = [];
    for (const s of arr) {
      (hasSelectedFeature(s) ? withF : withoutF).push(s);
    }
    return { withF, withoutF };
  };

  const { withF: A1, withoutF: A2 } = splitByFeature(A);
  const { withF: B1, withoutF: B2 } = splitByFeature(B);

  // a) has category + has feature
  // b) has category + no feature
  // c) no category + has feature
  // d) no category + no feature
  return [...A1, ...A2, ...B1, ...B2];
}
