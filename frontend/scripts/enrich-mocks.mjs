import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const mocksDir = path.join(root, "src", "mocks");

const shopsPath = path.join(mocksDir, "shops.json");
const cityListPath = path.join(mocksDir, "city-list.json");
const categoryListPath = path.join(mocksDir, "category-list.json");
const featureListPath = path.join(mocksDir, "feature-list.json");

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

function toMapByCode(list) {
  const out = new Map();
  for (const item of list ?? []) {
    const code = String(item?.code ?? "").trim();
    if (!code) continue;
    out.set(code, {
      code,
      name: String(item?.name ?? code).trim() || code,
      sort: Number.isFinite(item?.sort) ? item.sort : null,
    });
  }
  return out;
}

function nextSort(map) {
  const sorts = [...map.values()]
    .map((item) => item.sort)
    .filter((v) => Number.isFinite(v));
  if (sorts.length === 0) return 0;
  return Math.max(...sorts) + 10;
}

function ensureRef(map, code) {
  const key = String(code ?? "").trim();
  if (!key) return;
  if (map.has(key)) return;
  map.set(key, { code: key, name: key, sort: nextSort(map) });
}

function toSortedList(map) {
  return [...map.values()]
    .map((item) => ({
      code: item.code,
      name: item.name,
      sort: Number.isFinite(item.sort) ? item.sort : 0,
    }))
    .sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code, "ru"));
}

async function main() {
  const shops = JSON.parse(await fs.readFile(shopsPath, "utf8"));
  const cityList = JSON.parse(await fs.readFile(cityListPath, "utf8"));
  const categoryList = JSON.parse(await fs.readFile(categoryListPath, "utf8"));
  const featureList = JSON.parse(await fs.readFile(featureListPath, "utf8"));

  const nextShops = enrichShops(shops);
  const cityMap = toMapByCode(cityList);
  const categoryMap = toMapByCode(categoryList);
  const featureMap = toMapByCode(featureList);

  for (const shop of nextShops) {
    ensureRef(cityMap, shop.cityCode);
    for (const code of shop.categoryCodes ?? []) {
      ensureRef(categoryMap, code);
    }
    for (const code of shop.featureCodes ?? []) {
      ensureRef(featureMap, code);
    }
  }

  await fs.writeFile(cityListPath, `${JSON.stringify(toSortedList(cityMap), null, 2)}\n`, "utf8");
  await fs.writeFile(
    categoryListPath,
    `${JSON.stringify(toSortedList(categoryMap), null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    featureListPath,
    `${JSON.stringify(toSortedList(featureMap), null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(shopsPath, `${JSON.stringify(nextShops, null, 2)}\n`, "utf8");

  console.log("enrich:mocks OK");
}

main().catch((err) => {
  console.error(`enrich:mocks FAIL: ${err.message}`);
  process.exit(1);
});
