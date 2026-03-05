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
    id: city.id,
    name: city.name,
    sort: Number.isFinite(city.sort) ? city.sort : toSort(index),
  }));
}

function toRefList(values) {
  return values.map((name, index) => ({
    id: name,
    name,
    sort: toSort(index),
  }));
}

function enrichShops(shops) {
  return shops.map((shop) => ({
    ...shop,
    cityId: shop.city,
    categoryIds: Array.isArray(shop.categories) ? shop.categories.slice() : [],
    featureIds: Array.isArray(shop.features) ? shop.features.slice() : [],
  }));
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
