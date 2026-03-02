export type Shop = {
  id: string;
  name: string;
  city: string;
  categories: string[];
  features: string[];
  workHours: string;
  description: string;
  contacts: { type: string; value: string }[];
  siteUrl: string;
  gallery: { kind: string; label: string }[];
};

export function sortShopsByRules(params: {
  shops: Shop[];
  selectedCategories: string[];
  selectedFeature: string | null;
}): Shop[] {
  const { shops, selectedCategories, selectedFeature } = params;

  const hasAnySelectedCategory = (shop: Shop) => {
    if (selectedCategories.length === 0) return false;
    return shop.categories.some((c) => selectedCategories.includes(c));
  };

  const hasSelectedFeature = (shop: Shop) => {
    if (!selectedFeature) return false;
    return shop.features.includes(selectedFeature);
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
