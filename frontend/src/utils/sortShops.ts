import type { Shop } from "../types";

export function sortShopsByRules(params: {
  shops: Shop[];
  selectedCategoryCodes: string[];
  selectedFeatureCode: string | null;
}): Shop[] {
  const { shops, selectedCategoryCodes, selectedFeatureCode } =
    params;

  const hasAnySelectedCategory = (shop: Shop) => {
    if (selectedCategoryCodes.length === 0) return false;
    return shop.categoryCodes.some((code) =>
      selectedCategoryCodes.includes(code),
    );
  };

  const hasSelectedFeature = (shop: Shop) => {
    if (!selectedFeatureCode) return false;
    return shop.featureCodes.includes(selectedFeatureCode);
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
