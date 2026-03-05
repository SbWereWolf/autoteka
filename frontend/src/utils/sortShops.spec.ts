import { describe, expect, it } from "vitest";
import { sortShopsByRules } from "./sortShops";
import type { Shop } from "../types";

const baseShop = (
  code: string,
  categoryCodes: string[],
  featureCodes: string[],
): Shop => ({
  code,
  cityCode: "barnaul",
  name: code,
  description: "",
  workHours: "",
  siteUrl: "",
  categoryCodes,
  featureCodes,
});

describe("sortShopsByRules", () => {
  it("сортирует по группам A1/A2/B1/B2", () => {
    const shops: Shop[] = [
      baseShop("A1", ["A"], ["F"]),
      baseShop("A2", ["A"], []),
      baseShop("B1", [], ["F"]),
      baseShop("B2", [], []),
    ];

    const result = sortShopsByRules({
      shops,
      selectedCategoryCodes: ["A"],
      selectedFeatureCode: "F",
    });

    expect(result.map((shop) => shop.code)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
    ]);
  });
});
