import type { Shop } from "../types";

export function sortShopsByRules(params: {
  shops: Shop[];
  selectedCategoryIds: string[];
  selectedFeatureId: string | null;
}): Shop[] {
  const { shops, selectedCategoryIds, selectedFeatureId } = params;

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
