import { describe, expect, it } from "vitest";
import { sortShopsBySelectedFeature } from "./sortShops";
import type { Shop } from "../types";

const baseShop = (
  code: string,
  categoryIds: string[],
  featureIds: string[],
): Shop => ({
  code,
  cityId: "barnaul",
  title: code,
  slogan: "",
  description: "",
  scheduleNote: "",
  siteUrl: "",
  latitude: null,
  longitude: null,
  categoryIds,
  featureIds,
});

describe("sortShopsBySelectedFeature", () => {
  it("t1: категория + фича — порядок A1/A2/B1/B2", () => {
    const shops: Shop[] = [
      baseShop("A1", ["A"], ["F"]),
      baseShop("A2", ["A"], []),
      baseShop("B1", [], ["F"]),
      baseShop("B2", [], []),
    ];

    const result = sortShopsBySelectedFeature({
      shops,
      selectedCategoryIds: ["A"],
      selectedFeatureId: "F",
    });

    expect(result.map((shop) => shop.code)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
    ]);
  });

  it("t2: чистая фича без категории — фича-совпавшие первыми", () => {
    const shops: Shop[] = [
      baseShop("N1", [], []),
      baseShop("F1", [], ["F"]),
      baseShop("N2", [], []),
      baseShop("F2", [], ["F"]),
    ];

    const result = sortShopsBySelectedFeature({
      shops,
      selectedCategoryIds: [],
      selectedFeatureId: "F",
    });

    expect(result.map((shop) => shop.code)).toEqual([
      "F1",
      "F2",
      "N1",
      "N2",
    ]);
  });

  it("t3: фича null + категория — категория-совпавшие первыми (stable)", () => {
    const shops: Shop[] = [
      baseShop("N1", [], []),
      baseShop("C1", ["A"], []),
      baseShop("N2", [], []),
      baseShop("C2", ["A"], []),
    ];

    const result = sortShopsBySelectedFeature({
      shops,
      selectedCategoryIds: ["A"],
      selectedFeatureId: null,
    });

    expect(result.map((shop) => shop.code)).toEqual([
      "C1",
      "C2",
      "N1",
      "N2",
    ]);
  });

  it("t4: фича null без категории — исходный порядок", () => {
    const shops: Shop[] = [
      baseShop("X1", [], []),
      baseShop("X2", [], []),
      baseShop("X3", [], []),
    ];

    const result = sortShopsBySelectedFeature({
      shops,
      selectedCategoryIds: [],
      selectedFeatureId: null,
    });

    expect(result.map((shop) => shop.code)).toEqual([
      "X1",
      "X2",
      "X3",
    ]);
  });

  it("t5: один бакет — сохраняется входной порядок (stable)", () => {
    const shops: Shop[] = [
      baseShop("P", ["A"], ["F"]),
      baseShop("Q", ["A"], ["F"]),
    ];

    const result = sortShopsBySelectedFeature({
      shops,
      selectedCategoryIds: ["A"],
      selectedFeatureId: "F",
    });

    expect(result.map((shop) => shop.code)).toEqual(["P", "Q"]);
  });
});
