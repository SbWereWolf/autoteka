import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const mocksDir = path.join(root, "src", "mocks");

const dictsPath = path.join(mocksDir, "dicts.json");
const shopsPath = path.join(mocksDir, "shops.json");
const cityListPath = path.join(mocksDir, "city-list.json");
const categoryListPath = path.join(mocksDir, "category-list.json");
const featureListPath = path.join(mocksDir, "feature-list.json");

const toSort = (index) => index * 10;

function toCityList(dicts) {
  return dicts.cities.map((city, index) => ({
    code: String(city.code ?? city.id ?? "").trim(),
    name: city.name,
    sort: Number.isFinite(city.sort) ? city.sort : toSort(index),
  }));
}

function toRefList(values) {
  return values.map((name, index) => ({
    code: name,
    name,
    sort: toSort(index),
  }));
}

function enrichShops(shops) {
  return shops.map((shop) => {
    const {
      id,
      city,
      categories,
      features,
      cityId,
      categoryIds,
      featureIds,
      ...rest
    } = shop;
    return {
      ...rest,
      code: String(shop.code ?? id ?? "").trim(),
      cityCode: String(shop.cityCode ?? cityCodeFrom(shop, city, cityId)).trim(),
      categoryCodes: normalizeCodes(shop.categoryCodes, categories, categoryIds),
      featureCodes: normalizeCodes(shop.featureCodes, features, featureIds),
    };
  });
}

function cityCodeFrom(shop, city, cityId) {
  return shop.cityCode ?? city ?? cityId ?? "";
}

function normalizeCodes(primary, legacyNames, legacyIds) {
  if (Array.isArray(primary)) return primary.slice();
  if (Array.isArray(legacyNames)) return legacyNames.slice();
  if (Array.isArray(legacyIds)) return legacyIds.slice();
  return [];
}

async function main() {
  const dicts = JSON.parse(await fs.readFile(dictsPath, "utf8"));
  const shops = JSON.parse(await fs.readFile(shopsPath, "utf8"));

  const cityList = toCityList(dicts);
  const categoryList = toRefList(dicts.categories ?? []);
  const featureList = toRefList(dicts.features ?? []);
  const nextShops = enrichShops(shops);

  await fs.writeFile(cityListPath, `${JSON.stringify(cityList, null, 2)}\n`, "utf8");
  await fs.writeFile(categoryListPath, `${JSON.stringify(categoryList, null, 2)}\n`, "utf8");
  await fs.writeFile(featureListPath, `${JSON.stringify(featureList, null, 2)}\n`, "utf8");
  await fs.writeFile(shopsPath, `${JSON.stringify(nextShops, null, 2)}\n`, "utf8");

  console.log("enrich:mocks OK");
}

main().catch((err) => {
  console.error(`enrich:mocks FAIL: ${err.message}`);
  process.exit(1);
});
